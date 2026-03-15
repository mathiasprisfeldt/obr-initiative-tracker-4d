/**
 * API client for the Initiative Tracker 4D backend.
 *
 * Usage (from the client app):
 *   import { createApiClient } from "obr-initiative-tracker-4d-backend/api-client";
 *
 *   const client = createApiClient({ baseUrl: "https://your-server.com" });
 *
 *   const state = await client.getRoomState("my-room-id", "tracker");
 *   await client.setRoomState("my-room-id", "tracker", { ... });
 *   const healthy = await client.isHealthy();
 *
 * This module is browser-safe — it must not import any server-side code
 * (Express, pg, etc.).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ApiError {
    error: string;
}

export interface HealthResponse {
    status: "ok";
}

// ---------------------------------------------------------------------------
// WebSocket message types
// ---------------------------------------------------------------------------

export enum ClientAction {
    UpdateState = "update-state",
}

export enum ServerAction {
    StateChanged = "state-changed",
}

export interface ClientMessage {
    action: ClientAction.UpdateState;
    key: string;
    state: unknown;
}

export interface ServerMessage {
    action: ServerAction.StateChanged;
    key: string;
    state: unknown;
}

export interface RoomConnection {
    updateState(key: string, state: unknown): void;
    close(): void;
}

export interface RoomConnectionOptions {
    onStateChanged: (key: string, state: unknown) => void;
    onConnected?: () => void;
    onDisconnected?: () => void;
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

    // Shared WebSocket connections per room
    const sharedConnections = new Map<
        string,
        { ws: WebSocket; subscribers: Set<RoomConnectionOptions> }
    >();

    function getOrCreateSharedConnection(roomId: string) {
        let shared = sharedConnections.get(roomId);
        if (shared) return shared;

        const wsUrl = baseUrl.replace(/^http/, "ws").replace(/\/+$/, "");
        const ws = new WebSocket(`${wsUrl}/ws/room/${encodeURIComponent(roomId)}`);

        shared = { ws, subscribers: new Set() };
        const ref = shared;

        ws.addEventListener("open", () => {
            for (const sub of ref.subscribers) sub.onConnected?.();
        });

        ws.addEventListener("close", () => {
            sharedConnections.delete(roomId);
            for (const sub of ref.subscribers) sub.onDisconnected?.();
        });

        ws.addEventListener("message", (event) => {
            try {
                const msg = JSON.parse(event.data as string) as ServerMessage;
                if (msg.action === ServerAction.StateChanged) {
                    for (const sub of ref.subscribers) sub.onStateChanged(msg.key, msg.state);
                }
            } catch {
                /* ignore malformed messages */
            }
        });

        sharedConnections.set(roomId, shared);
        return shared;
    }

    return {
        async getRoomState<T>(roomId: string, key: string): Promise<T> {
            const res = await _fetch(
                url(`/api/room/${encodeURIComponent(roomId)}/state/${encodeURIComponent(key)}`),
            );
            return handleResponse<T>(res);
        },

        async setRoomState<T>(roomId: string, key: string, data: T): Promise<T> {
            const res = await _fetch(
                url(`/api/room/${encodeURIComponent(roomId)}/state/${encodeURIComponent(key)}`),
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                },
            );
            return handleResponse<T>(res);
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

        connectRoom(roomId: string, options: RoomConnectionOptions): RoomConnection {
            const shared = getOrCreateSharedConnection(roomId);
            shared.subscribers.add(options);

            // If already open, fire onConnected immediately
            if (shared.ws.readyState === WebSocket.OPEN) {
                options.onConnected?.();
            }

            const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

            return {
                updateState(key: string, state: unknown) {
                    const existing = debounceTimers.get(key);
                    if (existing != null) clearTimeout(existing);

                    debounceTimers.set(
                        key,
                        setTimeout(() => {
                            debounceTimers.delete(key);
                            if (shared.ws.readyState === WebSocket.OPEN) {
                                const msg: ClientMessage = {
                                    action: ClientAction.UpdateState,
                                    key,
                                    state,
                                };
                                shared.ws.send(JSON.stringify(msg));
                            }
                        }, 100),
                    );
                },
                close() {
                    for (const timer of debounceTimers.values()) clearTimeout(timer);
                    debounceTimers.clear();
                    shared.subscribers.delete(options);
                    if (shared.subscribers.size === 0) {
                        shared.ws.close();
                        sharedConnections.delete(roomId);
                    }
                },
            };
        },
    };
}

/** Convenience type for the object returned by `createApiClient()`. */
export type ApiClient = ReturnType<typeof createApiClient>;
