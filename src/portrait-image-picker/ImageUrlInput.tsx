import { usePortraitImagePickerStore } from "./portrait-image-picker-store";
import { TextField } from "@mui/material";

export function ImageUrlInput() {
  const {
    state: { imageStoreUrl },
    setImageStoreUrl,
  } = usePortraitImagePickerStore();

  return (
    <TextField
      label="Image Store URL"
      type="url"
      size="small"
      value={imageStoreUrl}
      onChange={(e) => setImageStoreUrl(e.target.value)}
      fullWidth
    />
  );
}
