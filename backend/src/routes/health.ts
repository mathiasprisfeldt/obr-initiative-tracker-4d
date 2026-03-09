import { Router } from "express";
import { pool } from "../db.js";
import type { FetchFn } from "../api-client.js";

const router = Router();

export function clientIsHealthy(_fetch: FetchFn, url: (path: string) => string) {
    return async (): Promise<boolean> => {
        try {
            const res = await _fetch(url("/api/health"));
            const body = await res.json();
            return body?.status === "ok";
        } catch {
            return false;
        }
    };
}

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
        await pool.query("SELECT 1");
        res.json({ status: "ok" });
    } catch {
        res.status(503).json({ status: "unhealthy" });
    }
});

export default router;
