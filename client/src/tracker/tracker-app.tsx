import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Tracker } from "./Tracker";
import "./index.css";
import { createTheme, ThemeProvider } from "@mui/material";
import { SettingsStoreProvider } from "../store/settings-store";

const baseTheme = createTheme();

const theme = createTheme({
    typography: {
        fontFamily: "cursive, " + baseTheme.typography.fontFamily,
    },
});

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ThemeProvider theme={theme}>
            <SettingsStoreProvider>
                <Tracker />
            </SettingsStoreProvider>
        </ThemeProvider>
    </StrictMode>,
);
