const express = require("express");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const { createStore } = require("./store");
const { fail, objectBody, text, choice, queryText } = require("./validation");

const categories = ["IT & Wi-Fi", "Classroom", "Hostel", "Library", "Transport", "Other"];
const priorities = ["Low", "Normal", "Urgent"];
const statuses = ["Open", "In Progress", "Resolved"];

function validateComplaint(body) {
  objectBody(body);
  const email = text(body.email, "Email", 120);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("Enter a valid email address");
  return {
    studentName: text(body.studentName, "Student name", 80),
    rollNumber: text(body.rollNumber, "Roll number", 30),
    email,
    category: choice(body.category, "category", categories),
    location: text(body.location, "Location", 120),
    title: text(body.title, "Problem title", 120),
    description: text(body.description, "Description", 4000, 10),
    priority: choice(body.priority, "priority", priorities)
  };
}

function createApp({ dataFile = process.env.DATA_FILE || path.join(__dirname, "../data/complaints.json") } = {}) {
  const app = express();
  const store = createStore(dataFile);
  app.disable("x-powered-by");
  app.use(express.json({ limit: "64kb" }));
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));

  app.get("/api/complaints", async (req, res) => {
    const q = queryText(req.query.q, "Search").toLowerCase();
    const category = queryText(req.query.category, "Category", 30);
    const status = queryText(req.query.status, "Status", 30);
    if (category) choice(category, "category", categories);
    if (status) choice(status, "status", statuses);
    const records = await store.read();
    const items = records.filter((item) =>
      (!category || item.category === category) && (!status || item.status === status) &&
      [item.ticketNumber, item.title, item.description, item.location, item.studentName, item.rollNumber]
        .join(" ").toLowerCase().includes(q)
    ).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const summary = Object.fromEntries(statuses.map((value) => [value, records.filter((item) => item.status === value).length]));
    res.json({ items, total: items.length, count: records.length, summary });
  });

  app.get("/api/complaints/:id", async (req, res) => {
    const complaint = (await store.read()).find((item) => item.id === req.params.id);
    if (!complaint) fail("Complaint not found", 404);
    res.json(complaint);
  });

  app.post("/api/complaints", async (req, res) => {
    const fields = validateComplaint(req.body);
    const id = randomUUID();
    const now = new Date().toISOString();
    const complaint = { id, ticketNumber: "HD-" + id.slice(0, 8).toUpperCase(), ...fields, status: "Open", createdAt: now, updatedAt: now };
    await store.update((records) => records.push(complaint));
    res.status(201).json(complaint);
  });

  app.patch("/api/complaints/:id/status", async (req, res) => {
    objectBody(req.body);
    const status = choice(req.body.status, "status", statuses);
    const complaint = await store.update((records) => {
      const item = records.find((record) => record.id === req.params.id);
      if (!item) fail("Complaint not found", 404);
      item.status = status;
      item.updatedAt = new Date().toISOString();
      return item;
    });
    res.json(complaint);
  });

  app.use(express.static(path.join(__dirname, "../../client/dist")));
  app.use((req, res) => res.status(404).json({ message: "Route not found" }));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const status = error.status || 500;
    const message = error.type === "entity.parse.failed" ? "Send valid JSON" :
      error.type === "entity.too.large" ? "Request is too large" :
        status >= 500 ? "Unable to read or save complaints. Please try again." : error.message;
    res.status(status).json({ message });
  });
  return app;
}

module.exports = { createApp };
