// Deep import to bypass the alias that redirects @owlbear-rodeo/sdk to this file
import OBRSdk from "@owlbear-rodeo/sdk/lib/index.js";
import type { Theme } from "@owlbear-rodeo/sdk/lib/index.js";

export type { Theme };

const DEV_ROOM_ID = "dev-room-local";

const metadata: Record<string, unknown> = {};
const metadataListeners: Array<(meta: Record<string, unknown>) => void> = [];

const mockOBR = {
    isAvailable: true as boolean,
    onReady: (cb: () => void) => {
        cb();
    },
    room: {
        id: DEV_ROOM_ID,
        getMetadata: async () => ({ ...metadata }),
        setMetadata: async (meta: Record<string, unknown>) => {
            Object.assign(metadata, meta);
            metadataListeners.forEach((cb) => cb({ ...metadata }));
        },
        onMetadataChange: (cb: (meta: Record<string, unknown>) => void) => {
            metadataListeners.push(cb);
            return () => {
                const idx = metadataListeners.indexOf(cb);
                if (idx >= 0) metadataListeners.splice(idx, 1);
            };
        },
    },
    player: {
        getRole: async () =>
            (window.location.pathname.includes("/tracker/") ? "PLAYER" : "GM") as "GM" | "PLAYER",
    },
    theme: {
        getTheme: async (): Promise<Theme> =>
            ({
                mode: "DARK",
                text: { primary: "#FFFFFF", secondary: "#9CA3AF" },
                primary: { main: "#BB99FF" },
                secondary: { main: "#BB99FF" },
                background: { default: "#1E1E2E", paper: "#222639" },
            }) as Theme,
        onChange: (_cb: (theme: Theme) => void) => () => {},
    },
    popover: {
        open: async (_config: unknown) => {},
    },
};

import { isLocalDev } from "./utils/env";

const useMock = isLocalDev && !OBRSdk.isAvailable;

const OBR = useMock ? mockOBR : OBRSdk;

export default OBR;
