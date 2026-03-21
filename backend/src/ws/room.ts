import { WebSocket } from "ws";
import { getAllRoomStates, upsertRoomState } from "../db.js";
import { ClientAction, ServerAction, type ClientMessage } from "../api-client.js";

export class Room {
    private state = new Map<string, unknown>();
    private clients = new Set<WebSocket>();
    private dirtyKeys = new Set<string>();
    private loaded = false;

    constructor(private readonly roomId: string) {}

    get isEmpty(): boolean {
        return this.clients.size === 0;
    }

    get hasDirtyKeys(): boolean {
        return this.dirtyKeys.size > 0;
    }

    async addClient(ws: WebSocket): Promise<void> {
        this.clients.add(ws);
        console.log(`[room=${this.roomId}] Client connected (${this.clients.size} total)`);
        await this.ensureLoaded();

        for (const [key, state] of this.state) {
            ws.send(JSON.stringify({ action: ServerAction.StateChanged, key, state }));
        }
        ws.on("message", (raw) => {
            try {
                const msg = JSON.parse(raw.toString()) as ClientMessage;
                if (msg.action === ClientAction.UpdateState) {
                    this.state.set(msg.key, msg.state);
                    this.dirtyKeys.add(msg.key);
                    this.broadcast(msg.key, msg.state, ws);
                }
            } catch (e) {
                console.error("Invalid WebSocket message:", e);
            }
        });

        ws.on("close", () => {
            this.clients.delete(ws);
            console.log(
                `[room=${this.roomId}] Client disconnected (${this.clients.size} remaining)`,
            );
        });
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
