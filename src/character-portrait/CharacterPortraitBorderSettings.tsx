import { Button, Grid, LinearProgress, Paper, Stack, TextField, Tooltip } from "@mui/material";
import { usePortraitImagePickerStore } from "./portrait-image-picker-store";

export function CharacterPortraitBorderSettings() {
    const {
        isLoading,
        state: { borders, borderSourceUrl, defaultBorderId },

        setBorderSourceUrl,
        setDefaultBorder,
    } = usePortraitImagePickerStore();

    if (isLoading) return <LinearProgress />;

    return (
        <Stack>
            <TextField
                label="URL"
                type="url"
                size="small"
                value={borderSourceUrl}
                onChange={(e) => setBorderSourceUrl(e.target.value)}
                fullWidth
            />
            <Grid container component={Paper} sx={{ mt: 2 }} spacing={1}>
                {borders?.map((image) => (
                    <Grid key={image.id} size={6}>
                        <Stack alignItems="center">
                            <Tooltip title="Set as default border">
                                <Button
                                    variant={defaultBorderId === image.id ? "outlined" : "text"}
                                    onClick={() => setDefaultBorder(image.id)}
                                >
                                    <img
                                        src={image.url}
                                        style={{ width: "100%", maxWidth: "250px" }}
                                        alt="Border"
                                    />
                                </Button>
                            </Tooltip>
                        </Stack>
                    </Grid>
                ))}
            </Grid>
        </Stack>
    );
}
