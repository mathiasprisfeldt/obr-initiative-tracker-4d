import "./tracker.css";
import { type TrackerResult, useTracker } from "../store/tracker-store";
import CharacterRow from "./components/CharacterRow";
import { ConnectionStatus } from "./components/ConnectionStatus";
import OBR from "@owlbear-rodeo/sdk";
import { styled, Typography } from "@mui/material";
import { loadEmittersPlugin } from "@tsparticles/plugin-emitters";
import { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useTrackerLayout } from "./tracker-layout";
import { isLocalDev } from "../utils/env";

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
    const layout = useTrackerLayout(state?.characters.length ?? 0);

    // Widen the popover so extra portrait columns are fully visible.
    useEffect(() => {
        OBR.popover.setWidth?.(PopoverId, layout.popoverWidth).catch(() => {});
    }, [layout.popoverWidth]);

    return (
        <Viewport width={layout.popoverWidth} localDev={isLocalDev}>
            <Container
                width={layout.popoverWidth}
                localDev={isLocalDev}
                style={{ pointerEvents: visible ? "auto" : "none" }}
            >
                {state && (
                    <>
                        <StyledCharacterRow
                            characters={state.characters}
                            currentCharacter={state.currentCharacter}
                            visible={!!visible}
                            itemSize={layout.itemSize}
                            gap={layout.portraitGap}
                            verticalPadding={layout.verticalPadding}
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
                <ConnectionStatus status={connectionStatus} />
            </Container>
        </Viewport>
    );
}

const Viewport = styled("div", {
    shouldForwardProp: (prop) => prop !== "width" && prop !== "localDev",
})<{ width: number; localDev: boolean }>(({ width, localDev, theme }) => ({
    position: "fixed",
    inset: 0,
    display: "flex",
    justifyContent: localDev ? "flex-start" : "stretch",
    alignItems: "stretch",
    width: "100%",
    overflow: "visible",
    ...(localDev
        ? {
              background: `linear-gradient(90deg, ${theme.palette.background.paper} 0, ${theme.palette.background.paper} ${Math.round(width)}px, transparent ${Math.round(width)}px)`,
          }
        : undefined),
}));

const Container = styled(motion.div, {
    shouldForwardProp: (prop) => prop !== "width" && prop !== "localDev",
})<{ width: number; localDev: boolean }>(({ width, localDev }) => ({
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    width: localDev ? Math.round(width) : "100%",
    maxWidth: "100%",
    height: "100%",
    overflow: "visible",
    flexShrink: 0,
}));

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
