/**
 * API client for the Initiative Tracker 4D backend.
 *
 * Usage (from the client app):
 *   import { createApiClient } from "obr-initiative-tracker-4d-backend/api-client";
 *
 *   const client = createApiClient({ baseUrl: "https://your-server.com" });
 *
 *   const state = await client.getRoom("my-room-id");
 *   await client.mergeRoom("my-room-id", { [metadataKey]: trackerState });
 *   await client.replaceRoom("my-room-id", newState);
 *   await client.deleteRoom("my-room-id");
 *   await client.deleteRoomKey("my-room-id", "some-key");
 *   const healthy = await client.isHealthy();
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

export interface DeleteResponse {
    status: "deleted";
}

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
    fetch?: typeof globalThis.fetch;
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
        // ---------------------------------------------------------------
        // Room state
        // ---------------------------------------------------------------

        /**
         * Fetch the full room state object.
         * Returns `{}` if the room has no stored state yet.
         */
        async getRoom(roomId: string): Promise<RoomState> {
            const res = await _fetch(url(`/api/room/${encodeURIComponent(roomId)}`));
            return handleResponse<RoomState>(res);
        },

        /**
         * Shallow-merge `data` into the existing room state.
         * This mirrors `OBR.room.setMetadata()` semantics.
         * Returns the full merged state.
         */
        async mergeRoom(roomId: string, data: RoomState): Promise<RoomState> {
            const res = await _fetch(url(`/api/room/${encodeURIComponent(roomId)}`), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            return handleResponse<RoomState>(res);
        },

        /**
         * Replace the entire room state with `data`.
         * Unlike `mergeRoom`, this overwrites everything.
         * Returns the new state.
         */
        async replaceRoom(roomId: string, data: RoomState): Promise<RoomState> {
            const res = await _fetch(url(`/api/room/${encodeURIComponent(roomId)}`), {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            return handleResponse<RoomState>(res);
        },

        /**
         * Delete the room state entirely.
         * Succeeds even if the room doesn't exist (idempotent).
         */
        async deleteRoom(roomId: string): Promise<DeleteResponse> {
            const res = await _fetch(url(`/api/room/${encodeURIComponent(roomId)}`), {
                method: "DELETE",
            });
            return handleResponse<DeleteResponse>(res);
        },

        /**
         * Remove a single key from the room state.
         * Returns the updated room state.
         */
        async deleteRoomKey(roomId: string, key: string): Promise<RoomState> {
            const res = await _fetch(
                url(`/api/room/${encodeURIComponent(roomId)}/${encodeURIComponent(key)}`),
                { method: "DELETE" },
            );
            return handleResponse<RoomState>(res);
        },

        // ---------------------------------------------------------------
        // Health
        // ---------------------------------------------------------------

        /**
         * Check backend health. Returns `true` if the server responds with
         * `{ status: "ok" }`, `false` otherwise.
         */
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
