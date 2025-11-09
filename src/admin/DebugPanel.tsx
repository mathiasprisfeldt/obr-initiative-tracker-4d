import { Button, Stack } from "@mui/material";
import { useTrackerStore } from "../store/tracker-store";
import { usePortraitImagePickerStore } from "../character-portrait/portrait-image-picker-store";

export function DebugPanel() {
    const { state: trackerState } = useTrackerStore();
    const { state: portraitImagePickerState } = usePortraitImagePickerStore();

    if (import.meta.env.PROD) {
        return null;
    }

    return (
        <Stack direction="row" spacing={2}>
            <Button variant="contained" color="primary" onClick={() => console.log(trackerState)}>
                Print tracker state
            </Button>
            <Button
                variant="contained"
                color="primary"
                onClick={() => console.log(portraitImagePickerState)}
            >
                Print portrait image picker state
            </Button>
        </Stack>
    );
}
