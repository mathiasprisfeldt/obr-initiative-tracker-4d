import { useTrackerStore } from "../../store/tracker-store";

export function Settings() {
  const {
    state: { imageStoreUrl },
    setImageStoreUrl,
  } = useTrackerStore();

  return (
    <>
      <input
        placeholder="Image Store URL"
        value={imageStoreUrl}
        onChange={(e) => setImageStoreUrl(e.target.value)}
      />
    </>
  );
}
