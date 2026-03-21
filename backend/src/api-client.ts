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
    /**
     * When a WebSocket connection drops unexpectedly, retry reconnecting after this interval.
     * Defaults to 2000ms.
     */
    reconnectIntervalMs?: number;
    /** Optional fetch implementation (useful for testing). */
    fetch?: FetchFn;
}

export function createApiClient(options: ApiClientOptions) {
    const { baseUrl } = options;
    const _fetch = options.fetch ?? globalThis.fetch.bind(globalThis);
    const reconnectIntervalMs = options.reconnectIntervalMs ?? 2000;

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
    type SharedRoomConnection = {
        ws: WebSocket | null;
        subscribers: Set<RoomConnectionOptions>;
        reconnectTimer: ReturnType<typeof setTimeout> | null;
        manuallyClosed: boolean;
    };

    const sharedConnections = new Map<string, SharedRoomConnection>();

    function buildWsUrl(roomId: string) {
        const wsBase = baseUrl.replace(/^http/, "ws").replace(/\/+$/, "");
        return `${wsBase}/ws/room/${encodeURIComponent(roomId)}`;
    }

    function cleanupShared(roomId: string, shared: SharedRoomConnection) {
        if (shared.reconnectTimer != null) {
            clearTimeout(shared.reconnectTimer);
            shared.reconnectTimer = null;
        }
        shared.ws = null;
        sharedConnections.delete(roomId);
    }

    function scheduleReconnect(roomId: string, shared: SharedRoomConnection) {
        if (shared.manuallyClosed) return;
        if (shared.subscribers.size === 0) {
            cleanupShared(roomId, shared);
            return;
        }
        if (shared.reconnectTimer != null) return;

        shared.reconnectTimer = setTimeout(() => {
            shared.reconnectTimer = null;
            if (shared.manuallyClosed) return;
            if (shared.subscribers.size === 0) {
                cleanupShared(roomId, shared);
                return;
            }
            connectWs(roomId, shared);
        }, reconnectIntervalMs);
    }

    function connectWs(roomId: string, shared: SharedRoomConnection) {
        if (shared.manuallyClosed) return;
        if (
            shared.ws &&
            (shared.ws.readyState === WebSocket.OPEN ||
                shared.ws.readyState === WebSocket.CONNECTING)
        ) {
            return;
        }

        const ws = new WebSocket(buildWsUrl(roomId));
        shared.ws = ws;
        let didOpen = false;

        ws.addEventListener("open", () => {
            didOpen = true;
            for (const sub of shared.subscribers) sub.onConnected?.();
        });

        ws.addEventListener("close", () => {
            if (didOpen) {
                for (const sub of shared.subscribers) sub.onDisconnected?.();
            }

            if (shared.manuallyClosed) {
                cleanupShared(roomId, shared);
                return;
            }

            // If no subscribers remain, fully tear down; otherwise retry.
            if (shared.subscribers.size === 0) {
                cleanupShared(roomId, shared);
                return;
            }

            scheduleReconnect(roomId, shared);
        });

        ws.addEventListener("message", (event) => {
            try {
                const msg = JSON.parse(event.data as string) as ServerMessage;
                if (msg.action === ServerAction.StateChanged) {
                    for (const sub of shared.subscribers) sub.onStateChanged(msg.key, msg.state);
                }
            } catch {
                /* ignore malformed messages */
            }
        });

        // Some environments emit "error" without a follow-up "close".
        // Ensure we eventually attempt reconnect by scheduling one.
        ws.addEventListener("error", () => {
            scheduleReconnect(roomId, shared);
        });
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
            let shared = sharedConnections.get(roomId);
            if (!shared) {
                shared = {
                    ws: null,
                    subscribers: new Set(),
                    reconnectTimer: null,
                    manuallyClosed: false,
                };
                sharedConnections.set(roomId, shared);
            }

            shared.subscribers.add(options);

            // Ensure there is an active connection attempt after subscribing.
            connectWs(roomId, shared);

            // If already open, fire onConnected immediately
            if (shared.ws?.readyState === WebSocket.OPEN) {
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
                            if (shared.ws?.readyState === WebSocket.OPEN) {
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
                        shared.manuallyClosed = true;
                        shared.ws?.close();
                        cleanupShared(roomId, shared);
                    }
                },
            };
        },
    };
}

/** Convenience type for the object returned by `createApiClient()`. */
export type ApiClient = ReturnType<typeof createApiClient>;
