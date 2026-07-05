import { WebSocket } from "ws";
import { getAllRoomStates, upsertRoomState } from "../db.js";
import { ClientAction, ServerAction, type ClientMessage } from "../api-client.js";

export interface ClientInfo {
    connectedAt: string;
    lastPing: string | null;
}

export class Room {
    private state = new Map<string, unknown>();
    private clients = new Set<WebSocket>();
    private clientInfoMap = new Map<WebSocket, ClientInfo>();
    private dirtyKeys = new Set<string>();
    private loaded = false;

    constructor(private readonly roomId: string) {}

    get isEmpty(): boolean {
        return this.clients.size === 0;
    }

    get clientCount(): number {
        return this.clients.size;
    }

    get hasDirtyKeys(): boolean {
        return this.dirtyKeys.size > 0;
    }

    getClientInfos(): ClientInfo[] {
        return [...this.clientInfoMap.values()];
    }

    async addClient(ws: WebSocket): Promise<void> {
        this.clients.add(ws);
        const info: ClientInfo = {
            connectedAt: new Date().toISOString(),
            lastPing: null,
        };
        this.clientInfoMap.set(ws, info);

        console.log(`[room=${this.roomId}] Client connected (${this.clients.size} total)`);

        // Attach the message/close listeners synchronously, before any `await`.
        // The `ws` library does not buffer messages that arrive before a
        // "message" listener exists, so registering them after an async DB load
        // would silently drop any client messages (e.g. pings) sent during that
        // window — the client would send pings but never receive pongs.
        ws.on("message", (raw) => {
            try {
                const msg = JSON.parse(raw.toString()) as ClientMessage;
                if (msg.action === ClientAction.UpdateState) {
                    this.state.set(msg.key, msg.state);
                    this.dirtyKeys.add(msg.key);
                    this.broadcast(msg.key, msg.state, ws);
                } else if (msg.action === ClientAction.Ping) {
                    const clientInfo = this.clientInfoMap.get(ws);
                    if (clientInfo) {
                        clientInfo.lastPing = new Date().toISOString();
                    }
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ action: ServerAction.Pong }));
                    }
                }
            } catch (e) {
                console.error("Invalid WebSocket message:", e);
            }
        });

        ws.on("close", () => {
            this.clients.delete(ws);
            this.clientInfoMap.delete(ws);
            console.log(
                `[room=${this.roomId}] Client disconnected (${this.clients.size} remaining)`,
            );
        });

        // Load persisted state, then send the initial sync. Any messages that
        // arrive while loading are already handled by the listener above.
        // A DB failure here must not crash the connection: the client should
        // still be able to exchange ping/pong and updates. We log and continue
        // with whatever state is currently in memory.
        try {
            await this.ensureLoaded();
        } catch (e) {
            console.error(`[room=${this.roomId}] Failed to load persisted state:`, e);
        }

        if (ws.readyState === WebSocket.OPEN) {
            const states = Object.fromEntries(this.state);
            ws.send(JSON.stringify({ action: ServerAction.StateSync, states }));
        }
    }

    async persist(): Promise<void> {
        const keys = [...this.dirtyKeys];
        for (const key of keys) {
            const state = this.state.get(key);
            if (state !== undefined) {
                try {
                    await upsertRoomState(this.roomId, key, state);
                } catch (e) {
                    console.error(`Failed to persist room=${this.roomId} key=${key}:`, e);
                }
            }
        }
        this.dirtyKeys.clear();
        console.log(`[room=${this.roomId}] Persisted keys: ${keys.join(", ")}`);
    }

    private broadcast(key: string, state: unknown, sender: WebSocket): void {
        const serialized = JSON.stringify({ action: ServerAction.StateChanged, key, state });
        for (const client of this.clients) {
            if (client !== sender && client.readyState === WebSocket.OPEN) {
                client.send(serialized);
            }
        }
    }

    private async ensureLoaded(): Promise<void> {
        if (this.loaded) return;
        const states = await getAllRoomStates(this.roomId);
        for (const [key, state] of states) {
            if (!this.state.has(key)) {
                this.state.set(key, state);
            }
        }
        this.loaded = true;
    }
}
