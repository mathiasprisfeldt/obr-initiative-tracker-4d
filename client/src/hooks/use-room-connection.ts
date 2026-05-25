import { useEffect, useRef, useState } from "react";
import OBR from "@owlbear-rodeo/sdk";
import type { RoomConnection } from "obr-initiative-tracker-4d-backend/api-client";
import { useApi } from "../store/settings-store";

export type RoomConnectionStatus = "idle" | "connecting" | "connected" | "disconnected";

export interface UseRoomConnectionResult<T> {
    status: RoomConnectionStatus;
    updateState(state: T): void;
}

export interface UseRoomConnectionOptions<T> {
    key: string;
    onInitialState: (state: T | undefined) => void;
    onStateChanged: (state: T) => void;
    onConnected?: () => void;
    onDisconnected?: () => void;
}

export function useRoomConnection<T>(
    options: UseRoomConnectionOptions<T>,
): UseRoomConnectionResult<T> {
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
            onInitialState: (states) => {
                const state = states.get(optionsRef.current.key) as T | undefined;
                optionsRef.current.onInitialState(state);
            },
            onStateChanged: (key, state) => {
                if (key === optionsRef.current.key) {
                    optionsRef.current.onStateChanged(state as T);
                }
            },
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
        updateState: (state) => connectionRef.current?.updateState(optionsRef.current.key, state),
    };
}
