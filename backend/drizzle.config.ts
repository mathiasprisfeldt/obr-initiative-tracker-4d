import { defineConfig } from "drizzle-kit";

export default defineConfig({
    out: "./drizzle",
    schema: "./src/schema.ts",
    dialect: "mssql",
    dbCredentials: {
        url: process.env.DATABASE_CONNECTION_STRING!,
    },
});
