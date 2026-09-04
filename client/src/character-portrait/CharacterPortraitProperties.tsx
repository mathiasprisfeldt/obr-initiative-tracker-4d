import { Box, Button, Skeleton, Stack, TableCell, TableRow, Tooltip, Typography, styled } from "@mui/material";
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

    return (
        <TableRow
            key={portraitImage.url}
            sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
        >
            <TableCell>
                <Box
                    sx={{ position: "relative", width: 100, height: 100 }}
                    onMouseEnter={() => setIsPreviewingParticles(true)}
                    onMouseLeave={() => setIsPreviewingParticles(false)}
                    onFocus={() => setIsPreviewingParticles(true)}
                    onBlur={() => setIsPreviewingParticles(false)}
                >
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
                <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        Particles
                    </Typography>
                    {isPaletteLoading ? (
                        <Stack aria-label="Loading palette" direction="row" spacing={0.5}>
                            {Array.from({ length: 4 }, (_, index) => (
                                <Skeleton key={index} variant="rounded" width={28} height={28} />
                            ))}
                        </Stack>
                    ) : particleColors.length > 0 ? (
                        particleColors.map((color, index) => (
                            <Stack key={`${color}-${index}`} direction="row" alignItems="center" spacing={0.25}>
                                <input
                                    aria-label={`Particle color ${index + 1}`}
                                    type="color"
                                    value={color}
                                    onChange={(event) => updateParticleColor(index, event.target.value)}
                                    style={{ width: 28, height: 28, padding: 0, border: 0, background: "transparent" }}
                                />
                                <Button
                                    size="small"
                                    aria-label={`Remove particle color ${index + 1}`}
                                    disabled={particleColors.length === 1}
                                    onClick={() =>
                                        onParticleColorsChanged?.(
                                            particleColors.filter((_, currentIndex) => currentIndex !== index),
                                        )
                                    }
                                    sx={{ minWidth: 24, px: 0.25 }}
                                >
                                    ×
                                </Button>
                            </Stack>
                        ))
                    ) : (
                        <Typography variant="caption" color="text.secondary">
                            Palette unavailable
                        </Typography>
                    )}
                    <Button
                        size="small"
                        onClick={() => onParticleColorsChanged?.([...particleColors, "#ffffff"])}
                    >
                        Add
                    </Button>
                    <Button
                        size="small"
                        disabled={!portraitImage.particleColors}
                        onClick={() => onParticleColorsChanged?.(undefined)}
                    >
                        Auto
                    </Button>
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
