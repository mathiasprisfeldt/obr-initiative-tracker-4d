import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const connectionString = process.env.DATABASE_CONNECTION_STRING;
if (!connectionString) {
    console.error("DATABASE_CONNECTION_STRING env var is required");
    process.exit(1);
}

export const pool = new pg.Pool({ connectionString });

// ---------------------------------------------------------------------------
// Run idempotent SQL migrations
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsDir = path.join(__dirname, "migrations");

const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

for (const file of migrationFiles) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
    await pool.query(sql);
}

// ---------------------------------------------------------------------------
// Room-state helpers
// ---------------------------------------------------------------------------

export async function getRoomState<T>(roomId: string, key: string): Promise<T | null> {
    const result = await pool.query(
        "SELECT state FROM room_states WHERE room_id = $1 AND key = $2",
        [roomId, key],
    );
    return result.rows.length > 0 ? (result.rows[0].state as T) : null;
}

export async function upsertRoomState<T>(roomId: string, key: string, state: T): Promise<void> {
    await pool.query(
        `INSERT INTO room_states (room_id, key, state) VALUES ($1, $2, $3)
         ON CONFLICT (room_id, key) DO UPDATE SET state = $3`,
        [roomId, key, JSON.stringify(state)],
    );
}

export async function getAllRoomStates(roomId: string): Promise<Map<string, unknown>> {
    const result = await pool.query("SELECT key, state FROM room_states WHERE room_id = $1", [
        roomId,
    ]);
    const map = new Map<string, unknown>();
    for (const row of result.rows) {
        map.set(row.key as string, row.state);
    }
    return map;
}
