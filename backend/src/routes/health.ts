import { Router } from "express";
import { db } from "../db.js";
import { sql } from "drizzle-orm";

const router = Router();

/**
 * @openapi
 * /api/health:
 *   get:
 *     summary: Health check
 *     description: Returns the health status of the service and its database connection.
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *       503:
 *         description: Service is unhealthy
 */
router.get("/api/health", async (_req, res) => {
    try {
        await db.execute(sql`SELECT 1`);
        res.json({ status: "ok" });
    } catch {
        res.status(503).json({ status: "unhealthy" });
    }
});

export default router;
