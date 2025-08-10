import { TabContext, TabList, TabPanel } from "@mui/lab";
import { Box, Tab } from "@mui/material";
import { useState } from "react";
import Tracker from "./home";
import { Settings } from "./settings";

export default function Admin() {
  const [value, setValue] = useState("1");

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: "100%", typography: "body1" }}>
      <TabContext value={value}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <TabList onChange={handleChange}>
            <Tab label="Home" value="1" />
            <Tab label="Settings" value="2" />
          </TabList>
        </Box>
        <TabPanel value="1">
          <Tracker />
        </TabPanel>
        <TabPanel value="2">
          <Settings />
        </TabPanel>
      </TabContext>
    </Box>
  );
}
