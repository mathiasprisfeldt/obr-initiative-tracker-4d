import { Box, Slider } from "@mui/material";

interface Props {
    value?: string;
    onChange?: (value: string) => void;
}

const verticalKeywords: Record<string, number> = {
    top: 0,
    center: 50,
    bottom: 100,
};

function percentage(token: string | undefined) {
    if (!token?.endsWith("%")) return undefined;

    const parsed = Number(token.slice(0, -1));
    return Number.isFinite(parsed) ? Math.min(100, Math.max(0, parsed)) : undefined;
}

function parseVerticalPosition(value?: string) {
    const tokens = value?.trim().toLowerCase().split(/\s+/).filter(Boolean) ?? [];

    if (tokens.length < 2) return verticalKeywords[tokens[0]] ?? 50;

    const [first, second] = tokens;
    return first === "top" || first === "bottom"
        ? verticalKeywords[first]
        : (verticalKeywords[second] ?? percentage(second) ?? 50);
}

export function ImagePositionInput({ value, onChange }: Props) {
    const position = parseVerticalPosition(value);

    return (
        <Box>
            <Box
                sx={{
                    height: 112,
                    display: "flex",
                    justifyContent: "center",
                    py: 1,
                }}
            >
                <Slider
                    aria-label="Vertical image position"
                    orientation="vertical"
                    value={100 - position}
                    min={0}
                    max={100}
                    valueLabelDisplay="auto"
                    valueLabelFormat={() => `${position}%`}
                    getAriaValueText={() => `${position}% from top`}
                    onChange={(_, sliderValue) => {
                        if (typeof sliderValue === "number") {
                            onChange?.(`center ${100 - sliderValue}%`);
                        }
                    }}
                />
            </Box>
        </Box>
    );
}
