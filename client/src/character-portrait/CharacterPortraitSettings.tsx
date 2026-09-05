import {
    Button,
    Grid,
    LinearProgress,
    Paper,
    Popover,
    Stack,
    styled,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
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
        useState<HTMLElement | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredImages = searchQuery.trim()
        ? images.filter((img) =>
              img.displayName.toLowerCase().includes(searchQuery.trim().toLowerCase()),
          )
        : images;

    if (isLoading) return <LinearProgress />;

    return (
        <Stack>
            <TextField
                label="URL"
                type="url"
                size="small"
                value={imageSourceUrl}
                onChange={(e) => setImageSourceUrl(e.target.value)}
                fullWidth
            />
            <TableContainer component={Paper} sx={{ mt: 2, maxHeight: "calc(100vh - 180px)" }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <TableHeaderCell sx={{ width: 132 }}>Portrait</TableHeaderCell>
                            <TableHeaderCell>
                                <TextField
                                    label="Search name"
                                    size="small"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    fullWidth
                                />
                            </TableHeaderCell>
                            <TableHeaderCell sx={{ width: 92 }}>Position</TableHeaderCell>
                            <TableHeaderCell sx={{ width: 108 }}>Particles</TableHeaderCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredImages.map((image) => (
                            <CharacterPortraitProperties
                                key={image.url}
                                portraitImage={image}
                                portraitTooltip="Change border"
                                portraitClickEnabled={borders && borders.length > 0}
                                onPositionChanged={(position) => {
                                    updatePortraitImage({ ...image, position });
                                }}
                                onParticleColorsChanged={(particleColors) => {
                                    updatePortraitImage({ ...image, particleColors });
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
            {borders && (
                <Popover
                    open={Boolean(currentCharacterPortraitElement)}
                    anchorEl={currentCharacterPortraitElement}
                    onClose={() => {
                        setCurrentCharacterPortraitElement(null);
                        setCurrentCharacterPortrait(null);
                    }}
                    anchorOrigin={{
                        vertical: "top",
                        horizontal: "right",
                    }}
                >
                    <Grid container component={Paper} sx={{ p: 1 }} spacing={1}>
                        {borders.map((border) => (
                            <Button
                                key={border.id}
                                variant={
                                    currentCharacterPortrait?.borderId === border.id
                                        ? "outlined"
                                        : "text"
                                }
                            >
                                <BorderElement
                                    src={border.url}
                                    alt={border.id}
                                    onClick={() => {
                                        setCurrentCharacterPortraitElement(null);
                                        setCurrentCharacterPortrait(null);

                                        updatePortraitImage({
                                            ...currentCharacterPortrait!,
                                            borderId: border.id,
                                        });
                                    }}
                                />
                            </Button>
                        ))}
                    </Grid>
                </Popover>
            )}
        </Stack>
    );
}

const BorderElement = styled("img")`
    width: 100px;
    height: 100px;
`;

const TableHeaderCell = styled(TableCell)(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
}));
