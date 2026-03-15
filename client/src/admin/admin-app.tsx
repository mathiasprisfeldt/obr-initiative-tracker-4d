import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { TrackerStoreProvider } from "../store/tracker-store";
import { SettingsStoreProvider } from "../store/settings-store";
import Admin from "./Admin";
import OBR from "@owlbear-rodeo/sdk";
import { PluginThemeProvider } from "../PluginThemeProvider";
import { PortraitImagePickerStoreProvider } from "../character-portrait";
import { CssBaseline } from "@mui/material";
import { isLocalDev } from "../utils/env";

const initializeRoot = () => {
    createRoot(document.getElementById("root")!).render(
        <StrictMode>
            <PluginThemeProvider>
                {isLocalDev && <CssBaseline />}
                <SettingsStoreProvider>
                    <PortraitImagePickerStoreProvider>
                        <TrackerStoreProvider>
                            <Admin />
                        </TrackerStoreProvider>
                    </PortraitImagePickerStoreProvider>
                </SettingsStoreProvider>
            </PluginThemeProvider>
        </StrictMode>,
    );
};

if (OBR.isAvailable) {
    OBR.onReady(async () => {
        if ((await OBR.player.getRole()) === "PLAYER") return;
        initializeRoot();
    });
} else {
    // Fallback for development or testing without OBR
    initializeRoot();
}
