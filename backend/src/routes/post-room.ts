import { Router } from "express";
import { upsertRoom } from "../db.js";

const router = Router();

/**
 * @openapi
 * /api/room/{roomId}:
 *   post:
 *     summary: Replace room state
 *     description: Replaces the entire room state with the request body.
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: The room identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: The new room state
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Invalid request body
 *       500:
 *         description: Internal server error
 */
router.post("/api/room/:roomId", async (req, res) => {
    if (typeof req.body !== "object" || req.body === null || Array.isArray(req.body)) {
        res.status(400).json({ error: "Request body must be a JSON object" });
        return;
    }

    try {
        await upsertRoom(req.params.roomId, req.body);
        res.json(req.body);
    } catch (e) {
        console.error("Error writing room state:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
