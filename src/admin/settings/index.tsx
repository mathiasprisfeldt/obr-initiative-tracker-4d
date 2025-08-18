import { Divider, LinearProgress } from "@mui/material";
import { usePortraitImagePickerStore } from "../../portrait-image-picker/portrait-image-picker-store";
import { ImageUrlInput } from "../../portrait-image-picker";
import { DebugPanel } from "./DebugPanel";

export function Settings() {
  const { isLoading } = usePortraitImagePickerStore();

  if (isLoading) return <LinearProgress />;

  return (
    <>
      <ImageUrlInput />
      <Divider sx={{ my: 2 }} />
      <DebugPanel />
    </>
  );
}
