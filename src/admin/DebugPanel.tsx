import { Button, Stack } from "@mui/material";
import { useTrackerStore } from "../store/tracker-store";
import { usePortraitImagePickerStore } from "../character-portrait/portrait-image-picker-store";
import OBR from "@owlbear-rodeo/sdk";

export function DebugPanel() {
    const { state: trackerState } = useTrackerStore();
    const { state: portraitImagePickerState } = usePortraitImagePickerStore();

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
            <Button
                onClick={async () => {
                    const metadata = await OBR.room.getMetadata();
                    open(
                        "data:text/json," + encodeURIComponent(JSON.stringify(metadata)),
                        "_blank",
                    );
                }}
            >
                Download metadata
            </Button>
        </Stack>
    );
}
