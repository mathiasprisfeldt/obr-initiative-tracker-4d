import { Server } from "http";
import { WebSocketServer } from "ws";
import { Room, type ClientInfo } from "./room.js";

const PERSIST_INTERVAL_MS = 30_000;

const rooms = new Map<string, Room>();

function getOrCreateRoom(roomId: string): Room {
    let room = rooms.get(roomId);
    if (!room) {
        room = new Room(roomId);
        rooms.set(roomId, room);
    }
    return room;
}

export interface ConnectedClientInfo {
    roomId: string;
    clientCount: number;
    clients: ClientInfo[];
}

export function getConnectedClients(): ConnectedClientInfo[] {
    const result: ConnectedClientInfo[] = [];
    for (const [roomId, room] of rooms) {
        result.push({ roomId, clientCount: room.clientCount, clients: room.getClientInfos() });
    }
    return result;
}

export function attachRoomManagerWs(server: Server): void {
    const wss = new WebSocketServer({ noServer: true });

    server.on("upgrade", (req, socket, head) => {
        const url = new URL(req.url!, `http://${req.headers.host}`);
        const match = url.pathname.match(/^\/ws\/room\/([^/]+)$/);

        if (!match) {
            socket.destroy();
            return;
        }

        const roomId = decodeURIComponent(match[1]);

        wss.handleUpgrade(req, socket, head, async (ws) => {
            const room = getOrCreateRoom(roomId);

            // Attach the room-cleanup handler before awaiting addClient so it is
            // always registered, even if state loading is slow or fails.
            ws.on("close", () => {
                if (room.isEmpty) {
                    room
                        .persist()
                        .then(() => {
                            // A new client may have reconnected to this room
                            // while persist() was in flight. Only delete the
                            // room if it is still empty and still the instance
                            // we hold, otherwise we would drop an active room
                            // from the map and it would vanish from the
                            // connected-clients list.
                            if (room.isEmpty && rooms.get(roomId) === room) {
                                rooms.delete(roomId);
                            }
                        })
                        .catch((e) => {
                            console.error(`[room=${roomId}] Failed to persist on close:`, e);
                        });
                }
            });

            // A failure while adding the client (e.g. a transient DB error while
            // loading state) must never bubble up as an unhandled rejection —
            // that would crash the entire server process and drop every other
            // connection. Log it and let the connection continue / close normally.
            try {
                await room.addClient(ws);
            } catch (e) {
                console.error(`[room=${roomId}] Failed to add client:`, e);
            }
        });
    });

    // Periodically persist dirty state
    setInterval(async () => {
        for (const [, room] of rooms) {
            if (room.hasDirtyKeys) {
                await room.persist();
            }
        }
    }, PERSIST_INTERVAL_MS);
}
