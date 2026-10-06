const express = require("express");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const { createStore } = require("./store");
const { fail, objectBody, text, choice, queryText } = require("./validation");

function validateNote(body) {
  objectBody(body);
  if (!Array.isArray(body.tags) || body.tags.length > 8) fail("Add up to 8 tags");
  return {
    title: text(body.title, "Title", 120),
    subject: text(body.subject, "Subject", 60),
    studentName: text(body.studentName, "Student name", 80),
    content: text(body.content, "Note", 20000),
    tags: [...new Set(body.tags.map((value) => text(value, "Tag", 30).toLowerCase()))]
  };
}

function createApp({ dataFile = process.env.DATA_FILE || path.join(__dirname, "../data/notes.json") } = {}) {
  const app = express();
  const store = createStore(dataFile);
  app.disable("x-powered-by");
  app.use(express.json({ limit: "128kb" }));
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));

  app.get("/api/notes", async (req, res) => {
    const q = queryText(req.query.q, "Search").toLowerCase();
    const subject = queryText(req.query.subject, "Subject", 60);
    const pinned = queryText(req.query.pinned, "Pinned", 5);
    if (pinned) choice(pinned, "pinned filter", ["true", "false"]);
    const sort = req.query.sort === undefined ? "newest" : choice(req.query.sort, "sort order", ["newest", "oldest", "title"]);
    const records = await store.read();
    const items = records.filter((item) =>
      (!subject || item.subject === subject) && (!pinned || item.pinned === (pinned === "true")) &&
      [item.title, item.subject, item.studentName, item.content, ...item.tags].join(" ").toLowerCase().includes(q)
    ).sort((a, b) => {
      if (a.pinned !== b.pinned) return Number(b.pinned) - Number(a.pinned);
      if (sort === "title") return a.title.localeCompare(b.title);
      return sort === "oldest" ? a.updatedAt.localeCompare(b.updatedAt) : b.updatedAt.localeCompare(a.updatedAt);
    });
    res.json({ items, total: items.length, count: records.length,
      subjects: [...new Set(records.map((item) => item.subject))].sort((a, b) => a.localeCompare(b)) });
  });

  app.get("/api/notes/:id", async (req, res) => {
    const note = (await store.read()).find((item) => item.id === req.params.id);
    if (!note) fail("Note not found", 404);
    res.json(note);
  });

  app.post("/api/notes", async (req, res) => {
    const fields = validateNote(req.body);
    const now = new Date().toISOString();
    const note = { id: randomUUID(), ...fields, pinned: false, createdAt: now, updatedAt: now };
    await store.update((records) => records.push(note));
    res.status(201).json(note);
  });

  app.put("/api/notes/:id", async (req, res) => {
    const fields = validateNote(req.body);
    const note = await store.update((records) => {
      const item = records.find((record) => record.id === req.params.id);
      if (!item) fail("Note not found", 404);
      Object.assign(item, fields, { updatedAt: new Date().toISOString() });
      return item;
    });
    res.json(note);
  });

  app.patch("/api/notes/:id/pin", async (req, res) => {
    objectBody(req.body);
    if (typeof req.body.pinned !== "boolean") fail("Pinned must be true or false");
    const note = await store.update((records) => {
      const item = records.find((record) => record.id === req.params.id);
      if (!item) fail("Note not found", 404);
      item.pinned = req.body.pinned;
      return item;
    });
    res.json(note);
  });

  app.delete("/api/notes/:id", async (req, res) => {
    await store.update((records) => {
      const index = records.findIndex((item) => item.id === req.params.id);
      if (index < 0) fail("Note not found", 404);
      records.splice(index, 1);
    });
    res.status(204).end();
  });

  app.use(express.static(path.join(__dirname, "../../client/dist")));
  app.use((req, res) => res.status(404).json({ message: "Route not found" }));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const status = error.status || 500;
    const message = error.type === "entity.parse.failed" ? "Send valid JSON" :
      error.type === "entity.too.large" ? "Request is too large" :
        status >= 500 ? "Unable to read or save notes. Please try again." : error.message;
    res.status(status).json({ message });
  });
  return app;
}

module.exports = { createApp };
