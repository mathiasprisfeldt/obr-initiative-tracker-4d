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
 * (Express, mssql, etc.).
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

export interface ConnectedClientInfo {
    roomId: string;
    clientCount: number;
    clients: {
        connectedAt: string;
        lastPing: string | null;
    }[];
}

export interface ConnectedClientsResponse {
    clients: ConnectedClientInfo[];
}

// ---------------------------------------------------------------------------
// WebSocket message types
// ---------------------------------------------------------------------------

export enum ClientAction {
    UpdateState = "update-state",
    Ping = "ping",
}

export enum ServerAction {
    StateChanged = "state-changed",
    StateSync = "state-sync",
    Pong = "pong",
}

export interface ClientUpdateStateMessage {
    action: ClientAction.UpdateState;
    key: string;
    state: unknown;
}

export interface ClientPingMessage {
    action: ClientAction.Ping;
}

export type ClientMessage = ClientUpdateStateMessage | ClientPingMessage;

export type ServerMessage =
    | ServerStateChangedMessage
    | ServerStateSyncMessage
    | ServerPongMessage;

export interface ServerStateChangedMessage {
    action: ServerAction.StateChanged;
    key: string;
    state: unknown;
}

export interface ServerStateSyncMessage {
    action: ServerAction.StateSync;
    states: Record<string, unknown>;
}

export interface ServerPongMessage {
    action: ServerAction.Pong;
}

export interface RoomConnection {
    updateState(key: string, state: unknown): void;
    /**
     * Force the shared WebSocket to reconnect immediately. Useful for a manual
     * "reconnect" action in the UI. Any pending automatic reconnect is cancelled
     * and a fresh connection attempt starts right away.
     */
    reconnect(): void;
    close(): void;
}

/** Severity of a connection log entry. */
export type RoomConnectionLogLevel = "info" | "warn" | "error";

/** A single connection lifecycle log entry, surfaced to the UI. */
export interface RoomConnectionLogEntry {
    /** Epoch milliseconds when the entry was created. */
    timestamp: number;
    level: RoomConnectionLogLevel;
    message: string;
}

export interface RoomConnectionOptions {
    onInitialState: (states: Map<string, unknown>) => void;
    onStateChanged: (key: string, state: unknown) => void;
    onConnected?: () => void;
    onDisconnected?: () => void;
    /** Called for each connection lifecycle event (connecting, connected, retrying, ...). */
    onLog?: (entry: RoomConnectionLogEntry) => void;
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
    /**
     * How often the client sends a `ping` message over an open WebSocket so the server
     * can reply with a `pong`. These are application-level JSON messages (visible in the
     * browser network console), not protocol-level ping/pong frames. Defaults to 1000ms.
     */
    pingIntervalMs?: number;
    /**
     * How long to wait for a `pong` reply before considering the connection stale.
     * If no `pong` is received within this window, subscribers are shown as
     * disconnected (the status indicator appears) but the WebSocket is left open in
     * the hope that it recovers. If a later `pong` arrives, the connection flips
     * back to connected. Defaults to 5000ms.
     */
    pongTimeoutMs?: number;
    /** Optional fetch implementation (useful for testing). */
    fetch?: FetchFn;
}

