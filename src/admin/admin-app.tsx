import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { TrackerStoreProvider } from "../store/tracker-store";
import Admin from "./Admin";
import OBR from "@owlbear-rodeo/sdk";
import { PluginThemeProvider } from "../PluginThemeProvider";
import { PortraitImagePickerStoreProvider } from "../portrait-image-picker";
import { CssBaseline } from "@mui/material";

const initializeRoot = () => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <PluginThemeProvider>
        <PortraitImagePickerStoreProvider>
          <TrackerStoreProvider>
            <CssBaseline />
            <Admin />
          </TrackerStoreProvider>
        </PortraitImagePickerStoreProvider>
      </PluginThemeProvider>
    </StrictMode>
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
