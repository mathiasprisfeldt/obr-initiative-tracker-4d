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
 *
 * This module is browser-safe — it must not import any server-side code
 * (Express, pg, etc.).
 */

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
            const res = await _fetch(url(`/api/room/${encodeURIComponent(roomId)}`));
            return handleResponse<RoomState>(res);
        },

        async setRoom(roomId: string, data: RoomState): Promise<RoomState> {
            const res = await _fetch(url(`/api/room/${encodeURIComponent(roomId)}`), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            return handleResponse<RoomState>(res);
        },

        async isHealthy(): Promise<boolean> {
            try {
                const res = await _fetch(url("/api/health"));
                const body = await res.json();
                return body?.status === "ok";
            } catch {
                return false;
            }
        },
    };
}

/** Convenience type for the object returned by `createApiClient()`. */
export type ApiClient = ReturnType<typeof createApiClient>;
