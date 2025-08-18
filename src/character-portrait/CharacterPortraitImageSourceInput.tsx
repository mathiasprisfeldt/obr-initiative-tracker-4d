import { usePortraitImagePickerStore } from "./portrait-image-picker-store";
import { TextField } from "@mui/material";

export function CharacterPortraitImageSourceInput() {
  const {
    state: { imageSourceUrl },
    setImageSourceUrl,
  } = usePortraitImagePickerStore();

  return (
    <TextField
      label="Image Source URL"
      type="url"
      size="small"
      value={imageSourceUrl}
      onChange={(e) => setImageSourceUrl(e.target.value)}
      fullWidth
    />
  );
}
