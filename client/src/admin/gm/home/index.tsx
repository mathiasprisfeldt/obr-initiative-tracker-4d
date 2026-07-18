import { useTrackerStore, TrackerStore, type CombatHistoryEntry } from "../../../store/tracker-store";
import CharacterRow from "../components/CharacterRow";
import { CharacterRowHeader } from "../components/CharacterRow";
import {
    Typography,
    Button,
    Stack,
    LinearProgress,
    IconButton,
    styled,
    List,
    ListItem,
    ListItemText,
    Popover,
    Tooltip,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import TuneIcon from "@mui/icons-material/Tune";
import { useState } from "react";
import { LayoutSettingsPanel } from "../LayoutSettingsPanel";

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
        clearPreviousEncounters: clearHistory,
    },
}: {
    trackerStore: TrackerStore;
}) {
    const [layoutAnchor, setLayoutAnchor] = useState<HTMLElement | null>(null);

    if (isLoading) return <LinearProgress />;

    return (
        <div>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="h5" gutterBottom>
                    Round: {state.round}
                </Typography>
                <Tooltip title="Layout settings">
                    <IconButton
                        size="small"
                        onClick={(e) => setLayoutAnchor(e.currentTarget)}
                        aria-label="Layout settings"
                    >
                        <TuneIcon />
                    </IconButton>
                </Tooltip>
            </Stack>
            <Popover
                open={Boolean(layoutAnchor)}
                anchorEl={layoutAnchor}
                onClose={() => setLayoutAnchor(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                slotProps={{ paper: { sx: { p: 2, width: 320, maxWidth: "90vw" } } }}
            >
                <LayoutSettingsPanel />
            </Popover>

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

            {state.previousEncounters && state.previousEncounters.length > 0 && (
                <Stack sx={{ mt: 3 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="h6">History</Typography>
                        <Button size="small" onClick={clearHistory}>
                            Clear
                        </Button>
                    </Stack>
                    <List dense disablePadding>
                        {state.previousEncounters.map((entry, i) => (
                            <ListItem key={i} disableGutters>
                                <ListItemText
                                    primary={entry.participants.join(", ")}
                                    secondary={`${entry.rounds} ${entry.rounds !== 1 ? "rounds" : "round"} · ${new Date(entry.endedAt).toLocaleString()}`}
                                />
                            </ListItem>
                        ))}
                    </List>
                </Stack>
            )}
        </div>
    );
}

const CharacterTable = styled("div")`
    display: flex;
    flex-direction: column;
    gap: 10px;
`;
