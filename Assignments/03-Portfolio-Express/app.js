const express = require("express");
const path = require("path");

function createApp() {
  const app = express();

  app.use(express.static(path.join(__dirname, "public")));

  app.get("/api/profile", (request, response) => {
    response.json({
      name: "Kavya Jain",
      role: "Full Stack Developer",
      course: "B.Tech CSE",
      college: "ABES Engineering College"
    });
  });

  app.get("*path", (request, response) => {
    response.sendFile(path.join(__dirname, "public", "index.html"));
  });

  return app;
}

module.exports = { createApp };

