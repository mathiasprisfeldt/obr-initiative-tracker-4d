import { usePortraitImagePickerStore } from "./portrait-image-picker-store";

export function ImageUrlInput() {
  const {
    state: { imageStoreUrl },
    setImageStoreUrl,
  } = usePortraitImagePickerStore();

  return (
    <input
      placeholder="Image Store URL"
      type="url"
      value={imageStoreUrl}
      onChange={(e) => setImageStoreUrl(e.target.value)}
    />
  );
}
