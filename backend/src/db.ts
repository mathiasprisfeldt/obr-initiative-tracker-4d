import pg from "pg";

const connectionString = process.env.DATABASE_CONNECTION_STRING;
if (!connectionString) {
    console.error("DATABASE_CONNECTION_STRING env var is required");
    process.exit(1);
}

export const pool = new pg.Pool({ connectionString });

// Create the rooms table if it doesn't exist
await pool.query(`
    CREATE TABLE IF NOT EXISTS rooms (
        room_id TEXT PRIMARY KEY,
        state   JSONB NOT NULL DEFAULT '{}'::jsonb
    )
`);

export async function getRoom(roomId: string): Promise<Record<string, unknown>> {
    const result = await pool.query("SELECT state FROM rooms WHERE room_id = $1", [roomId]);
    return result.rows.length > 0 ? (result.rows[0].state as Record<string, unknown>) : {};
}

export async function upsertRoom(roomId: string, state: Record<string, unknown>): Promise<void> {
    await pool.query(
        `INSERT INTO rooms (room_id, state) VALUES ($1, $2)
         ON CONFLICT (room_id) DO UPDATE SET state = $2`,
        [roomId, JSON.stringify(state)],
    );
}
