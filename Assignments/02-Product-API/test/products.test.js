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

test("returns 100 products", async () => {
  const response = await fetch(`${baseUrl}/products`);
  const products = await response.json();

  assert.equal(response.status, 200);
  assert.equal(products.length, 100);
});

test("creates, updates and deletes a product", async () => {
  const createResponse = await fetch(`${baseUrl}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Keyboard", price: 2499 })
  });
  const createdProduct = await createResponse.json();

  assert.equal(createResponse.status, 201);
  assert.equal(createdProduct.id, 101);

  const updateResponse = await fetch(`${baseUrl}/products/101`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ price: 2199 })
  });
  const updatedProduct = await updateResponse.json();

  assert.equal(updatedProduct.price, 2199);

  const deleteResponse = await fetch(`${baseUrl}/products/101`, {
    method: "DELETE"
  });

  assert.equal(deleteResponse.status, 200);
});

test("rejects invalid product data", async () => {
  const response = await fetch(`${baseUrl}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "", price: -1 })
  });

  assert.equal(response.status, 400);
});

