import "./tracker.css";
import { TrackerState, useTrackerState } from "../store/tracker-store";
import CharacterRow from "./components/CharacterRow";
import OBR from "@owlbear-rodeo/sdk";
import { styled, Typography, keyframes } from "@mui/material";
import { TextPlate } from "./components/TextPlate";
import { loadEmittersPlugin } from "@tsparticles/plugin-emitters";
import { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { useEffect, useState } from "react";

export function Tracker() {
    const state = useTrackerState();
    const [particleEngineReady, setParticleEngineReady] = useState(false);

    useEffect(() => {
        initParticlesEngine(async (engine) => {
            await loadSlim(engine);
            await loadEmittersPlugin(engine);
        }).then(() => {
            setParticleEngineReady(true);
        });
    }, []);

    if (!particleEngineReady) return null;

    return <Content state={state} />;
}

function Content({ state }: { state: TrackerState | undefined }) {
    const visible = state?.isDisplayed && state?.hasEncounterStarted;

    return (
        <Container style={{ visibility: visible ? "visible" : "hidden" }}>
            {state && (
                <StyledCharacterRow
                    characters={state.characters}
                    currentCharacter={state.currentCharacter}
                />
            )}
            <RoundBadge key={state?.round}>
                <RoundNumber variant="h4">{state?.round}</RoundNumber>
            </RoundBadge>
        </Container>
    );
}

const Container = styled("div")`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    height: 100%;
    overflow: hidden;
`;

const StyledCharacterRow = styled(CharacterRow)`
    flex-grow: 1;
`;

const roundPulse = keyframes`
    0% {
        transform: scale(0.5);
        opacity: 0;
        box-shadow: 0 0 0 rgba(200, 170, 110, 0);
    }
    50% {
        transform: scale(1.15);
        opacity: 1;
        box-shadow: 0 0 20px rgba(200, 170, 110, 0.6);
    }
    100% {
        transform: scale(1);
        opacity: 1;
        box-shadow: 0 0 8px rgba(200, 170, 110, 0.3);
    }
`;

const RoundBadge = styled("div")`
    display: grid;
    place-items: center;
    aspect-ratio: 1 / 1;
    padding: 12px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(40, 40, 60, 0.95), rgba(20, 20, 35, 0.95));
    border: 2px solid rgba(200, 170, 110, 0.6);
    box-shadow: 0 0 8px rgba(200, 170, 110, 0.3);
    flex-shrink: 0;
    margin-right: 4px;
    writing-mode: sideways-lr;
    animation: ${roundPulse} 0.5s ease-out;
`;

const RoundNumber = styled(Typography)`
    color: rgba(230, 200, 140, 1);
    font-weight: bold;
    line-height: 1;
`;

export const PopoverId = "obr-initiative-tracker-4d-tracker-popover";

export function OpenTracker() {
    OBR.popover.open({
        id: PopoverId,
        url: `${import.meta.env.BASE_URL}/src/tracker/index.html`,
        width: 300,
        height: 999999,
        anchorOrigin: { horizontal: "LEFT", vertical: "CENTER" },
        transformOrigin: { horizontal: "LEFT", vertical: "CENTER" },
        disableClickAway: true,
        hidePaper: true,
        marginThreshold: 0,
    });
}
