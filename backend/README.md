# Initiative Tracker 4D - Backend

A simple state persistence backend for the OBR Initiative Tracker 4D extension.

## Overview

This backend stores room state as JSON files, using the OBR room ID as both identifier and simple auth token. It mirrors the `OBR.room.setMetadata()` / `OBR.room.getMetadata()` API by doing shallow merges on POST.

## API

### `GET /api/room/:roomId`

Returns the full room state object. Returns `{}` if the room has no stored state yet.

### `POST /api/room/:roomId`

Shallow-merges the request body into existing room state (same semantics as `OBR.room.setMetadata()`). Returns the full merged state.

### `PUT /api/room/:roomId`

Replaces the entire room state with the request body (full overwrite). Returns the new state.

### `DELETE /api/room/:roomId`

Deletes the room state file entirely. Idempotent – succeeds even if the room doesn't exist.

### `DELETE /api/room/:roomId/:key`

Removes a single key from the room state. Returns the updated state.

### `GET /api/health`

Health check endpoint. Returns `{ "status": "ok" }`.

## Development

```bash
cd backend
npm install
npm run dev
```

The server runs on port 3001 by default. Set `PORT` env var to change.

## Production

```bash
cd backend
npm install
npm run build
npm start
```

### Docker

```bash
cd backend
npm run build
docker build -t obr-tracker-backend .
docker run -p 3001:3001 -v tracker-data:/app/data obr-tracker-backend
```

## Environment Variables

| Variable   | Default  | Description                    |
| ---------- | -------- | ------------------------------ |
| `PORT`     | `3001`   | Port to listen on              |
| `DATA_DIR` | `./data` | Directory for JSON state files |

## Configuration

In the OBR extension admin panel, go to the **Settings** tab and enter the backend base URL (e.g., `https://your-server.com`). On save, all existing OBR metadata is automatically migrated to the backend.
