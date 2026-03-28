import "./tracker.css";
import { type TrackerResult, useTracker } from "../store/tracker-store";
import CharacterRow from "./components/CharacterRow";
import OBR from "@owlbear-rodeo/sdk";
import { styled, Typography } from "@mui/material";
import { loadEmittersPlugin } from "@tsparticles/plugin-emitters";
import { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

export function Tracker() {
    const tracker = useTracker();
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

    return <Content tracker={tracker} />;
}

function Content({ tracker }: { tracker: TrackerResult }) {
    const { state, connectionStatus } = tracker;
    const visible = state?.isDisplayed && state?.hasEncounterStarted;
    const showDisconnected = connectionStatus === "disconnected";

    return (
        <Container style={{ pointerEvents: visible ? "auto" : "none" }}>
            {state && (
                <>
                    <StyledCharacterRow
                        characters={state.characters}
                        currentCharacter={state.currentCharacter}
                        visible={!!visible}
                    />
                    <AnimatePresence mode="popLayout">
                        <RoundBadge
                            key={`${state.round}-${visible}`}
                            layout
                            initial={{ x: 200, opacity: 0 }}
                            animate={{
                                x: visible ? 0 : 200,
                                scale: 1,
                                opacity: visible ? 1 : 0,
                                boxShadow: "0 0 8px rgba(200, 170, 110, 0.3)",
                            }}
                            exit={{
                                x: 200,
                                opacity: 0,
                                scale: 0.3,
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 20,
                            }}
                        >
                            <RoundNumber variant="h4">{state.round}</RoundNumber>
                        </RoundBadge>
                    </AnimatePresence>
                </>
            )}
            <AnimatePresence>
                {showDisconnected && (
                    <DisconnectedDot
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        title="Connection lost"
                    />
                )}
            </AnimatePresence>
        </Container>
    );
}

const Container = styled(motion.div)`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    position: fixed;
    inset: 0;
    overflow: hidden;
`;

const StyledCharacterRow = styled(CharacterRow)`
    flex-grow: 1;
`;

const RoundBadge = styled(motion.div)`
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
`;

const RoundNumber = styled(Typography)`
    color: rgba(230, 200, 140, 1);
    font-weight: bold;
    line-height: 1;
`;

const DisconnectedDot = styled(motion.div)`
    position: fixed;
    bottom: 6px;
    left: 6px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(220, 80, 80, 0.7);
    pointer-events: none;
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