export function createApiClient(options: ApiClientOptions) {
    const { baseUrl } = options;
    const _fetch = options.fetch ?? globalThis.fetch.bind(globalThis);
    const reconnectIntervalMs = options.reconnectIntervalMs ?? 2000;
    const pingIntervalMs = options.pingIntervalMs ?? 1000;
    const pongTimeoutMs = options.pongTimeoutMs ?? 5000;

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
        pingTimer: ReturnType<typeof setInterval> | null;
        manuallyClosed: boolean;
        /** Timestamp (ms) of the last `pong` received from the server. */
        lastPongAt: number;
        /**
         * Whether the connection is currently considered stale (pings are being
         * sent but no `pong` has been received within the timeout). While stale,
         * subscribers are shown as disconnected but the socket is kept open in the
         * hope that it recovers.
         */
        stale: boolean;
    };

    const sharedConnections = new Map<string, SharedRoomConnection>();

    function buildWsUrl(roomId: string) {
        const wsBase = baseUrl.replace(/^http/, "ws").replace(/\/+$/, "");
        return `${wsBase}/ws/room/${encodeURIComponent(roomId)}`;
    }

    function log(shared: SharedRoomConnection, level: RoomConnectionLogLevel, message: string) {
        const entry: RoomConnectionLogEntry = { timestamp: Date.now(), level, message };
        for (const sub of shared.subscribers) sub.onLog?.(entry);
    }

    function stopPing(shared: SharedRoomConnection) {
        if (shared.pingTimer != null) {
            clearInterval(shared.pingTimer);
            shared.pingTimer = null;
        }
    }

    function startPing(shared: SharedRoomConnection) {
        stopPing(shared);
        shared.pingTimer = setInterval(() => {
            if (shared.ws?.readyState !== WebSocket.OPEN) return;

            // If we haven't heard a `pong` back within the timeout window, the
            // connection looks stale. Don't close it — the socket may still
            // recover — just surface it as disconnected so the status indicator
            // shows. If a `pong` arrives later, we flip back to connected.
            if (!shared.stale && Date.now() - shared.lastPongAt > pongTimeoutMs) {
                shared.stale = true;
                log(shared, "warn", "No pong received — connection looks stale, waiting to recover");
                for (const sub of shared.subscribers) sub.onDisconnected?.();
            }

            const msg: ClientPingMessage = { action: ClientAction.Ping };
            shared.ws.send(JSON.stringify(msg));
        }, pingIntervalMs);
    }

    function cleanupShared(roomId: string, shared: SharedRoomConnection) {
        if (shared.reconnectTimer != null) {
            clearTimeout(shared.reconnectTimer);
            shared.reconnectTimer = null;
        }
        stopPing(shared);
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

        log(shared, "info", `Reconnecting in ${Math.round(reconnectIntervalMs / 1000)}s...`);
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

    /** Cancel any pending reconnect and start a fresh connection attempt immediately. */
    function reconnectNow(roomId: string, shared: SharedRoomConnection) {
        if (shared.manuallyClosed) return;
        if (shared.reconnectTimer != null) {
            clearTimeout(shared.reconnectTimer);
            shared.reconnectTimer = null;
        }
        log(shared, "info", "Manual reconnect requested");
        const old = shared.ws;
        // Detach the current socket so its late close/error events are ignored
        // (connectWs and the listeners guard on `shared.ws === ws`).
        shared.ws = null;
        stopPing(shared);
        if (old && old.readyState !== WebSocket.CLOSED) {
            try {
                old.close();
            } catch {
                /* ignore */
            }
        }
        connectWs(roomId, shared);
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

        log(shared, "info", "Connecting...");
        const ws = new WebSocket(buildWsUrl(roomId));
        shared.ws = ws;
        let didOpen = false;
        let synced = false;

        ws.addEventListener("open", () => {
            if (shared.ws !== ws) return;
            didOpen = true;
            // Treat the connection as healthy on open; the pong watchdog measures
            // the gap since this moment.
            shared.lastPongAt = Date.now();
            shared.stale = false;
            startPing(shared);
            log(shared, "info", "Connected");
            for (const sub of shared.subscribers) sub.onConnected?.();
        });

        ws.addEventListener("close", () => {
            if (shared.ws !== ws) return;
            stopPing(shared);
            if (didOpen) {
                log(shared, "warn", "Connection closed");
                for (const sub of shared.subscribers) sub.onDisconnected?.();
            } else {
                log(shared, "warn", "Connection attempt failed");
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
            if (shared.ws !== ws) return;
            try {
                const msg = JSON.parse(event.data as string) as ServerMessage;
                if (msg.action === ServerAction.StateChanged) {
                    if (synced) {
                        for (const sub of shared.subscribers)
                            sub.onStateChanged(msg.key, msg.state);
                    }
                } else if (msg.action === ServerAction.StateSync) {
                    synced = true;
                    log(shared, "info", "State synced");
                    const states = new Map(Object.entries(msg.states));
                    for (const sub of shared.subscribers) sub.onInitialState(states);
                } else if (msg.action === ServerAction.Pong) {
                    /* keep-alive acknowledgement from server */
                    shared.lastPongAt = Date.now();
                    // Recovered from a stale period — flip back to connected.
                    if (shared.stale) {
                        shared.stale = false;
                        log(shared, "info", "Connection recovered");
                        for (const sub of shared.subscribers) sub.onConnected?.();
                    }
                }
            } catch {
                /* ignore malformed messages */
            }
        });

        // Some environments emit "error" without a follow-up "close".
        // Ensure we eventually attempt reconnect by scheduling one.
        ws.addEventListener("error", () => {
            if (shared.ws !== ws) return;
            log(shared, "error", "Connection error");
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

        async getConnectedClients(): Promise<ConnectedClientsResponse> {
            const res = await _fetch(url("/api/clients"));
            return handleResponse<ConnectedClientsResponse>(res);
        },

        connectRoom(roomId: string, options: RoomConnectionOptions): RoomConnection {
            let shared = sharedConnections.get(roomId);
            if (!shared) {
                shared = {
                    ws: null,
                    subscribers: new Set(),
                    reconnectTimer: null,
                    pingTimer: null,
                    manuallyClosed: false,
                    lastPongAt: 0,
                    stale: false,
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
                reconnect() {
                    reconnectNow(roomId, shared);
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
