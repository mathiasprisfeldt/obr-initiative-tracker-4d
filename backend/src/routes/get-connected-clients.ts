import { Router } from "express";
import { getConnectedClients } from "../ws/room-manager.js";

const router = Router();

/**
 * @openapi
 * /api/clients:
 *   get:
 *     summary: Connected clients
 *     description: Returns the list of active rooms and how many WebSocket clients are connected to each.
 *     responses:
 *       200:
 *         description: List of connected clients per room
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clients:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       roomId:
 *                         type: string
 *                       clientCount:
 *                         type: integer
 */
router.get("/api/clients", (_req, res) => {
    res.json({ clients: getConnectedClients() });
});

export default router;
