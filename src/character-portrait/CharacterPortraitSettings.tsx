import {
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableContainer,
} from "@mui/material";
import { usePortraitImagePickerStore } from "./portrait-image-picker-store";
import { CharacterPortraitImageSourceInput } from "./CharacterPortraitImageSourceInput";
import { CharacterPortraitProperties } from "./CharacterPortraitProperties";

export function CharacterPortraitSettings() {
  const {
    isLoading,
    state: { images },

    updatePortraitImage,
  } = usePortraitImagePickerStore();

  if (isLoading) return <LinearProgress />;

  return (
    <Stack>
      <CharacterPortraitImageSourceInput />
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table size="small">
          <TableBody>
            {images.map((image) => (
              <CharacterPortraitProperties
                key={image.displayName}
                portraitImage={image}
                onPositionChanged={(position) => {
                  updatePortraitImage({ ...image, position });
                }}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}
