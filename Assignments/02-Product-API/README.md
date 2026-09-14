# Product API

An Express REST API with 100 initial products and complete CRUD operations.

## Run

```bash
npm install
npm start
```

The API starts at `http://localhost:3000`.

## Endpoints

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/products` | Get all products |
| GET | `/products/:id` | Get one product |
| POST | `/products` | Add a product |
| PUT | `/products/:id` | Update a product |
| DELETE | `/products/:id` | Delete a product |

Run `npm test` to verify the API.

