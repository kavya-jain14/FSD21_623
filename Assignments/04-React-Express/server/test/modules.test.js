const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const { createApp } = require("../src/app");

let server;
let baseUrl;

before(async () => {
  server = createApp().listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

test("lists the workshop modules", async () => {
  const response = await fetch(`${baseUrl}/api/modules`);
  const modules = await response.json();

  assert.equal(response.status, 200);
  assert.equal(modules.length, 4);
});

test("creates and completes a module", async () => {
  const createResponse = await fetch(`${baseUrl}/api/modules`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Testing APIs" })
  });
  const createdModule = await createResponse.json();

  assert.equal(createResponse.status, 201);
  assert.equal(createdModule.completed, false);

  const updateResponse = await fetch(`${baseUrl}/api/modules/${createdModule.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ completed: true })
  });
  const updatedModule = await updateResponse.json();

  assert.equal(updatedModule.completed, true);
});

