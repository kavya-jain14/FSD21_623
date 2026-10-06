# Assignment 5 — Campus Help Desk

A React frontend and Express backend for reporting campus problems through a form and tracking them as tickets.

## Features

- Submit student name, roll number, email, category, location, title, description and priority.
- Receive a unique ticket ID; every new complaint starts with the status `Open`.
- Search by title, description, ticket number, location, student name or roll number.
- Combine category and status filters, open ticket details and update the status to `Open`, `In Progress` or `Resolved`.
- See overall ticket counts. Validation and loading/error messages are provided on both sides.
- Responsive interface with keyboard-accessible forms and dialogs.

## Run

Use Node.js 22.12 or newer. From this assignment folder:

```bash
npm install
npm run dev
```

Open **http://localhost:5175**. The API runs on **http://localhost:4005**. Vite forwards `/api` requests to Express. Assignment 6 uses different ports so both apps can run together.

For a single server serving the built frontend:

```bash
npm run build
npm start
```

Then open **http://localhost:4005**. Use `npm test` to run the API and persistence checks.

## Storage and flow

```text
React form → fetch POST /api/complaints → Express validation → JSON file → ticket response
React board → fetch GET /api/complaints → search/filter saved records → render tickets
Status form → fetch PATCH /api/complaints/:id/status → update JSON file → refresh board
```

Records are stored in `server/data/complaints.json`, created automatically after the first valid submission. They survive refreshes and server restarts. Submissions are queued and written through a temporary file before replacing the saved file. No browser-only localStorage or external database is used. `DATA_FILE` can override the storage path.

The data folder is ignored by Git so actual student submissions are not uploaded. Keep this file to retain submissions. Use a single server process with this file store.

## API

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Server health |
| GET | `/api/complaints?q=&category=&status=` | Search/filter tickets; return items, counts and summary |
| GET | `/api/complaints/:id` | Read one ticket |
| POST | `/api/complaints` | Validate and create a ticket |
| PATCH | `/api/complaints/:id/status` | Update status with `{ "status": "Resolved" }` |

`POST` accepts the eight form fields listed above. Category options: `IT & Wi-Fi`, `Classroom`, `Hostel`, `Library`, `Transport`, `Other`. Priority options: `Low`, `Normal`, `Urgent`. Descriptions must contain 10–4000 characters. Invalid input returns JSON with a `message` and HTTP 400; a missing ticket returns 404.

This is a local classroom demo with a shared board: anyone using it can read tickets and change their status. A public campus service would need student authentication and staff-only status updates.
