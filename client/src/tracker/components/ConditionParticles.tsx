import { useMemo } from "react";
import { Particles } from "@tsparticles/react";
import type { ISourceOptions } from "@tsparticles/engine";
import { Box, type BoxProps } from "@mui/material";

export interface ConditionParticlesProps extends BoxProps {
    id: string;
    colors: string[];
}

export default function ConditionParticles({
    id,
    colors,
    ...rest
}: ConditionParticlesProps) {
    const options = useMemo<ISourceOptions>(
        () => ({
            autoPlay: true,
            fullScreen: { enable: false },
            fpsLimit: 40,
            detectRetina: true,
            particles: {
                number: {
                    value: 26,
                    density: { enable: true, width: 180, height: 180 },
                },
                color: { value: colors },
                shape: { type: ["circle", "star"] },
                size: {
                    value: { min: 1.5, max: 4 },
                    animation: {
                        enable: true,
                        speed: 2,
                        startValue: "random",
                        sync: false,
                    },
                },
                opacity: {
                    value: { min: 0.2, max: 0.8 },
                    animation: {
                        enable: true,
                        speed: 1.2,
                        startValue: "random",
                        sync: false,
                    },
                },
                move: {
                    enable: true,
                    speed: { min: 0.15, max: 0.65 },
                    direction: "none",
                    random: true,
                    straight: false,
                    outModes: { default: "bounce" },
                    attract: {
                        enable: true,
                        rotate: { x: 600, y: 1200 },
                    },
                },
                rotate: {
                    value: { min: 0, max: 360 },
                    animation: { enable: true, speed: 8, sync: false },
                },
                twinkle: {
                    particles: {
                        enable: true,
                        frequency: 0.08,
                        opacity: 1,
                    },
                },
                shadow: {
                    enable: true,
                    color: colors[0],
                    blur: 8,
                },
            },
        }),
        [colors],
    );

    return (
        <Box {...rest}>
            <Particles id={`condition-${id}`} options={options} />
        </Box>
    );
}
