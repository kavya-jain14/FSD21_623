const cors = require("cors");
const express = require("express");

function createApp() {
  const app = express();
  let nextId = 5;
  let modules = [
    { id: 1, title: "JavaScript fundamentals", completed: true },
    { id: 2, title: "Node.js modules", completed: true },
    { id: 3, title: "Express REST API", completed: false },
    { id: 4, title: "React integration", completed: false }
  ];

  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (request, response) => {
    response.json({ status: "ok" });
  });

  app.get("/api/modules", (request, response) => {
    response.json(modules);
  });

  app.post("/api/modules", (request, response) => {
    const title = String(request.body.title || "").trim();

    if (!title) {
      response.status(400).json({ message: "Title is required" });
      return;
    }

    const module = {
      id: nextId,
      title,
      completed: false
    };

    nextId += 1;
    modules.push(module);
    response.status(201).json(module);
  });

  app.patch("/api/modules/:id", (request, response) => {
    const module = modules.find((item) => item.id === Number(request.params.id));

    if (!module) {
      response.status(404).json({ message: "Module not found" });
      return;
    }

    module.completed = Boolean(request.body.completed);
    response.json(module);
  });

  app.delete("/api/modules/:id", (request, response) => {
    const id = Number(request.params.id);
    const module = modules.find((item) => item.id === id);

    if (!module) {
      response.status(404).json({ message: "Module not found" });
      return;
    }

    modules = modules.filter((item) => item.id !== id);
    response.json({ message: "Module deleted", module });
  });

  return app;
}

module.exports = { createApp };

