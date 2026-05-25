import { nvarchar, mssqlTable, primaryKey } from "drizzle-orm/mssql-core";

export const roomStates = mssqlTable(
    "room_states",
    {
        roomId: nvarchar("room_id", { length: 450 }).notNull(),
        key: nvarchar("key", { length: 450 }).notNull(),
        state: nvarchar("state", { length: "max" }).notNull().default("{}"),
    },
    (t) => [primaryKey({ columns: [t.roomId, t.key] })],
);
