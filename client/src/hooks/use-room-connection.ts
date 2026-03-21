import { useEffect, useRef, useState } from "react";
import OBR from "@owlbear-rodeo/sdk";
import type { RoomConnection } from "obr-initiative-tracker-4d-backend/api-client";
import { useApi } from "../store/settings-store";

export type RoomConnectionStatus = "idle" | "connecting" | "connected" | "disconnected";

export interface UseRoomConnectionResult {
    status: RoomConnectionStatus;
    updateState(key: string, state: unknown): void;
}

export interface UseRoomConnectionOptions {
    onStateChanged: (key: string, state: unknown) => void;
    onConnected?: () => void;
    onDisconnected?: () => void;
}

export function useRoomConnection(options: UseRoomConnectionOptions): UseRoomConnectionResult {
    const api = useApi();
    const connectionRef = useRef<RoomConnection | null>(null);
    const [status, setStatus] = useState<RoomConnectionStatus>(api ? "connecting" : "idle");

    // Keep callbacks in refs so effect doesn't re-run on every render
    const optionsRef = useRef(options);
    optionsRef.current = options;

    useEffect(() => {
        if (!api) {
            setStatus("idle");
            return;
        }

        setStatus("connecting");

        const connection = api.connectRoom(OBR.room.id, {
            onStateChanged: (key, state) => optionsRef.current.onStateChanged(key, state),
            onConnected: () => {
                setStatus("connected");
                optionsRef.current.onConnected?.();
            },
            onDisconnected: () => {
                setStatus("disconnected");
                optionsRef.current.onDisconnected?.();
            },
        });
        connectionRef.current = connection;

        return () => {
            connection.close();
            connectionRef.current = null;
            setStatus("idle");
        };
    }, [api]);

    return {
        status,
        updateState: (key, state) => connectionRef.current?.updateState(key, state),
    };
}
