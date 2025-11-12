import {
    LinearProgress,
    Paper,
    Stack,
    Table,
    TableBody,
    TableContainer,
    TextField,
} from "@mui/material";
import { usePortraitImagePickerStore } from "./portrait-image-picker-store";

export function CharacterPortraitBorderSettings() {
    const {
        isLoading,
        state: { borders, borderSourceUrl },

        setBorderSourceUrl,
    } = usePortraitImagePickerStore();

    if (isLoading) return <LinearProgress />;

    return (
        <Stack>
            <TextField
                label="Image Source URL"
                type="url"
                size="small"
                value={borderSourceUrl}
                onChange={(e) => setBorderSourceUrl(e.target.value)}
                fullWidth
            />
            <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table size="small">
                    <TableBody>
                        {borders.map((image) => (
                            <img
                                key={image.url}
                                src={image.url}
                                style={{ width: "250px", height: "250px" }}
                                alt="Border"
                            />
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Stack>
    );
}
