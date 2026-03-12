import { Router } from "express";
import { upsertRoomState } from "../db.js";

const router = Router();

/**
 * @openapi
 * /api/room/{roomId}/state/{key}:
 *   post:
 *     summary: Replace a keyed state for a room
 *     description: Replaces the state stored under the given key for a room with the request body.
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: The room identifier
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: The state key
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: The new keyed state
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Invalid request body
 *       500:
 *         description: Internal server error
 */
router.post("/api/room/:roomId/state/:key", async (req, res) => {
    if (typeof req.body !== "object" || req.body === null || Array.isArray(req.body)) {
        res.status(400).json({ error: "Request body must be a JSON object" });
        return;
    }

    try {
        await upsertRoomState(req.params.roomId, req.params.key, req.body);
        res.json(req.body);
    } catch (e) {
        console.error("Error writing room state:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
