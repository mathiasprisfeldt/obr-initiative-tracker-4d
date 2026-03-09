import { Router } from "express";
import { getRoom } from "../db.js";
import type { FetchFn } from "../api-client.js";

const router = Router();

export function clientGetRoom(_fetch: FetchFn, url: (path: string) => string) {
    return (roomId: string): Promise<Response> => {
        return _fetch(url(`/api/room/${encodeURIComponent(roomId)}`));
    };
}

/**
 * @openapi
 * /api/room/{roomId}:
 *   get:
 *     summary: Get room state
 *     description: Returns the full room state object. The roomId acts as both identifier and auth.
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: The room identifier
 *     responses:
 *       200:
 *         description: The room state object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       500:
 *         description: Internal server error
 */
router.get("/api/room/:roomId", async (req, res) => {
    try {
        const state = await getRoom(req.params.roomId);
        res.json(state);
    } catch (e) {
        console.error("Error reading room state:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
