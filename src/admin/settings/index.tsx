import { LinearProgress } from "@mui/material";
import { usePortraitImagePickerStore } from "../../portrait-image-picker/portrait-image-picker-store";
import { ImageUrlInput } from "../../portrait-image-picker";

export function Settings() {
  const { isLoading } = usePortraitImagePickerStore();

  if (isLoading) return <LinearProgress />;

  return (
    <>
      <ImageUrlInput />
    </>
  );
}
