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
            await room.addClient(ws);

            ws.on("close", () => {
                if (room.isEmpty) {
                    room.persist().then(() => rooms.delete(roomId));
                }
            });
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
