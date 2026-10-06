# Assignment 6 — Notes App

A shared student notebook built with React and Express. Students can save text notes, search them and manage their study material.

## Features

- Create notes with a title, subject, student name, text content and optional tags.
- Read full notes, edit them and delete them after confirmation.
- Search across title, content, subject, author and tags; combine search with subject or pinned-note filters.
- Pin useful notes, sort by update time or title, and download any note as a `.txt` file.
- See subjects automatically appear in the sidebar. Pinned notes appear first in every sort order.
- Responsive interface with validation, loading/error messages and accessible dialogs.

## Run

Use Node.js 22.12 or newer. From this assignment folder:

```bash
npm install
npm run dev
```

Open **http://localhost:5176**. The API runs on **http://localhost:4006**, with Vite forwarding `/api` requests. Assignment 5 uses different ports so both apps can run together.

For a single server serving the built frontend:

```bash
npm run build
npm start
```

Then open **http://localhost:4006**. Run `npm test` for API and persistence checks.

## Storage and flow

```text
React editor → fetch POST /api/notes → Express validation → JSON file → saved note
Search box → fetch GET /api/notes?q=... → filter saved notes → show matching cards
Edit/delete/pin → fetch PUT/DELETE/PATCH → update saved file → refresh notebook
```

Notes are stored in `server/data/notes.json`, created after the first valid note. They survive page refreshes and server restarts. Writes are queued and use a temporary file followed by a rename so overlapping requests do not lose notes. `DATA_FILE` can override the storage path. No external database setup is required.

The data folder is ignored by Git. Keep this file to retain notes, and run one server process per file. Notes are plain text; PDF/image uploads and rich-text formatting are outside this assignment.

## API

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Server health |
| GET | `/api/notes?q=&subject=&pinned=&sort=` | Search/filter notes; return items, counts and subjects |
| GET | `/api/notes/:id` | Read a full note |
| POST | `/api/notes` | Create a note |
| PUT | `/api/notes/:id` | Replace editable note fields |
| PATCH | `/api/notes/:id/pin` | Set `{ "pinned": true }` or `false` |
| DELETE | `/api/notes/:id` | Delete a note; returns HTTP 204 |

`POST` and `PUT` accept `title`, `subject`, `studentName`, `content` and `tags` (an array, including `[]`). Content accepts 1–20,000 characters. Up to 8 tags of 30 characters each are supported. Tags are trimmed, converted to lowercase and deduplicated. Sort values are `newest`, `oldest` and `title`. Pinned filters are `true` or `false`.

This local classroom demo uses a shared notebook where anyone can edit or delete any note. Private accounts and per-student edit permissions would be needed for public use.
