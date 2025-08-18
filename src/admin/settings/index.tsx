import { Divider } from "@mui/material";
import { DebugPanel } from "./DebugPanel";
import { CharacterPortraitSettings } from "../../character-portrait/CharacterPortraitSettings";

export function Settings() {
  return (
    <>
      <CharacterPortraitSettings />
      <Divider sx={{ my: 2 }} />
      <DebugPanel />
    </>
  );
}
