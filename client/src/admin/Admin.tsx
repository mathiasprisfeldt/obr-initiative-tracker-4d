import { TabContext, TabList, TabPanel } from "@mui/lab";
import { Box, Tab, Typography } from "@mui/material";
import { useState } from "react";
import Tracker from "./home";
import { SettingsPanel } from "./SettingsPanel";
import { CharacterPortraitBorderSettings } from "../character-portrait/CharacterPortraitBorderSettings";
import { CharacterPortraitSettings } from "../character-portrait/CharacterPortraitSettings";
import { RoomConnectionIndicator } from "./components/RoomConnectionIndicator";

export default function Admin() {
    const [value, setValue] = useState("1");

    return (
        <Box sx={{ width: "100%", typography: "body1", color: "white" }}>
            <TabContext value={value}>
                <Box sx={{ borderBottom: 1, borderColor: "divider", position: "relative" }}>
                    <TabList onChange={(_event, newValue) => setValue(newValue)}>
                        <Tab label="Home" value="1" />
                        <Tab label="Portraits" value="2" />
                        <Tab label="Borders" value="3" />
                        <Tab label="Settings" value="4" />
                    </TabList>
                    <RoomConnectionIndicator onClick={() => setValue("4")} />
                </Box>
                <TabPanel value="1">
                    <Tracker />
                </TabPanel>
                <TabPanel value="2">
                    <CharacterPortraitSettings />
                </TabPanel>
                <TabPanel value="3">
                    <CharacterPortraitBorderSettings />
                </TabPanel>
                <TabPanel value="4">
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
