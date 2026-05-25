import { keyframes, styled } from "@mui/material";
import type { DamageLevel } from "../../utils/damage-level";
import { useMemo } from "react";

export interface Props {
    damageLevel: DamageLevel;
    seed: string;
}

function hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 31 + str.charCodeAt(i)) | 0;
    }
    return hash >>> 0;
}

function seededRandom(seed: number) {
    let s = seed;
    return () => {
        s = (s * 1664525 + 1013904223) | 0;
        return (s >>> 0) / 4294967296;
    };
}

interface CrackPath {
    d: string;
    strokeWidth: number;
}

function generateCracks(seed: string, count: number): CrackPath[] {
    const rand = seededRandom(hashCode(seed));
    const cracks: CrackPath[] = [];

    for (let i = 0; i < count; i++) {
        const segments = 3 + Math.floor(rand() * 4);
        let x = 15 + rand() * 70;
        let y = 5 + rand() * 15;
        let d = `M ${x.toFixed(1)} ${y.toFixed(1)}`;

        for (let s = 0; s < segments; s++) {
            x += (rand() - 0.5) * 20;
            y += 10 + rand() * 15;
            x = Math.max(5, Math.min(95, x));
            y = Math.min(95, y);
            d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
        }

        cracks.push({ d, strokeWidth: 0.8 + rand() * 0.8 });

        // Add a branch from a random point along the main crack
        if (rand() > 0.3) {
            const branchSegments = 2 + Math.floor(rand() * 2);
            let bx = x + (rand() - 0.5) * 10;
            let by = y - rand() * 20;
            let bd = `M ${bx.toFixed(1)} ${by.toFixed(1)}`;

            for (let b = 0; b < branchSegments; b++) {
                bx += (rand() - 0.5) * 18;
                by += 5 + rand() * 10;
                bx = Math.max(5, Math.min(95, bx));
                by = Math.min(95, by);
                bd += ` L ${bx.toFixed(1)} ${by.toFixed(1)}`;
            }

            cracks.push({ d: bd, strokeWidth: 0.5 + rand() * 0.5 });
        }
    }

    return cracks;
}

export function DamageOverlay({ damageLevel, seed }: Props) {
    if (damageLevel === "none") return null;

    const isRed = damageLevel === "red";
    const isOrange = damageLevel === "orange";
    const isSevere = isRed || isOrange;
    const crackOpacity = isRed ? 0.9 : isSevere ? 0.7 : 0.5;
    const glowColor = isRed
        ? "rgba(180, 30, 30, 0.6)"
        : isOrange
          ? "rgba(200, 100, 30, 0.4)"
          : "rgba(200, 150, 50, 0.3)";
    const turbulenceFrequency = isRed ? "0.04" : isSevere ? "0.035" : "0.03";
    const displacementScale = isRed ? 6 : isSevere ? 4.5 : 3;

    const crackCount = isRed ? 5 : isSevere ? 4 : 3;
    const cracks = useMemo(() => generateCracks(seed, crackCount), [seed, crackCount]);
    const filterId = useMemo(() => `crack-filter-${hashCode(seed)}`, [seed]);

    return (
        <Overlay>
            <svg width="0" height="0" style={{ position: "absolute" }}>
                <defs>
                    <filter id={filterId}>
                        <feTurbulence
                            type="fractalNoise"
                            baseFrequency={turbulenceFrequency}
                            numOctaves="4"
                            seed="2"
                            result="noise"
                        />
                        <feDisplacementMap
                            in="SourceGraphic"
                            in2="noise"
                            scale={displacementScale}
                            xChannelSelector="R"
                            yChannelSelector="G"
                        />
                    </filter>
                </defs>
            </svg>
            <CrackLines opacity={crackOpacity} filterId={filterId}>
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    {cracks.map((crack, i) => (
                        <path
                            key={i}
                            d={crack.d}
                            stroke="currentColor"
                            strokeWidth={crack.strokeWidth}
                            fill="none"
                            strokeLinecap="round"
                        />
                    ))}
                </svg>
            </CrackLines>
            <Glow glowColor={glowColor} damageLevel={damageLevel} />
        </Overlay>
    );
}

const Overlay = styled("div")`
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    z-index: 5;
`;

const CrackLines = styled("div")<{ opacity: number; filterId: string }>`
    position: absolute;
    inset: 0;
    border-radius: inherit;
    overflow: hidden;
    opacity: ${({ opacity }) => opacity};
    color: rgba(40, 0, 0, 0.85);
    filter: ${({ filterId }) => `url(#${filterId})`};
    will-change: filter;

    & svg {
        width: 100%;
        height: 100%;
    }
`;

const pulse = keyframes`
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
`;

const Glow = styled("div")<{ glowColor: string; damageLevel: DamageLevel }>`
    position: absolute;
    inset: 12%;
    border-radius: inherit;
    box-shadow: ${({ glowColor }) => `inset 0 0 30px 10px ${glowColor}`};
    animation: ${pulse}
        ${({ damageLevel }) =>
            damageLevel === "red" ? "1.2s" : damageLevel === "orange" ? "2s" : "3s"}
        ease-in-out infinite;
`;
