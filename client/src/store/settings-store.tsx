import OBR from "@owlbear-rodeo/sdk";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createApiClient, type ApiClient } from "obr-initiative-tracker-4d-backend/api-client";
import { isLocalDev } from "../utils/env";

const legacyMetadataKey = "obr-initiative-tracker-4d-settings-metadata";
const metadataKey = `${legacyMetadataKey}:${import.meta.env.MODE}`;

export interface SettingsState {
    backendUrl: string;
}

export interface SettingsStore {
    state: SettingsState;
    isLoading: boolean;
    api: ApiClient | null;

    setBackendUrl(url: string): void;
    replaceState(state: SettingsState): void;
}

const context = createContext<SettingsStore>({
    state: { backendUrl: "" },
    isLoading: true,
    api: null,

    setBackendUrl: () => {},
    replaceState: () => {},
});

export function useSettingsStore(): SettingsStore {
    return useContext(context);
}

export function useApi(): ApiClient | null {
    return useContext(context).api;
}

export function SettingsStoreProvider({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(true);
    const [isGM, setIsGM] = useState(false);

    const [state, setState] = useState<SettingsState>({
        backendUrl: import.meta.env.VITE_BACKEND_URL ?? "",
    });

    const api = useMemo(() => {
        if (!state.backendUrl) return null;
        return createApiClient({ baseUrl: state.backendUrl });
    }, [state.backendUrl]);

    useEffect(() => {
        if (isLoading || !isGM || !OBR.isAvailable) return;

        OBR.player.setMetadata({
            [metadataKey]: state,
        });
        OBR.room.setMetadata({
            [metadataKey]: state,
        });
    }, [isLoading, isGM, state]);

    useEffect(() => {
        // Separate local pages cannot share the in-memory OBR metadata mock.
        // Keep using VITE_BACKEND_URL directly during local development.
        if (isLocalDev) {
            OBR.player.getRole().then((role) => setIsGM(role === "GM"));
            setIsLoading(false);
            return;
        }

        if (!OBR.isAvailable) {
            setIsLoading(false);
            return;
        }

        OBR.onReady(async () => {
            const role = await OBR.player.getRole();
            const playerIsGM = role === "GM";
            setIsGM(playerIsGM);

            const roomMetadata = await OBR.room.getMetadata();
            const roomSettings = (roomMetadata[metadataKey] ??
                (import.meta.env.MODE === "production"
                    ? roomMetadata[legacyMetadataKey]
                    : undefined)) as
                | SettingsState
                | undefined;
            let settings = roomSettings;

            if (playerIsGM) {
                const playerMetadata = await OBR.player.getMetadata();
                const playerSettings = (playerMetadata[metadataKey] ??
                    (import.meta.env.MODE === "production"
                        ? playerMetadata[legacyMetadataKey]
                        : undefined)) as
                    | SettingsState
                    | undefined;
                // TODO(backwards-compat): Remove the roomSettings fallback once GMs have had
                // enough time to migrate their legacy room-scoped backend URL to player metadata.
                settings = playerSettings ?? roomSettings;

                // The player metadata write performs that legacy migration. The room metadata
                // write must remain because players use it to connect to the GM's backend.
                if (settings) {
                    await OBR.player.setMetadata({ [metadataKey]: settings });
                    await OBR.room.setMetadata({ [metadataKey]: settings });
                }
            }

            if (settings) {
                setState(settings);
            }

            setIsLoading(false);
        });
    }, []);

    return (
        <context.Provider
            value={{
                state,
                isLoading,
                api,

                setBackendUrl: (url: string) => {
                    setState((prev) => ({ ...prev, backendUrl: url }));
                },
                replaceState: (nextState: SettingsState) => {
                    setState({ backendUrl: nextState.backendUrl });
                },
            }}
        >
            {children}
        </context.Provider>
    );
}
