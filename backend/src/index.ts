import express from "express";
import cors from "cors";
import fs from "node:fs/promises";
import path from "node:path";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");

// Ensure data directory exists on startup
await fs.mkdir(DATA_DIR, { recursive: true });

function roomFilePath(roomId: string): string {
    // Sanitize roomId to prevent path traversal
    const safe = roomId.replace(/[^a-zA-Z0-9_-]/g, "_");
    return path.join(DATA_DIR, `${safe}.json`);
}

/**
 * GET /api/room/:roomId
 * Returns the full room state object.
 * The roomId acts as both identifier and auth.
 */
app.get("/api/room/:roomId", async (req, res) => {
    const filePath = roomFilePath(req.params.roomId);

    try {
        const data = await fs.readFile(filePath, "utf-8");
        res.json(JSON.parse(data));
    } catch (e) {
        if ((e as NodeJS.ErrnoException).code === "ENOENT") {
            res.json({});
        } else {
            console.error("Error reading room state:", e);
            res.status(500).json({ error: "Internal server error" });
        }
    }
});

/**
 * POST /api/room/:roomId
 * Shallow-merges the request body into the existing room state.
 * This mirrors the behavior of OBR.room.setMetadata() which does a shallow merge.
 * The roomId acts as both identifier and auth.
 */
app.post("/api/room/:roomId", async (req, res) => {
    if (typeof req.body !== "object" || req.body === null || Array.isArray(req.body)) {
        res.status(400).json({ error: "Request body must be a JSON object" });
        return;
    }

    const filePath = roomFilePath(req.params.roomId);

    let existing: Record<string, unknown> = {};
    try {
        const data = await fs.readFile(filePath, "utf-8");
        existing = JSON.parse(data);
    } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== "ENOENT") {
            console.error("Error reading existing room state:", e);
            res.status(500).json({ error: "Internal server error" });
            return;
        }
        // File doesn't exist yet, start fresh
    }

    const merged = { ...existing, ...req.body };

    try {
        await fs.writeFile(filePath, JSON.stringify(merged, null, 2));
        res.json(merged);
    } catch (e) {
        console.error("Error writing room state:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * PUT /api/room/:roomId
 * Replaces the entire room state with the request body.
 * Unlike POST which shallow-merges, this overwrites completely.
 */
app.put("/api/room/:roomId", async (req, res) => {
    if (typeof req.body !== "object" || req.body === null || Array.isArray(req.body)) {
        res.status(400).json({ error: "Request body must be a JSON object" });
        return;
    }

    const filePath = roomFilePath(req.params.roomId);

    try {
        await fs.writeFile(filePath, JSON.stringify(req.body, null, 2));
        res.json(req.body);
    } catch (e) {
        console.error("Error writing room state:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * DELETE /api/room/:roomId
 * Deletes the room state file entirely.
 */
app.delete("/api/room/:roomId", async (req, res) => {
    const filePath = roomFilePath(req.params.roomId);

    try {
        await fs.unlink(filePath);
        res.json({ status: "deleted" });
    } catch (e) {
        if ((e as NodeJS.ErrnoException).code === "ENOENT") {
            res.json({ status: "deleted" });
        } else {
            console.error("Error deleting room state:", e);
            res.status(500).json({ error: "Internal server error" });
        }
    }
});

/**
 * DELETE /api/room/:roomId/:key
 * Removes a single key from the room state.
 */
app.delete("/api/room/:roomId/:key", async (req, res) => {
    const filePath = roomFilePath(req.params.roomId);

    let existing: Record<string, unknown> = {};
    try {
        const data = await fs.readFile(filePath, "utf-8");
        existing = JSON.parse(data);
    } catch (e) {
        if ((e as NodeJS.ErrnoException).code === "ENOENT") {
            res.json({});
            return;
        }
        console.error("Error reading room state:", e);
        res.status(500).json({ error: "Internal server error" });
        return;
    }

    delete existing[req.params.key];

    try {
        await fs.writeFile(filePath, JSON.stringify(existing, null, 2));
        res.json(existing);
    } catch (e) {
        console.error("Error writing room state:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

/** Health check endpoint */
app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Backend listening on port ${PORT}`);
});
