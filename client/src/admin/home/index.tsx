import { useTrackerStore, TrackerStore } from "../../store/tracker-store";
import CharacterRow from "../components/CharacterRow";
import { CharacterRowHeader } from "../components/CharacterRow";
import { Typography, Button, Stack, LinearProgress, IconButton, styled } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

export default function Tracker() {
    const trackerStore = useTrackerStore();

    return <Content trackerStore={trackerStore} />;
}

function Content({
    trackerStore: {
        state,
        isLoading,
        startEncounter,
        endEncounter,
        canStartEncounter,
        updateCharacter,
        sortCharacters,
        previousTurn,
        nextTurn,
        toggleDisplay,
    },
}: {
    trackerStore: TrackerStore;
}) {
    if (isLoading) return <LinearProgress />;

    return (
        <div>
            <Typography variant="h5" gutterBottom>
                Round: {state.round}
            </Typography>

            <CharacterTable>
                <CharacterRowHeader />
                {state.characters.map((character) => (
                    <CharacterRow
                        key={character.id}
                        hasTurn={character.id === state.currentCharacter?.id}
                        character={character}
                        onNameChange={(name) => {
                            updateCharacter(character.id, { ...character.properties, name });
                        }}
                        onDelete={() => {
                            updateCharacter(character.id, { ...character.properties, name: "" });
                        }}
                        onHideNameChange={(hideName) => {
                            updateCharacter(character.id, {
                                ...character.properties,
                                hideName,
                            });
                        }}
                        onInitiativeChange={(initiative) => {
                            updateCharacter(character.id, {
                                ...character.properties,
                                initiative,
                            });
                        }}
                        onInitiativeSubmit={() => {
                            sortCharacters();
                        }}
                        onHealthChange={(health) => {
                            updateCharacter(character.id, {
                                ...character.properties,
                                health,
                            });
                        }}
                        onMaxHealthChange={(maxHealth) => {
                            updateCharacter(character.id, {
                                ...character.properties,
                                maxHealth,
                            });
                        }}
                        onPortraitImageChange={(imageId) => {
                            updateCharacter(character.id, {
                                ...character.properties,
                                portraitImageId: imageId,
                            });
                        }}
                    />
                ))}
            </CharacterTable>

            <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                {!state.hasEncounterStarted && (
                    <Button
                        variant="contained"
                        size="small"
                        disabled={!canStartEncounter}
                        onClick={startEncounter}
                    >
                        Start Encounter
                    </Button>
                )}

                {state.hasEncounterStarted && (
                    <Button variant="contained" color="error" size="small" onClick={endEncounter}>
                        End Encounter
                    </Button>
                )}

                <Button
                    variant="outlined"
                    size="small"
                    disabled={!state.hasEncounterStarted}
                    onClick={previousTurn}
                >
                    Previous Turn
                </Button>
                <Button
                    variant="outlined"
                    size="small"
                    disabled={!state.hasEncounterStarted}
                    onClick={nextTurn}
                >
                    Next Turn
                </Button>

                <IconButton size="small" onClick={toggleDisplay}>
                    {state.isDisplayed ? <Visibility /> : <VisibilityOff />}
                </IconButton>
            </Stack>
        </div>
    );
}

const CharacterTable = styled("div")`
    display: flex;
    flex-direction: column;
    gap: 10px;
`;
