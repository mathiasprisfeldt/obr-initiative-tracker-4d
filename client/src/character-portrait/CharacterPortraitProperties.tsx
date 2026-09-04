import {
    Add,
    RestartAlt,
} from "@mui/icons-material";
import {
    Box,
    Button,
    IconButton,
    Popover,
    Skeleton,
    Stack,
    TableCell,
    TableRow,
    TextField,
    Tooltip,
    Typography,
    styled,
} from "@mui/material";
import { PortraitImage } from "./portrait-image-picker-store";
import { CharacterPortraitThumbnail } from "./CharacterPortraitThumbnail";
import { MouseEventHandler, useState } from "react";
import { ImagePositionInput } from "./ImagePositionInput";

interface Props {
    portraitImage: PortraitImage;
    portraitTooltip?: string;
    portraitClickEnabled?: boolean;
    onPositionChanged?: (position: string) => void;
    onPortraitClicked?: MouseEventHandler<HTMLButtonElement>;
    onParticleColorsChanged?: (colors: string[] | undefined) => void;
}

export function CharacterPortraitProperties({
    portraitImage,
    portraitTooltip,
    portraitClickEnabled,
    onPositionChanged,
    onPortraitClicked,
    onParticleColorsChanged,
}: Props) {
    const [isPreviewingParticles, setIsPreviewingParticles] = useState(false);
    const [colorPicker, setColorPicker] = useState<{
        anchorElement: HTMLButtonElement;
        index: number;
    } | null>(null);
    const [colorDraft, setColorDraft] = useState("");
    const particleColors = portraitImage.particleColors ?? portraitImage.palette ?? [];
    const isPaletteLoading =
        portraitImage.particleColors === undefined && portraitImage.palette === undefined;

    const updateParticleColor = (index: number, color: string) => {
        onParticleColorsChanged?.(
            particleColors.map((current, currentIndex) =>
                currentIndex === index ? color : current,
            ),
        );
    };

    const openColorPicker = (index: number, anchorElement: HTMLButtonElement) => {
        setColorDraft(particleColors[index]);
        setColorPicker({ index, anchorElement });
    };

    const updateColorDraft = (color: string) => {
        setColorDraft(color);

        if (isHexColor(color)) {
            updateParticleColor(colorPicker?.index ?? -1, color);
        }
    };

    return (
        <TableRow
            key={portraitImage.url}
            sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
            onMouseEnter={() => setIsPreviewingParticles(true)}
            onMouseLeave={() => setIsPreviewingParticles(false)}
            onFocus={() => setIsPreviewingParticles(true)}
            onBlur={() => setIsPreviewingParticles(false)}
        >
            <TableCell>
                <Box sx={{ position: "relative", width: 100, height: 100 }}>
                    <Button
                        onClick={onPortraitClicked}
                        disabled={!portraitClickEnabled}
                        sx={{
                            width: 100,
                            minWidth: 100,
                            height: 100,
                            p: 0,
                            borderRadius: "50%",
                            overflow: "hidden",
                        }}
                    >
                        <Tooltip title={portraitTooltip ?? "Hover to preview particles"}>
                            <CharacterPortraitThumbnail
                                portraitImage={portraitImage}
                                showBorder={true}
                                sx={{ width: "100%", height: "100%" }}
                            />
                        </Tooltip>
                    </Button>
                    {isPreviewingParticles && (
                        <PortraitParticlePreview colors={particleColors} />
                    )}
                </Box>
            </TableCell>
            <TableCell>
                <Typography>{portraitImage.displayName}</Typography>
            </TableCell>
            <TableCell>
                <ImagePositionInput
                    value={portraitImage.position}
                    onChange={onPositionChanged}
                />
            </TableCell>
            <TableCell sx={{ minWidth: 210 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        Particles
                    </Typography>
                    {isPaletteLoading ? (
                        <Stack aria-label="Loading palette" direction="row" spacing={0.5}>
                            {Array.from({ length: 4 }, (_, index) => (
                                <Skeleton key={index} variant="rounded" width={28} height={28} />
                            ))}
                        </Stack>
                    ) : (
                        <ParticleColorGrid>
                            {particleColors.map((color, index) => (
                                <Tooltip
                                    key={`${color}-${index}`}
                                    title="Click to edit · right-click to remove"
                                >
                                    <ColorSwatch
                                        aria-label={`Particle color ${index + 1}`}
                                        onClick={(event) => openColorPicker(index, event.currentTarget)}
                                        onContextMenu={(event) => {
                                            event.preventDefault();
                                            setColorPicker(null);
                                            onParticleColorsChanged?.(
                                                particleColors.filter(
                                                    (_, currentIndex) => currentIndex !== index,
                                                ),
                                            );
                                        }}
                                        sx={{ backgroundColor: color }}
                                    />
                                </Tooltip>
                            ))}
                            <Tooltip title="Add particle color">
                                <IconButton
                                    size="small"
                                    aria-label="Add particle color"
                                    onClick={() =>
                                        onParticleColorsChanged?.([...particleColors, "#ffffff"])
                                    }
                                    sx={{ width: 28, height: 28, border: 1, borderColor: "divider" }}
                                >
                                    <Add fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </ParticleColorGrid>
                    )}
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<RestartAlt fontSize="small" />}
                        disabled={!portraitImage.particleColors}
                        onClick={() => onParticleColorsChanged?.(undefined)}
                    >
                        Auto
                    </Button>
                    <Popover
                        open={Boolean(colorPicker)}
                        anchorEl={colorPicker?.anchorElement}
                        onClose={() => setColorPicker(null)}
                        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                        transformOrigin={{ vertical: "top", horizontal: "left" }}
                    >
                        <Stack spacing={1.25} sx={{ p: 1.5, width: 220 }}>
                            <Typography variant="caption" color="text.secondary">
                                Pick a particle color
                            </Typography>
                            <ParticleColorPresets>
                                {PARTICLE_COLOR_PRESETS.map((color) => (
                                    <ColorSwatch
                                        key={color}
                                        aria-label={`Use ${color}`}
                                        onClick={() => updateColorDraft(color)}
                                        sx={{ backgroundColor: color }}
                                    />
                                ))}
                            </ParticleColorPresets>
                            <TextField
                                label="Hex color"
                                size="small"
                                value={colorDraft}
                                onChange={(event) => updateColorDraft(event.target.value)}
                                error={colorDraft.length > 0 && !isHexColor(colorDraft)}
                                helperText={
                                    colorDraft.length > 0 && !isHexColor(colorDraft)
                                        ? "Use a hex color, e.g. #ffae00"
                                        : undefined
                                }
                                inputProps={{ maxLength: 7 }}
                            />
                        </Stack>
                    </Popover>
                </Stack>
            </TableCell>
        </TableRow>
    );
}

function PortraitParticlePreview({ colors }: { colors: string[] }) {
    const particleColors = colors.length > 0 ? colors : ["#ffae00", "#ff7a00", "#ffd966"];

    return (
        <ParticlePreview aria-hidden>
            {Array.from({ length: 12 }, (_, index) => (
                <PortraitParticle
                    key={index}
                    color={particleColors[index % particleColors.length]}
                    index={index}
                />
            ))}
        </ParticlePreview>
    );
}

const ParticlePreview = styled("div")`
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    border-radius: 50%;
    overflow: hidden;
`;

const PortraitParticle = styled("span", {
    shouldForwardProp: (prop) => prop !== "color" && prop !== "index",
})<{ color: string; index: number }>`
    position: absolute;
    display: block;
    border-radius: 50%;
    left: ${({ index }) => `${18 + ((index * 37) % 64)}%`};
    bottom: ${({ index }) => `${8 + ((index * 17) % 24)}%`};
    width: ${({ index }) => 5 + (index % 3) * 2}px;
    height: ${({ index }) => 5 + (index % 3) * 2}px;
    background-color: ${({ color }) => color};
    box-shadow: 0 0 12px ${({ color }) => color};
    filter: brightness(1.5) saturate(1.25);
    animation-name: portrait-particle-rise;
    animation-timing-function: ease-out;
    animation-iteration-count: infinite;
    animation-delay: ${({ index }) => `${-(index % 4) * 0.28}s`};
    animation-duration: ${({ index }) => `${0.9 + (index % 3) * 0.18}s`};

    @keyframes portrait-particle-rise {
        0% {
            opacity: 0;
            transform: translate3d(0, 0, 0) scale(0.7);
        }
        12% {
            opacity: 1;
        }
        75% {
            opacity: 0.9;
        }
        100% {
            opacity: 0;
            transform: translate3d(0, -75px, 0) scale(0.45);
        }
    }
`;

const ParticleColorGrid = styled("div")`
    display: grid;
    grid-template-columns: repeat(4, 28px);
    gap: 4px;
`;

const ParticleColorPresets = styled("div")`
    display: grid;
    grid-template-columns: repeat(6, 28px);
    gap: 4px;
`;

const ColorSwatch = styled(IconButton)`
    width: 28px;
    height: 28px;
    border: 1px solid rgba(255, 255, 255, 0.32);
    border-radius: 4px;
`;

const PARTICLE_COLOR_PRESETS = [
    "#ffffff",
    "#ffd966",
    "#ffae00",
    "#ff7a00",
    "#f44336",
    "#e91e63",
    "#9c27b0",
    "#673ab7",
    "#3f51b5",
    "#2196f3",
    "#00bcd4",
    "#4caf50",
];

function isHexColor(color: string) {
    return /^#[0-9a-f]{6}$/i.test(color);
}
