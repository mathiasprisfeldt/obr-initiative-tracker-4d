/**
 * API client for the Initiative Tracker 4D backend.
 *
 * Usage (from the client app):
 *   import { createApiClient } from "obr-initiative-tracker-4d-backend/api-client";
 *
 *   const client = createApiClient({ baseUrl: "https://your-server.com" });
 *
 *   const state = await client.getRoom("my-room-id");
 *   await client.setRoom("my-room-id", { [metadataKey]: trackerState });
 *   const healthy = await client.isHealthy();
 */

import { clientGetRoom } from "./routes/get-room.js";
import { clientSetRoom } from "./routes/post-room.js";
import { clientIsHealthy } from "./routes/health.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** The shape returned by GET /api/room/:roomId – a generic metadata bag. */
export type RoomState = Record<string, unknown>;

export interface ApiError {
    error: string;
}

export interface HealthResponse {
    status: "ok";
}

/** Fetch function signature used by client methods. */
export type FetchFn = typeof globalThis.fetch;

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class ApiRequestError extends Error {
    constructor(
        public readonly status: number,
        public readonly body: ApiError | null,
    ) {
        super(body?.error ?? `Request failed with status ${status}`);
        this.name = "ApiRequestError";
    }
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export interface ApiClientOptions {
    /** Base URL of the backend, e.g. "https://your-server.com" (no trailing slash). */
    baseUrl: string;
    /** Optional fetch implementation (useful for testing). */
    fetch?: FetchFn;
}

export function createApiClient(options: ApiClientOptions) {
    const { baseUrl } = options;
    const _fetch = options.fetch ?? globalThis.fetch.bind(globalThis);

    function url(path: string) {
        // Strip potential trailing slash from baseUrl
        return `${baseUrl.replace(/\/+$/, "")}${path}`;
    }

    async function handleResponse<T>(response: Response): Promise<T> {
        if (!response.ok) {
            let body: ApiError | null = null;
            try {
                body = (await response.json()) as ApiError;
            } catch {
                // body wasn't JSON
            }
            throw new ApiRequestError(response.status, body);
        }
        return response.json() as Promise<T>;
    }

    return {
        async getRoom(roomId: string): Promise<RoomState> {
            return handleResponse<RoomState>(await clientGetRoom(_fetch, url)(roomId));
        },
        async setRoom(roomId: string, data: RoomState): Promise<RoomState> {
            return handleResponse<RoomState>(await clientSetRoom(_fetch, url)(roomId, data));
        },
        isHealthy: clientIsHealthy(_fetch, url),
    };
}

/** Convenience type for the object returned by `createApiClient()`. */
export type ApiClient = ReturnType<typeof createApiClient>;
