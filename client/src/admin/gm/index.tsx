import { TabContext, TabList, TabPanel } from "@mui/lab";
import { Box, CssBaseline, Tab, Typography } from "@mui/material";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import Tracker, { HistoryPane } from "./home";
import { SettingsPanel } from "./SettingsPanel";
import { CharacterPortraitBorderSettings } from "../../character-portrait/CharacterPortraitBorderSettings";
import { CharacterPortraitSettings } from "../../character-portrait/CharacterPortraitSettings";
import { RoomConnectionIndicator } from "./components/RoomConnectionIndicator";
import { PluginThemeProvider } from "../../PluginThemeProvider";
import { PortraitImagePickerStoreProvider } from "../../character-portrait";
import { SettingsStoreProvider } from "../../store/settings-store";
import { TrackerStoreProvider } from "../../store/tracker-store";
import { isLocalDev } from "../../utils/env";

export function initializeGmRoot() {
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
}

export default function Admin() {
    const [value, setValue] = useState("1");

    return (
        <Box sx={{ width: "100%", typography: "body1", color: "white" }}>
            <TabContext value={value}>
                <Box sx={{ borderBottom: 1, borderColor: "divider", position: "relative" }}>
                    <TabList
                        variant="scrollable"
                        scrollButtons="auto"
                        onChange={(_event, newValue) => setValue(newValue)}
                    >
                        <Tab label="Home" value="1" />
                        <Tab label="History" value="2" />
                        <Tab label="Portraits" value="3" />
                        <Tab label="Borders" value="4" />
                        <Tab label="Settings" value="5" />
                    </TabList>
                    <RoomConnectionIndicator onClick={() => setValue("5")} />
                </Box>
                <TabPanel value="1">
                    <Tracker />
                </TabPanel>
                <TabPanel value="2">
                    <HistoryPane />
                </TabPanel>
                <TabPanel value="3">
                    <CharacterPortraitSettings />
                </TabPanel>
                <TabPanel value="4">
                    <CharacterPortraitBorderSettings />
                </TabPanel>
                <TabPanel value="5">
                    <SettingsPanel />
                </TabPanel>
            </TabContext>
            <Typography
                variant="caption"
                sx={{
                    position: "fixed",
                    bottom: 4,
                    right: 8,
                    opacity: 0.5,
                    pointerEvents: "none",
                    userSelect: "none",
                }}
            >
                {import.meta.env.VITE_BUILD_VERSION}
            </Typography>
        </Box>
    );
}
