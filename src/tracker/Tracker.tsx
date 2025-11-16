import "./tracker.css";
import { Character, TrackerState, useTrackerState } from "../store/tracker-store";
import CharacterRow from "./components/CharacterRow";
import OBR from "@owlbear-rodeo/sdk";
import { styled } from "@mui/material";
import { TextPlate } from "./components/TextPlate";
import { PortraitImagePickerStoreProvider } from "../character-portrait";
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
    if (!OBR.isAvailable) return <Preview hasEncounterStarted={false} />;

    return <Content state={state} />;
}

function Content({ state }: { state: TrackerState | undefined }) {
    if (!state?.hasEncounterStarted) return;

    return (
        <Container>
            {state && (
                <StyledCharacterRow
                    characters={state.characters}
                    currentCharacter={state.currentCharacter}
                />
            )}
            <RoundText typography="h5">Round {state?.round}</RoundText>
        </Container>
    );
}

const Container = styled("div")`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    height: 100%;
`;

const StyledCharacterRow = styled(CharacterRow)`
    flex-grow: 1;
`;

const RoundText = styled(TextPlate)`
    writing-mode: sideways-lr;
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

function Preview({ hasEncounterStarted }: { hasEncounterStarted: boolean }) {
    const characters: Character[] = [
        {
            id: "1",
            properties: {
                name: "Daggert Skyggestikker",
                initiative: 0,
                health: 0,
                maxHealth: 0,
                portraitImage: {
                    displayName: "Daggert Skyggestikker",
                    url: "https://dnd.mathiasprisfeldt.me/img/Peter.png",
                    borderId: "portrait_border_hero",
                },
                hideName: true,
            },
        },
        {
            id: "2",
            properties: {
                name: "Alaeya",
                initiative: 0,
                health: 0,
                maxHealth: 0,
                portraitImage: {
                    displayName: "Alaeya",
                    url: "https://dnd.mathiasprisfeldt.me/img/Vanessa.png",
                },
                hideName: true,
            },
        },
        {
            id: "3",
            properties: {
                name: "Nadarr",
                initiative: 0,
                health: 0,
                maxHealth: 0,
                portraitImage: {
                    displayName: "Nadarr",
                    url: "https://dnd.mathiasprisfeldt.me/img/Nicholai.png",
                },
                hideName: true,
            },
        },
        {
            id: "4",
            properties: {
                name: "Wolf",
                initiative: 0,
                health: 0,
                maxHealth: 0,
                portraitImage: null,
                hideName: false,
            },
        },
    ];

    const state: TrackerState = {
        characters: characters,
        currentCharacter: characters[3],
        round: 1,
        hasEncounterStarted: !hasEncounterStarted,
    };

    return (
        <div style={{ width: "300px", height: "100%", background: "gray" }}>
            <PortraitImagePickerStoreProvider>
                <Content state={state} />
            </PortraitImagePickerStoreProvider>
        </div>
    );
}
