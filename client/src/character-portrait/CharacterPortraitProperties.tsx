import { Box, Button, Skeleton, Stack, TableCell, TableRow, Tooltip, Typography, styled } from "@mui/material";
import { PortraitImage } from "./portrait-image-picker-store";
import { CharacterPortraitThumbnail } from "./CharacterPortraitThumbnail";
import { MouseEventHandler, useState } from "react";
import { ImagePositionInput } from "./ImagePositionInput";
import TurnIndicator from "../tracker/components/TurnIndicator";

interface Props {
    portraitImage: PortraitImage;
    portraitTooltip?: string;
    portraitClickEnabled?: boolean;
    onPositionChanged?: (position: string) => void;
    onPortraitClicked?: MouseEventHandler<HTMLButtonElement>;
    onParticleColorsChanged?: (colors: string[] | undefined) => void;
    particlePreviewEnabled?: boolean;
}

export function CharacterPortraitProperties({
    portraitImage,
    portraitTooltip,
    portraitClickEnabled,
    onPositionChanged,
    onPortraitClicked,
    onParticleColorsChanged,
    particlePreviewEnabled = false,
}: Props) {
    const [isPreviewingParticles, setIsPreviewingParticles] = useState(false);
    const particleColors = portraitImage.particleColors ?? portraitImage.palette ?? [];
    const isPaletteLoading =
        portraitImage.particleColors === undefined && portraitImage.palette === undefined;
    const previewId = `portrait-particle-preview-${portraitImage.displayName.replace(/[^a-z0-9_-]/gi, "-")}`;

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
                    <Button onClick={onPortraitClicked} disabled={!portraitClickEnabled}>
                        <Tooltip title={portraitTooltip ?? "Hover to preview particles"}>
                            <CharacterPortraitThumbnail
                                portraitImage={portraitImage}
                                showBorder={true}
                                sx={{ width: "100%", height: "100%" }}
                            />
                        </Tooltip>
                    </Button>
                    {particlePreviewEnabled && isPreviewingParticles && (
                        <ParticlePreview
                            id={previewId}
                            hasTurn={isPreviewingParticles}
                            palette={particleColors}
                            contained
                        />
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

const ParticlePreview = styled(TurnIndicator)`
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    clip-path: circle(38%);
`;
