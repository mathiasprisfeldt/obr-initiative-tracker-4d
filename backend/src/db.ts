import { drizzle } from "drizzle-orm/node-mssql";
import { eq, and, sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-mssql/migrator";
import path from "path";
import { fileURLToPath } from "url";
import { roomStates } from "./schema.js";

const connectionString = process.env.DATABASE_CONNECTION_STRING;
export const isInMemoryMode = process.env.BACKEND_NO_DB === "1";

type RoomStateKey = `${string}::${string}`;
const memoryStore = new Map<RoomStateKey, unknown>();

export const db = connectionString ? drizzle(connectionString) : null;

if (isInMemoryMode) {
    console.warn(
        "Starting backend without database persistence (set DATABASE_CONNECTION_STRING to enable DB)",
    );
}

if (!isInMemoryMode && !connectionString) {
    console.error("DATABASE_CONNECTION_STRING env var is required unless BACKEND_NO_DB=1");
    process.exit(1);
}

// ---------------------------------------------------------------------------
// Run migrations
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (db) {
    await migrate(db, { migrationsFolder: path.join(__dirname, "..", "drizzle") });
}

// ---------------------------------------------------------------------------
// Room-state helpers
// ---------------------------------------------------------------------------

export async function getRoomState<T>(roomId: string, key: string): Promise<T | null> {
    if (!db) {
        const state = memoryStore.get(`${roomId}::${key}`);
        return state === undefined ? null : (state as T);
    }

    const rows = await db
        .select({ state: roomStates.state })
        .from(roomStates)
        .where(and(eq(roomStates.roomId, roomId), eq(roomStates.key, key)));
    if (rows.length === 0) return null;
    return JSON.parse(rows[0].state) as T;
}

export async function upsertRoomState<T>(roomId: string, key: string, state: T): Promise<void> {
    if (!db) {
        memoryStore.set(`${roomId}::${key}`, state);
        return;
    }

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
    if (!db) {
        const map = new Map<string, unknown>();
        const prefix = `${roomId}::`;
        for (const [combinedKey, state] of memoryStore.entries()) {
            if (combinedKey.startsWith(prefix)) {
                map.set(combinedKey.slice(prefix.length), state);
            }
        }
        return map;
    }

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
