import express from "express";
import cors from "cors";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { fileURLToPath } from "url";
import path from "path";

import getRoomRoute from "./routes/get-room.js";
import postRoomRoute from "./routes/post-room.js";
import healthRoute from "./routes/health.js";

// Ensure db module is initialized (creates table, etc.)
import "./db.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ---------------------------------------------------------------------------
// Swagger / OpenAPI
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerSpec = swaggerJsdoc({
    definition: {
        openapi: "3.0.0",
        info: {
            title: "OBR Initiative Tracker API",
            version: "1.0.0",
            description:
                "Backend API for the OBR Initiative Tracker – manages room state stored as JSON.",
        },
        servers: [{ url: `http://localhost:${process.env.PORT || 3001}` }],
    },
    apis: [path.join(__dirname, "routes", "*.ts"), path.join(__dirname, "routes", "*.js")],
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

app.use(getRoomRoute);
app.use(postRoomRoute);
app.use(healthRoute);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Backend listening on port ${PORT}`);
});
