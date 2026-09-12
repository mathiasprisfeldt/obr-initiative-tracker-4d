import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createTheme, ThemeProvider } from "@mui/material";
import { SettingsStoreProvider } from "../store/settings-store";
import { ConditionLegendApp } from "./ConditionLegendApp";
import "./index.css";

const theme = createTheme();

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ThemeProvider theme={theme}>
            <SettingsStoreProvider>
                <ConditionLegendApp />
            </SettingsStoreProvider>
        </ThemeProvider>
    </StrictMode>,
);
