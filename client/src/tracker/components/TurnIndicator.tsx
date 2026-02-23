import { useEffect, useMemo, useState } from "react";
import { Particles } from "@tsparticles/react";
import type { Container, ISourceOptions } from "@tsparticles/engine";
import { Box, BoxProps } from "@mui/material";
import styled from "@emotion/styled";
import { HexColor } from "@jimmyclchu/image-palette";

export interface TurnIndicatorProps {
    id: string;
    hasTurn: boolean;
    palette?: HexColor[];
}

export default function TurnIndicator({
    id,
    hasTurn,
    palette,
    ...rest
}: TurnIndicatorProps & BoxProps) {
    const [particlesContainer, setParticlesContainer] = useState<Container>();

    useEffect(() => {
        if (hasTurn) {
            (particlesContainer as any)?.playEmitter(0);
        } else {
            (particlesContainer as any)?.pauseEmitter(0);
        }
    }, [hasTurn, particlesContainer]);

    const options = useMemo<ISourceOptions>(() => {
        return {
            autoPlay: true,
            fpsLimit: 60,
            detectRetina: true,
            particles: {
                number: { value: 0 },
                color: { value: palette || ["#ffae00", "#ff7a00", "#ffd966"] },
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
                        speed: 5,
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
                    outModes: { default: "destroy" },
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
                    autoPlay: false,
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
    }, [palette]);

    const particles = useMemo(
        () => (
            <Particles
                id={id}
                options={options}
                particlesLoaded={(container) => {
                    setParticlesContainer(container);
                    return Promise.resolve();
                }}
            />
        ),
        [id, options],
    );

    return (
        <ParticlesContainer id={id} {...rest}>
            {particles}
        </ParticlesContainer>
    );
}

const ParticlesContainer = styled(Box)<{ id: string }>`
    #${(props) => props.id} {
        width: 100%;
        height: 100%;
    }
`;
