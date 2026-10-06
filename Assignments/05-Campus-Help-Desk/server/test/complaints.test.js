const { test } = require("node:test");
const assert = require("node:assert/strict");
const { mkdtemp, rm, writeFile, readFile } = require("node:fs/promises");
const { tmpdir } = require("node:os");
const path = require("node:path");
const { once } = require("node:events");
const { createApp } = require("../src/app");

const valid = { studentName: "Test Student", rollNumber: "CSE-TEST", email: "student@example.com", category: "IT & Wi-Fi", location: "Library", title: "Wi-Fi is not connecting", description: "The library network has been unavailable since morning.", priority: "Normal" };

async function setup(t) {
  const directory = await mkdtemp(path.join(tmpdir(), "fsd-help-desk-"));
  const dataFile = path.join(directory, "complaints.json");
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
      return { status: response.status, body: await response.json() };
    },
    async raw(body) { return fetch(base + "/api/complaints", { method: "POST", headers: { "Content-Type": "application/json" }, body }); },
    async restart() { await stop(); await start(); }
  };
}

test("submitting and updating a ticket persists across server restarts", async (t) => {
  const api = await setup(t);
  const created = await api.call("/api/complaints", "POST", valid);
  assert.equal(created.status, 201);
  assert.equal(created.body.status, "Open");
  assert.match(created.body.ticketNumber, /^HD-[A-F0-9]{8}$/);
  await api.restart();
  assert.deepEqual((await api.call("/api/complaints/" + created.body.id)).body, created.body);
  assert.equal((await api.call("/api/complaints/" + created.body.id + "/status", "PATCH", { status: "Resolved" })).body.status, "Resolved");
  await api.restart();
  const list = (await api.call("/api/complaints")).body;
  assert.equal(list.items[0].status, "Resolved");
  assert.equal(list.summary.Resolved, 1);
});

test("search, category and status filters combine without changing global counts", async (t) => {
  const api = await setup(t);
  await api.call("/api/complaints", "POST", valid);
  const other = await api.call("/api/complaints", "POST", { ...valid, title: "Broken fan", category: "Classroom", location: "Room 204" });
  await api.call("/api/complaints/" + other.body.id + "/status", "PATCH", { status: "In Progress" });
  const result = (await api.call("/api/complaints?q=FAN&category=Classroom&status=In%20Progress")).body;
  assert.equal(result.total, 1);
  assert.equal(result.items[0].id, other.body.id);
  assert.equal(result.count, 2);
  assert.deepEqual(result.summary, { Open: 1, "In Progress": 1, Resolved: 0 });
  assert.equal((await api.call("/api/complaints?q=" + other.body.ticketNumber.toLowerCase())).body.total, 1);
});

test("overlapping submissions are all saved", async (t) => {
  const api = await setup(t);
  const results = await Promise.all(Array.from({ length: 20 }, (_, index) => api.call("/api/complaints", "POST", { ...valid, title: "Problem " + index })));
  assert.ok(results.every((result) => result.status === 201));
  await api.restart();
  const list = (await api.call("/api/complaints")).body;
  assert.equal(list.count, 20);
  assert.equal(new Set(list.items.map((item) => item.id)).size, 20);
});

test("invalid bodies, filters and missing tickets produce useful errors", async (t) => {
  const api = await setup(t);
  for (const body of [null, [], {}, { ...valid, email: "invalid" }, { ...valid, priority: "Emergency" }, { ...valid, description: "short" }, { ...valid, studentName: 12 }]) {
    assert.equal((await api.call("/api/complaints", "POST", body)).status, 400);
  }
  assert.equal((await api.raw("{broken")).status, 400);
  assert.equal((await api.call("/api/complaints?status=Unknown")).status, 400);
  assert.equal((await api.call("/api/complaints?q=test&q=another")).status, 400);
  assert.equal((await api.call("/api/complaints/missing")).status, 404);
  assert.equal((await api.call("/api/complaints/missing/status", "PATCH", { status: "Open" })).status, 404);
  assert.equal((await api.call("/api/complaints")).body.count, 0);
});

test("damaged storage is reported without overwriting the file", async (t) => {
  const api = await setup(t);
  await writeFile(api.dataFile, "not-json");
  assert.equal((await api.call("/api/complaints", "POST", valid)).status, 500);
  assert.equal(await readFile(api.dataFile, "utf8"), "not-json");
});
