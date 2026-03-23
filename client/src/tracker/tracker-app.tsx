import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Tracker } from "./Tracker";
import "./index.css";
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import { SettingsStoreProvider } from "../store/settings-store";
import { PortraitImagePickerStoreProvider } from "../character-portrait";
import { isLocalDev } from "../utils/env";

const baseTheme = createTheme();

const theme = createTheme({
    palette: {
        background: isLocalDev ? { default: "#1E1E2E", paper: "#222639" } : undefined,
    },
    typography: {
        fontFamily: "cursive, " + baseTheme.typography.fontFamily,
    },
});

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ThemeProvider theme={theme}>
            {isLocalDev && <CssBaseline />}
            <SettingsStoreProvider>
                <PortraitImagePickerStoreProvider>
                    <Tracker />
                </PortraitImagePickerStoreProvider>
            </SettingsStoreProvider>
        </ThemeProvider>
    </StrictMode>,
);
