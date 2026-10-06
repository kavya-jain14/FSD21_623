const { test } = require("node:test");
const assert = require("node:assert/strict");
const { mkdtemp, rm, writeFile, readFile } = require("node:fs/promises");
const { tmpdir } = require("node:os");
const path = require("node:path");
const { once } = require("node:events");
const { createApp } = require("../src/app");

const valid = { title: "Process states", subject: "Operating Systems", studentName: "Test Student", content: "A process can be ready, running, blocked or terminated.", tags: ["Revision", "unit-1", "revision"] };

async function setup(t) {
  const directory = await mkdtemp(path.join(tmpdir(), "fsd-notes-"));
  const dataFile = path.join(directory, "notes.json");
  let server;
  let base;
  async function stop() { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); }
  async function start() { server = createApp({ dataFile }).listen(0, "127.0.0.1"); await once(server, "listening"); base = "http://127.0.0.1:" + server.address().port; }
  await start();
  t.after(async () => { await stop(); await rm(directory, { recursive: true, force: true }); });
  return {
    dataFile,
    async call(url, method = "GET", body) {
      const response = await fetch(base + url, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
      return { status: response.status, body: response.status === 204 ? null : await response.json() };
    },
    async restart() { await stop(); await start(); }
  };
}

test("note creation, edits and pins persist across restarts", async (t) => {
  const api = await setup(t);
  const created = await api.call("/api/notes", "POST", valid);
  assert.equal(created.status, 201);
  assert.deepEqual(created.body.tags, ["revision", "unit-1"]);
  const url = "/api/notes/" + created.body.id;
  await api.call(url, "PUT", { ...valid, content: "Updated explanation of scheduling." });
  await api.call(url + "/pin", "PATCH", { pinned: true });
  await api.restart();
  const note = (await api.call(url)).body;
  assert.equal(note.content, "Updated explanation of scheduling.");
  assert.equal(note.pinned, true);
  assert.equal(note.createdAt, created.body.createdAt);
});

test("search covers content, title, author and tags with combined subject filters", async (t) => {
  const api = await setup(t);
  const first = await api.call("/api/notes", "POST", valid);
  await api.call("/api/notes", "POST", { ...valid, title: "Promise chaining", subject: "JavaScript", studentName: "Another Student", tags: ["async"], content: "Use then and catch to handle a Promise." });
  for (const q of ["PROCESS", "blocked", "Test Student", "unit-1"]) {
    const list = (await api.call("/api/notes?" + new URLSearchParams({ q, subject: "Operating Systems" }))).body;
    assert.equal(list.total, 1);
    assert.equal(list.items[0].id, first.body.id);
    assert.deepEqual(list.subjects, ["JavaScript", "Operating Systems"]);
    assert.equal(list.count, 2);
  }
  assert.equal((await api.call("/api/notes?q=no-match")).body.total, 0);
});

test("pin filters and title sorting work, and deletion survives a restart", async (t) => {
  const api = await setup(t);
  const z = await api.call("/api/notes", "POST", { ...valid, title: "Zebra" });
  const a = await api.call("/api/notes", "POST", { ...valid, title: "Alpha" });
  assert.deepEqual((await api.call("/api/notes?sort=title")).body.items.map((item) => item.title), ["Alpha", "Zebra"]);
  await api.call("/api/notes/" + z.body.id + "/pin", "PATCH", { pinned: true });
  assert.deepEqual((await api.call("/api/notes?pinned=true")).body.items.map((item) => item.id), [z.body.id]);
  assert.equal((await api.call("/api/notes?sort=title")).body.items[0].id, z.body.id);
  assert.equal((await api.call("/api/notes/" + a.body.id, "DELETE")).status, 204);
  await api.restart();
  assert.equal((await api.call("/api/notes/" + a.body.id)).status, 404);
  assert.equal((await api.call("/api/notes")).body.count, 1);
});

test("overlapping writes do not lose student notes", async (t) => {
  const api = await setup(t);
  const results = await Promise.all(Array.from({ length: 20 }, (_, index) => api.call("/api/notes", "POST", { ...valid, title: "Note " + index })));
  assert.ok(results.every((result) => result.status === 201));
  await api.restart();
  assert.equal((await api.call("/api/notes")).body.count, 20);
});

test("invalid notes, oversized bodies and incorrect pin values are rejected", async (t) => {
  const api = await setup(t);
  for (const body of [null, [], {}, { ...valid, content: " " }, { ...valid, tags: "revision" }, { ...valid, tags: [12] }, { ...valid, tags: Array(9).fill("tag") }, { ...valid, content: "x".repeat(20001) }]) {
    assert.equal((await api.call("/api/notes", "POST", body)).status, 400);
  }
  assert.equal((await api.call("/api/notes", "POST", { ...valid, content: "x".repeat(150000) })).status, 413);
  assert.equal((await api.call("/api/notes/missing/pin", "PATCH", { pinned: "true" })).status, 400);
  assert.equal((await api.call("/api/notes/missing", "PUT", valid)).status, 404);
  assert.equal((await api.call("/api/notes?sort=invalid")).status, 400);
  assert.equal((await api.call("/api/notes?pinned=yes")).status, 400);
  assert.equal((await api.call("/api/notes")).body.count, 0);
});

test("damaged storage is reported without silently removing existing data", async (t) => {
  const api = await setup(t);
  await writeFile(api.dataFile, "not-json");
  assert.equal((await api.call("/api/notes", "POST", valid)).status, 500);
  assert.equal(await readFile(api.dataFile, "utf8"), "not-json");
});
