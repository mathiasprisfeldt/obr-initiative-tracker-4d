import { useEffect, useMemo, useRef, useState } from "react";
import { Particles, initParticlesEngine } from "@tsparticles/react";
import type { ISourceOptions } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";
import { loadEmittersPlugin } from "@tsparticles/plugin-emitters";
import { Box, BoxProps } from "@mui/material";

export interface TurnIndicatorProps {
    hasTurn: boolean;
}

export default function TurnIndicator({ hasTurn, ...rest }: TurnIndicatorProps & BoxProps) {
    const [engineReady, setEngineReady] = useState(false);

    useEffect(() => {
        let cancelled = false;
        initParticlesEngine(async (engine) => {
            await loadSlim(engine);
            await loadEmittersPlugin(engine);
        }).then(() => {
            if (!cancelled) setEngineReady(true);
        });
        return () => {
            cancelled = true;
        };
    }, []);

    const options = useMemo<ISourceOptions>(() => {
        return {
            fpsLimit: 60,
            detectRetina: true,
            fullScreen: { enable: true },
            particles: {
                number: { value: 0 },
                color: { value: ["#ffae00", "#ff7a00", "#ffd966"] },
                shape: { type: "circle" },
                size: {
                    value: { min: 1, max: 3 },
                    animation: {
                        enable: true,
                        startValue: "min",
                        count: 2,
                        speed: 8,
                        decay: 0.03,
                        sync: false,
                        destroy: "min",
                    },
                },
                opacity: {
                    value: { min: 0, max: 1 },
                    animation: {
                        enable: true,
                        startValue: "min",
                        count: 2,
                        speed: 3,
                        decay: 0,
                        sync: false,
                        destroy: "min",
                    },
                },
                move: {
                    enable: true,
                    speed: { min: 1, max: 2.2 },
                    direction: "top",
                    angle: { offset: 0, value: 25 },
                    outModes: { default: "out" },
                    decay: 0.02,
                    gravity: { enable: true, inverse: true, acceleration: 2 },
                    center: { x: 50, y: 50, mode: "percent" },
                },
                shadow: { enable: false },
                stroke: { width: 0 },
                twinkle: { particles: { enable: false } },
            },
            emitters: [
                {
                    startCount: 0,
                    position: { x: 50, y: 100 },
                    rate: { delay: 0, quantity: 1 },
                    size: { width: 0, height: 0 },
                    particles: {
                        move: {
                            direction: "top",
                            angle: { offset: 0, value: 180 },
                        },
                    },
                },
            ],
        };
    }, [hasTurn]);

    if (!engineReady) return null;

    return (
        <Box {...rest}>
            <Particles options={options} />
        </Box>
    );
}
