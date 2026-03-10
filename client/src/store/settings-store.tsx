import OBR from "@owlbear-rodeo/sdk";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createApiClient, type ApiClient } from "obr-initiative-tracker-4d-backend/api-client";

const metadataKey = "obr-initiative-tracker-4d-settings-metadata";

export interface SettingsState {
    backendUrl: string;
}

export interface SettingsStore {
    state: SettingsState;
    isLoading: boolean;
    api: ApiClient | null;

    setBackendUrl(url: string): void;
}

const context = createContext<SettingsStore>({
    state: { backendUrl: "" },
    isLoading: true,
    api: null,

    setBackendUrl: () => {},
});

export function useSettingsStore(): SettingsStore {
    return useContext(context);
}

export function useApi(): ApiClient | null {
    return useContext(context).api;
}

export function SettingsStoreProvider({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(true);

    const [state, setState] = useState<SettingsState>({
        backendUrl: import.meta.env.VITE_BACKEND_URL ?? "",
    });

    const api = useMemo(() => {
        if (!state.backendUrl) return null;
        return createApiClient({ baseUrl: state.backendUrl });
    }, [state.backendUrl]);

    useEffect(() => {
        if (isLoading || !OBR.isAvailable) return;

        OBR.room.setMetadata({
            [metadataKey]: state,
        });
    }, [state]);

    useEffect(() => {
        if (!OBR.isAvailable) {
            setIsLoading(false);
            return;
        }

        OBR.onReady(async () => {
            const metadata = await OBR.room.getMetadata();
            const settings = metadata[metadataKey] as SettingsState;

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
            }}
        >
            {children}
        </context.Provider>
    );
}
