const express = require("express");
const { createProducts } = require("./products");

function createApp() {
  const app = express();
  let products = createProducts();

  app.use(express.json());

  app.get("/", (request, response) => {
    response.json({
      message: "Product API",
      totalProducts: products.length
    });
  });

  app.get("/products", (request, response) => {
    response.json(products);
  });

  app.get("/products/:id", (request, response) => {
    const product = products.find((item) => item.id === Number(request.params.id));

    if (!product) {
      response.status(404).json({ message: "Product not found" });
      return;
    }

    response.json(product);
  });

  app.post("/products", (request, response) => {
    const name = String(request.body.name || "").trim();
    const price = Number(request.body.price);

    if (!name || !Number.isFinite(price) || price < 0) {
      response.status(400).json({ message: "A valid name and price are required" });
      return;
    }

    const product = {
      id: products.length ? Math.max(...products.map((item) => item.id)) + 1 : 1,
      name,
      price
    };

    products.push(product);
    response.status(201).json(product);
  });

  app.put("/products/:id", (request, response) => {
    const product = products.find((item) => item.id === Number(request.params.id));

    if (!product) {
      response.status(404).json({ message: "Product not found" });
      return;
    }

    if (request.body.name !== undefined) {
      const name = String(request.body.name).trim();

      if (!name) {
        response.status(400).json({ message: "Name cannot be empty" });
        return;
      }

      product.name = name;
    }

    if (request.body.price !== undefined) {
      const price = Number(request.body.price);

      if (!Number.isFinite(price) || price < 0) {
        response.status(400).json({ message: "Price must be a non-negative number" });
        return;
      }

      product.price = price;
    }

    response.json(product);
  });

  app.delete("/products/:id", (request, response) => {
    const id = Number(request.params.id);
    const product = products.find((item) => item.id === id);

    if (!product) {
      response.status(404).json({ message: "Product not found" });
      return;
    }

    products = products.filter((item) => item.id !== id);
    response.json({ message: "Product deleted", product });
  });

  return app;
}

module.exports = { createApp };

