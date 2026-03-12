import { Router } from "express";
import { getRoomState } from "../db.js";

const router = Router();

/**
 * @openapi
 * /api/room/{roomId}/state/{key}:
 *   get:
 *     summary: Get a keyed state for a room
 *     description: Returns the state stored under the given key for a room.
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
 *     responses:
 *       200:
 *         description: The keyed state object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       500:
 *         description: Internal server error
 */
router.get("/api/room/:roomId/state/:key", async (req, res) => {
    try {
        const state = await getRoomState(req.params.roomId, req.params.key);
        res.json(state);
    } catch (e) {
        console.error("Error reading room state:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
