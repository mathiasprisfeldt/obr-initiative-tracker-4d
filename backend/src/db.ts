import { drizzle } from "drizzle-orm/node-mssql";
import { eq, and, sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-mssql/migrator";
import mssql from "mssql";
import path from "path";
import { fileURLToPath } from "url";
import { roomStates } from "./schema.js";

const connectionString = process.env.DATABASE_CONNECTION_STRING;
if (!connectionString) {
    console.error("DATABASE_CONNECTION_STRING env var is required");
    process.exit(1);
}

// Ensure the database exists before connecting to it
const masterConn = connectionString.replace(/Database=[^;]+/, "Database=master");
let masterPool: mssql.ConnectionPool;
while (true) {
    try {
        masterPool = await new mssql.ConnectionPool(masterConn).connect();
        break;
    } catch (e) {
        console.log("Waiting for database to be ready...", (e as Error).message);
        await new Promise((r) => setTimeout(r, 2000));
    }
}
await masterPool.request().query(`
    IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'obr-initiative-tracker-4d')
    CREATE DATABASE [obr-initiative-tracker-4d]
`);
await masterPool.close();

export const db = drizzle(connectionString);

// ---------------------------------------------------------------------------
// Run migrations
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

await migrate(db, { migrationsFolder: path.join(__dirname, "..", "drizzle") });

// ---------------------------------------------------------------------------
// Room-state helpers
// ---------------------------------------------------------------------------

export async function getRoomState<T>(roomId: string, key: string): Promise<T | null> {
    const rows = await db
        .select({ state: roomStates.state })
        .from(roomStates)
        .where(and(eq(roomStates.roomId, roomId), eq(roomStates.key, key)));
    if (rows.length === 0) return null;
    return JSON.parse(rows[0].state) as T;
}

export async function upsertRoomState<T>(roomId: string, key: string, state: T): Promise<void> {
    const stateJson = JSON.stringify(state);
    await db.execute(sql`
        MERGE ${roomStates} WITH (HOLDLOCK) AS target
        USING (SELECT ${roomId} AS room_id, ${key} AS [key]) AS source
        ON target.room_id = source.room_id AND target.[key] = source.[key]
        WHEN MATCHED THEN UPDATE SET state = ${stateJson}
        WHEN NOT MATCHED THEN INSERT (room_id, [key], state) VALUES (${roomId}, ${key}, ${stateJson});
    `);
}

export async function getAllRoomStates(roomId: string): Promise<Map<string, unknown>> {
    const rows = await db
        .select({ key: roomStates.key, state: roomStates.state })
        .from(roomStates)
        .where(eq(roomStates.roomId, roomId));
    const map = new Map<string, unknown>();
    for (const row of rows) {
        map.set(row.key, JSON.parse(row.state));
    }
    return map;
}
