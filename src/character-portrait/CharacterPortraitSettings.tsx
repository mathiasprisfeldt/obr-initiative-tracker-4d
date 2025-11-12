import {
    LinearProgress,
    Paper,
    Popover,
    Stack,
    styled,
    Table,
    TableBody,
    TableContainer,
    TextField,
} from "@mui/material";
import { PortraitImage, usePortraitImagePickerStore } from "./portrait-image-picker-store";
import { CharacterPortraitProperties } from "./CharacterPortraitProperties";
import { useState } from "react";

export function CharacterPortraitSettings() {
    const {
        isLoading,
        state: { images, borders, imageSourceUrl },

        setImageSourceUrl,
        updatePortraitImage,
    } = usePortraitImagePickerStore();

    const [currentCharacterPortrait, setCurrentCharacterPortrait] = useState<PortraitImage | null>(
        null,
    );
    const [currentCharacterPortraitElement, setCurrentCharacterPortraitElement] =
        useState<HTMLDivElement | null>(null);

    if (isLoading) return <LinearProgress />;

    return (
        <Stack>
            <TextField
                label="Image Source URL"
                type="url"
                size="small"
                value={imageSourceUrl}
                onChange={(e) => setImageSourceUrl(e.target.value)}
                fullWidth
            />
            <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table size="small">
                    <TableBody>
                        {images.map((image) => (
                            <CharacterPortraitProperties
                                key={image.url}
                                portraitImage={image}
                                onPositionChanged={(position) => {
                                    updatePortraitImage({ ...image, position });
                                }}
                                onPortraitClicked={(event) => {
                                    setCurrentCharacterPortraitElement(event.currentTarget);
                                    setCurrentCharacterPortrait(image);
                                }}
                            />
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Popover
                open={Boolean(currentCharacterPortraitElement)}
                anchorEl={currentCharacterPortraitElement}
                onClose={() => {
                    setCurrentCharacterPortraitElement(null);
                    setCurrentCharacterPortrait(null);
                }}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "left",
                }}
            >
                <TableContainer component={Paper}>
                    <Table size="small">
                        <TableBody>
                            {borders.map((border) => (
                                <BorderElement
                                    src={border.url}
                                    alt={border.id}
                                    key={border.id}
                                    onClick={() => {
                                        setCurrentCharacterPortraitElement(null);
                                        setCurrentCharacterPortrait(null);

                                        updatePortraitImage({
                                            ...currentCharacterPortrait!,
                                            borderId: border.id,
                                        });
                                    }}
                                />
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Popover>
        </Stack>
    );
}

const BorderElement = styled("img")`
    width: 100px;
    height: 100px;
`;
