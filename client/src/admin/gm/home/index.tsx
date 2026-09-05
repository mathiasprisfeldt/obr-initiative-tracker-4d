import {
    describeTrackerEvent,
    snapshotCombatant,
    toLocalDate,
    type CombatantSnapshot,
    type CombatEvent,
    type Encounter,
    type GameSession,
    type TrackerEvent,
} from "../../../store/tracker-domain";
import { useTrackerStore, type TrackerStore } from "../../../store/tracker-store";
import CharacterRow, { CharacterRowHeader } from "../components/CharacterRow";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Button,
    Chip,
    Dialog,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    LinearProgress,
    List,
    ListItem,
    ListItemText,
    Paper,
    Stack,
    TextField,
    Tooltip,
    Typography,
    styled,
} from "@mui/material";
import {
    Close,
    ContentCopy,
    Delete,
    Edit,
    ExpandMore,
    Favorite,
    FavoriteBorder,
    FormatListBulleted,
    Groups,
    LocalFireDepartment,
    MilitaryTech,
    Redo,
    Shield,
    Tune,
    Undo,
    Visibility,
    VisibilityOff,
} from "@mui/icons-material";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { LayoutSettingsPanel } from "../LayoutSettingsPanel";
import { usePortraitImagePickerState } from "../../../character-portrait";

export default function Tracker() {
    return <Content trackerStore={useTrackerStore()} />;
}

export function HistoryPane() {
    const {
        state,
        events,
        cursor,
        isLoading,
        renameSession,
        deleteEncounter,
        deleteSession,
        renameCompletedEncounter,
    } = useTrackerStore();
    const today = toLocalDate(new Date());
    const previousSessions = state.sessions
        .filter((session) => session.endedAt || session.date !== today)
        .reverse();

    if (isLoading) return <LinearProgress />;

    return (
        <Stack spacing={1}>
            <Typography variant="h5">Session history</Typography>
            {previousSessions.length === 0 ? (
                <Typography color="text.secondary">No previous sessions yet.</Typography>
            ) : (
                previousSessions.map((session) => (
                    <SessionOverview
                        key={session.id}
                        session={session}
                        onRename={(name) => renameSession(session.id, name)}
                        onDelete={() => deleteSession(session.id)}
                        activityEntries={getSessionLogEntries(
                            events.slice(0, cursor),
                            session.id,
                        )}
                        onRenameEncounter={(encounterId, name) =>
                            renameCompletedEncounter(session.id, encounterId, name)
                        }
                        onDeleteEncounter={(encounterId) =>
                            deleteEncounter(session.id, encounterId)
                        }
                    />
                ))
            )}
        </Stack>
    );
}

function Content({ trackerStore }: { trackerStore: TrackerStore }) {
    const portraitState = usePortraitImagePickerState();
    const {
        state,
        events,
        cursor,
        isLoading,
        startEncounter,
        endEncounter,
        canStartEncounter,
        updateCharacter,
        deleteCharacter,
        deleteEncounter,
        renameCompletedEncounter,
        sortCharacters,
        previousTurn,
        nextTurn,
        toggleDisplay,
        recordCombat,
        recordKillingBlow,
        recordRevival,
        renameEncounter,
        renameSession,
        endSession,
        undo,
        redo,
        canUndo,
        canRedo,
    } = trackerStore;
    const [layoutDialogOpen, setLayoutDialogOpen] = useState(false);
    const [activityLogOpen, setActivityLogOpen] = useState(false);
    const currentSession = state.sessions.find(
        (session) => session.id === state.activeEncounter?.sessionId,
    ) ?? state.sessions.find(
        (session) => !session.endedAt && session.date === toLocalDate(new Date()),
    );
    const latestCompletedEncounter =
        currentSession?.encounters[currentSession.encounters.length - 1];
    const activeCombatants = state.characters
        .filter((character) => character.properties.name.trim())
        .map(snapshotCombatant);
    const recentEncounter = state.activeEncounter
        ? {
              name: state.activeEncounter.name,
              events: state.activeEncounter.combatEvents,
              combatants: activeCombatants,
          }
        : latestCompletedEncounter
          ? {
                name: latestCompletedEncounter.name,
                events: latestCompletedEncounter.combatEvents,
                combatants: latestCompletedEncounter.participants,
            }
          : undefined;
    const appliedLog = currentSession
        ? getSessionLogEntries(events.slice(0, cursor), currentSession.id)
        : [];

    if (isLoading) return <LinearProgress />;

    return (
        <Stack spacing={2}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                <Stack sx={{ minWidth: 0 }}>
                    <Typography variant="h5">Round: {state.round}</Typography>
                </Stack>
                <Stack direction="row">
                    <Tooltip title="Undo">
                        <span>
                            <IconButton size="small" disabled={!canUndo} onClick={undo}>
                                <Undo />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title="Redo">
                        <span>
                            <IconButton size="small" disabled={!canRedo} onClick={redo}>
                                <Redo />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title="Activity log">
                        <IconButton
                            size="small"
                            aria-label="Open activity log"
                            onClick={() => setActivityLogOpen(true)}
                        >
                            <FormatListBulleted />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Layout settings">
                        <IconButton size="small" onClick={() => setLayoutDialogOpen(true)}>
                            <Tune />
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Stack>

            <Dialog
                open={layoutDialogOpen}
                onClose={() => setLayoutDialogOpen(false)}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle sx={{ pr: 6 }}>Tracker layout</DialogTitle>
                <IconButton
                    aria-label="Close layout settings"
                    onClick={() => setLayoutDialogOpen(false)}
                    sx={{ position: "absolute", right: 8, top: 8 }}
                >
                    <Close />
                </IconButton>
                <DialogContent dividers>
                    <LayoutSettingsPanel />
                </DialogContent>
            </Dialog>

            <Dialog
                open={activityLogOpen}
                onClose={() => setActivityLogOpen(false)}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle sx={{ pr: 6 }}>
                    {currentSession ? `${currentSession.name} activity log` : "Activity log"}
                </DialogTitle>
                <IconButton
                    aria-label="Close activity log"
                    onClick={() => setActivityLogOpen(false)}
                    sx={{ position: "absolute", right: 8, top: 8 }}
                >
                    <Close />
                </IconButton>
                <DialogContent dividers>
                    <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Undo />}
                            disabled={!canUndo}
                            onClick={undo}
                        >
                            Undo
                        </Button>
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Redo />}
                            disabled={!canRedo}
                            onClick={redo}
                        >
                            Redo
                        </Button>
                    </Stack>
                    {appliedLog.length === 0 ? (
                        <ActivityLogList entries={appliedLog} />
                    ) : (
                        <ActivityLogList entries={appliedLog} />
                    )}
                </DialogContent>
            </Dialog>

            <CharacterTable>
                <CharacterRowHeader />
                {state.characters.map((character) => (
                    <CharacterRow
                        key={character.id}
                        hasTurn={character.id === state.currentCharacterId}
                        combatTrackingEnabled={state.hasEncounterStarted}
                        character={character}
                        portraitNames={(portraitState?.images ?? []).map(
                            (portrait) => portrait.displayName,
                        )}
                        onNameChange={(name) =>
                            updateCharacter(character.id, { ...character.properties, name })
                        }
                        onNameAndPortraitChange={(name, portraitImageId) =>
                            updateCharacter(character.id, {
                                ...character.properties,
                                name,
                                portraitImageId,
                            })
                        }
                        onDelete={() => deleteCharacter(character.id)}
                        onPlayerCharacterChange={(isPlayerCharacter) =>
                            updateCharacter(character.id, {
                                ...character.properties,
                                isPlayerCharacter,
                            })
                        }
                        onInitiativeChange={(initiative) =>
                            updateCharacter(character.id, {
                                ...character.properties,
                                initiative,
                            })
                        }
                        onInitiativeSubmit={sortCharacters}
                        onHealthChange={(health) => {
                            const delta = health - character.properties.health;
                            const hasRecordedHealthChange =
                                state.activeEncounter?.combatEvents.some(
                                    (event) => event.target.id === character.id,
                                );
                            const isInitialHealth =
                                character.properties.health === 0 &&
                                !hasRecordedHealthChange;
                            if (
                                state.hasEncounterStarted &&
                                delta !== 0 &&
                                !isInitialHealth
                            ) {
                                recordCombat(
                                    character.id,
                                    delta > 0 ? "healing" : "damage",
                                    Math.abs(delta),
                                );
                            } else {
                                updateCharacter(character.id, {
                                    ...character.properties,
                                    health: Math.max(0, health),
                                });
                            }
                        }}
                        onMaxHealthChange={(maxHealth) =>
                            updateCharacter(character.id, {
                                ...character.properties,
                                maxHealth,
                            })
                        }
                        onDamageTaken={(amount) =>
                            recordCombat(character.id, "damage", amount)
                        }
                        onKillingBlow={() => recordKillingBlow(character.id)}
                        onHealingReceived={(amount) =>
                            recordCombat(character.id, "healing", amount)
                        }
                        onRevive={() => recordRevival(character.id)}
                        onPortraitImageChange={(portraitImageId) =>
                            updateCharacter(character.id, {
                                ...character.properties,
                                portraitImageId,
                            })
                        }
                    />
                ))}
            </CharacterTable>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {!state.hasEncounterStarted ? (
                    <Button variant="contained" size="small" disabled={!canStartEncounter} onClick={startEncounter}>
                        Start Encounter
                    </Button>
                ) : (
                    <Button variant="contained" color="error" size="small" onClick={endEncounter}>
                        End Encounter
                    </Button>
                )}
                <Button variant="outlined" size="small" disabled={!state.hasEncounterStarted} onClick={previousTurn}>
                    Previous Turn
                </Button>
                <Button variant="outlined" size="small" disabled={!state.hasEncounterStarted} onClick={nextTurn}>
                    Next Turn
                </Button>
                <IconButton size="small" onClick={toggleDisplay}>
                    {state.isDisplayed ? <Visibility /> : <VisibilityOff />}
                </IconButton>
            </Stack>

            {recentEncounter && (
                <Summary
                    title={`${recentEncounter.name} summary`}
                    events={recentEncounter.events}
                    combatants={recentEncounter.combatants}
                    action={
                        state.activeEncounter && (
                            <NameEditButton
                                name={state.activeEncounter.name}
                                label="encounter"
                                onRename={renameEncounter}
                            />
                        )
                    }
                />
            )}

            {currentSession && (
                <CurrentSessionOverview
                    session={currentSession}
                    activeEvents={state.activeEncounter?.combatEvents ?? []}
                    activeEncounterName={state.activeEncounter?.name}
                    activeCombatants={activeCombatants}
                    onRename={(name) => renameSession(currentSession.id, name)}
                    onEnd={() => endSession(currentSession.id)}
                    canEnd={!state.hasEncounterStarted}
                    onDeleteEncounter={(encounterId) =>
                        deleteEncounter(currentSession.id, encounterId)
                    }
                    onRenameEncounter={(encounterId, name) =>
                        renameCompletedEncounter(currentSession.id, encounterId, name)
                    }
                />
            )}
        </Stack>
    );
}

function SessionOverview({
    session,
    onRename,
    onDelete,
    activityEntries,
    onRenameEncounter,
    onDeleteEncounter,
}: {
    session: GameSession;
    onRename: (name: string) => void;
    onDelete: () => void;
    activityEntries: ActivityLogEntry[];
    onRenameEncounter: (encounterId: string, name: string) => void;
    onDeleteEncounter: (encounterId: string) => void;
}) {
    const allEvents = session.encounters.flatMap((encounter) => encounter.combatEvents);
    const [activityLogOpen, setActivityLogOpen] = useState(false);
    return (
        <Accordion disableGutters>
            <AccordionSummary expandIcon={<ExpandMore />}>
                <Stack sx={{ minWidth: 0, flex: 1 }}>
                    <Typography>{session.name}</Typography>
                    <Typography variant="caption">
                        {formatDate(session.date)} · {session.encounters.length}{" "}
                        {session.encounters.length === 1 ? "encounter" : "encounters"}
                    </Typography>
                </Stack>
                <NameEditButton name={session.name} label="session" onRename={onRename} />
                <Tooltip title="Delete session">
                    <IconButton
                        size="small"
                        aria-label={`Delete ${session.name}`}
                        onClick={(event) => {
                            event.stopPropagation();
                            if (
                                window.confirm(
                                    `Delete ${session.name} and all of its encounters? You can undo this action.`,
                                )
                            ) {
                                onDelete();
                            }
                        }}
                    >
                        <Delete fontSize="small" />
                    </IconButton>
                </Tooltip>
                <CopySessionSummaryButton session={session} />
                <Tooltip title="Session activity log">
                    <IconButton
                        size="small"
                        aria-label={`Open ${session.name} activity log`}
                        onClick={(event) => {
                            event.stopPropagation();
                            setActivityLogOpen(true);
                        }}
                    >
                        <FormatListBulleted fontSize="small" />
                    </IconButton>
                </Tooltip>
            </AccordionSummary>
            <AccordionDetails>
                <Summary
                    title="Session totals"
                    events={allEvents}
                    combatants={session.encounters.flatMap((encounter) => encounter.participants)}
                />
                <Divider sx={{ my: 1 }} />
                <CreatureStatistics
                    events={allEvents}
                    encounters={session.encounters.map((encounter) => ({
                        id: encounter.id,
                        participants: encounter.participants,
                    }))}
                />
                {session.encounters.length > 0 && (
                    <Stack spacing={1} sx={{ pt: 1 }}>
                        {session.encounters.map((encounter) => (
                            <EncounterSummaryAccordion
                                key={encounter.id}
                                encounter={encounter}
                                onRename={(name) => onRenameEncounter(encounter.id, name)}
                                onDelete={() => onDeleteEncounter(encounter.id)}
                            />
                        ))}
                    </Stack>
                )}
            </AccordionDetails>
            <Dialog
                open={activityLogOpen}
                onClose={() => setActivityLogOpen(false)}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle sx={{ pr: 6 }}>{session.name} activity log</DialogTitle>
                <IconButton
                    aria-label="Close activity log"
                    onClick={() => setActivityLogOpen(false)}
                    sx={{ position: "absolute", right: 8, top: 8 }}
                >
                    <Close />
                </IconButton>
                <DialogContent dividers>
                    <ActivityLogList entries={activityEntries} />
                </DialogContent>
            </Dialog>
        </Accordion>
    );
}

function CurrentSessionOverview({
    session,
    activeEvents,
    activeEncounterName,
    activeCombatants,
    onRename,
    onEnd,
    canEnd,
    onRenameEncounter,
    onDeleteEncounter,
}: {
    session: GameSession;
    activeEvents: CombatEvent[];
    activeEncounterName?: string;
    activeCombatants: CombatantSnapshot[];
    onRename: (name: string) => void;
    onEnd: () => void;
    canEnd: boolean;
    onRenameEncounter: (encounterId: string, name: string) => void;
    onDeleteEncounter: (encounterId: string) => void;
}) {
    const allEvents = [
        ...session.encounters.flatMap((encounter) => encounter.combatEvents),
        ...activeEvents,
    ];
    const participants = [
        ...session.encounters.flatMap((encounter) => encounter.participants),
        ...activeCombatants,
    ];

    return (
        <Paper variant="outlined" sx={{ p: 1.5 }}>
            <Stack spacing={1}>
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
                    <Stack sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="overline">Current session</Typography>
                        <Typography>{session.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                            {formatDate(session.date)} · {session.encounters.length} completed{" "}
                            {session.encounters.length === 1 ? "encounter" : "encounters"}
                        </Typography>
                    </Stack>
                    <NameEditButton name={session.name} label="session" onRename={onRename} />
                    <Tooltip
                        title={canEnd ? "End current session" : "End the active encounter first"}
                    >
                        <span>
                            <Button
                                size="small"
                                color="error"
                                variant="outlined"
                                disabled={!canEnd}
                                onClick={() => {
                                    if (
                                        window.confirm(
                                            `End ${session.name}? It will move to History.`,
                                        )
                                    ) {
                                        onEnd();
                                    }
                                }}
                            >
                                End session
                            </Button>
                        </span>
                    </Tooltip>
                    <CopySessionSummaryButton
                        session={session}
                        activeEncounterName={activeEncounterName}
                        activeEvents={activeEvents}
                        activeCombatants={activeCombatants}
                    />
                </Stack>
                <Summary
                    title="Session totals"
                    events={allEvents}
                    combatants={participants}
                />
                {session.encounters.length > 0 && (
                    <Stack spacing={1} sx={{ pt: 1 }}>
                        {session.encounters.map((encounter) => (
                            <EncounterSummaryAccordion
                                key={encounter.id}
                                encounter={encounter}
                                onRename={(name) => onRenameEncounter(encounter.id, name)}
                                onDelete={() => onDeleteEncounter(encounter.id)}
                            />
                        ))}
                    </Stack>
                )}
            </Stack>
        </Paper>
    );
}

function EncounterSummaryAccordion({
    encounter,
    onRename,
    onDelete,
}: {
    encounter: Encounter;
    onRename: (name: string) => void;
    onDelete: () => void;
}) {
    return (
        <Accordion disableGutters>
            <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography sx={{ flex: 1 }}>
                    {encounter.name} · {encounter.rounds}{" "}
                    {encounter.rounds === 1 ? "round" : "rounds"}
                </Typography>
                <NameEditButton name={encounter.name} label="encounter" onRename={onRename} />
                <EncounterDeleteButton encounterName={encounter.name} onDelete={onDelete} />
            </AccordionSummary>
            <AccordionDetails>
                <Summary
                    title="Encounter totals"
                    events={encounter.combatEvents}
                    combatants={encounter.participants}
                />
            </AccordionDetails>
        </Accordion>
    );
}

function NameEditButton({
    name: currentName,
    label,
    onRename,
}: {
    name: string;
    label: "encounter" | "session";
    onRename: (name: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState(currentName);

    useEffect(() => setName(currentName), [currentName]);

    const submit = () => {
        const nextName = name.trim();
        if (!nextName) return;
        onRename(nextName);
        setOpen(false);
    };

    return (
        <>
            <Tooltip title={`Rename ${label}`}>
                <IconButton
                    size="small"
                    aria-label={`Rename ${currentName}`}
                    onClick={(event) => {
                        event.stopPropagation();
                        setName(currentName);
                        setOpen(true);
                    }}
                    onKeyDown={(event) => event.stopPropagation()}
                >
                    <Edit fontSize="small" />
                </IconButton>
            </Tooltip>
            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
                fullWidth
                maxWidth="xs"
            >
                <DialogTitle>Rename {label}</DialogTitle>
                <DialogContent dividers>
                    <Stack
                        component="form"
                        spacing={1.5}
                        onSubmit={(event) => {
                            event.preventDefault();
                            submit();
                        }}
                    >
                        <TextField
                            autoFocus
                            fullWidth
                            size="small"
                            label={`${label[0].toUpperCase()}${label.slice(1)} name`}
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                        />
                        <Button type="submit" variant="contained" disabled={!name.trim()}>
                            Save
                        </Button>
                    </Stack>
                </DialogContent>
            </Dialog>
        </>
    );
}

interface ActivityLogEntry {
    event: TrackerEvent;
    description: string;
}

function getSessionLogEntries(
    events: TrackerEvent[],
    sessionId: string,
): ActivityLogEntry[] {
    let inferredSessionId: string | undefined;
    const entries: ActivityLogEntry[] = [];

    for (const event of events) {
        if (event.type === "encounter-started") inferredSessionId = event.session.id;
        const eventSessionId =
            event.sessionId ??
            (event.type === "combat-recorded" ? event.event.sessionId : undefined) ??
            inferredSessionId;
        const description = describeTrackerEvent(event);
        if (eventSessionId === sessionId && description) {
            entries.push({ event, description });
        }
        if (
            (event.type === "session-ended" || event.type === "session-deleted") &&
            event.sessionId === inferredSessionId
        ) {
            inferredSessionId = undefined;
        }
    }

    return entries.reverse();
}

function ActivityLogList({ entries }: { entries: ActivityLogEntry[] }) {
    if (entries.length === 0) {
        return <Typography color="text.secondary">No activity recorded yet.</Typography>;
    }

    return (
        <List dense disablePadding>
            {entries.map(({ event, description }) => (
                <ListItem key={event.id} disableGutters>
                    <ListItemText
                        primary={description}
                        secondary={new Date(event.timestamp).toLocaleString()}
                    />
                </ListItem>
            ))}
        </List>
    );
}

function CopySessionSummaryButton({
    session,
    activeEncounterName,
    activeEvents = [],
    activeCombatants = [],
}: {
    session: GameSession;
    activeEncounterName?: string;
    activeEvents?: CombatEvent[];
    activeCombatants?: CombatantSnapshot[];
}) {
    const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
    const title =
        copyStatus === "copied"
            ? "Copied session summary"
            : copyStatus === "error"
              ? "Could not copy session summary"
              : "Copy session summary";

    return (
        <Tooltip title={title}>
            <IconButton
                size="small"
                aria-label={`Copy ${session.name} summary`}
                onClick={(event) => {
                    event.stopPropagation();
                    navigator.clipboard
                        .writeText(
                            buildSessionSummary(
                                session,
                                activeEvents,
                                activeEncounterName,
                                activeCombatants,
                            ),
                        )
                        .then(() => setCopyStatus("copied"))
                        .catch(() => setCopyStatus("error"));
                }}
            >
                <ContentCopy fontSize="small" />
            </IconButton>
        </Tooltip>
    );
}

function buildSessionSummary(
    session: GameSession,
    activeEvents: CombatEvent[],
    activeEncounterName?: string,
    activeCombatants: CombatantSnapshot[] = [],
): string {
    const allEvents = [
        ...session.encounters.flatMap((encounter) => encounter.combatEvents),
        ...activeEvents,
    ];
    const participants = [
        ...session.encounters.flatMap((encounter) => encounter.participants),
        ...activeCombatants,
    ];
    const combatants = aggregateCombatants(allEvents, participants).filter(
        (row) =>
            row.damageDealt ||
            row.damageReceived ||
            row.healingGiven ||
            row.healingReceived ||
            row.selfHealing ||
            row.teamDamage ||
            row.downs ||
            row.killingBlows ||
            row.revivals,
    );
    const lines = [
        `${session.name} - ${formatDate(session.date)}`,
        `${session.encounters.length} completed ${
            session.encounters.length === 1 ? "encounter" : "encounters"
        }${activeEncounterName ? ", 1 active encounter" : ""}`,
        "",
        "Encounters:",
        ...session.encounters.map(
            (encounter) =>
                `- ${encounter.name}: ${encounter.rounds} ${
                    encounter.rounds === 1 ? "round" : "rounds"
                }`,
        ),
        ...(activeEncounterName ? [`- ${activeEncounterName}: active`] : []),
    ];

    if (combatants.length > 0) {
        lines.push("", "Combat totals:");
        for (const row of combatants) {
            const metrics = [
                row.damageDealt > 0 ? `${row.damageDealt} damage dealt` : "",
                row.highestDamageRoll > 0
                    ? `${row.highestDamageRoll} highest damage roll`
                    : "",
                row.overkillDamage > 0 ? `${row.overkillDamage} overkill` : "",
                row.damageReceived > 0 ? `${row.damageReceived} damage received` : "",
                row.healingGiven > 0 ? `${row.healingGiven} healing given` : "",
                row.healingReceived > 0 ? `${row.healingReceived} healing received` : "",
                row.selfHealing > 0 ? `${row.selfHealing} self-healed` : "",
                row.teamDamage > 0 ? `${row.teamDamage} team damage` : "",
                row.downs > 0 ? `${row.downs} down${row.downs === 1 ? "" : "s"}` : "",
                row.killingBlows > 0 ? `${row.killingBlows} killing blow${row.killingBlows === 1 ? "" : "s"}` : "",
                row.revivals > 0 ? `${row.revivals} revival${row.revivals === 1 ? "" : "s"}` : "",
            ].filter(Boolean);
            lines.push(`- ${row.name}: ${metrics.join(", ")}`);
        }
    }

    const creatures = aggregateCreatureStatistics(
        allEvents,
        [
            ...session.encounters.map((encounter) => ({
                id: encounter.id,
                participants: encounter.participants,
            })),
            ...(activeCombatants.length > 0 && activeEvents[0]
                ? [{ id: activeEvents[0].encounterId, participants: activeCombatants }]
                : []),
        ],
    );
    if (creatures.length > 0) {
        lines.push("", "Creatures:");
        for (const creature of creatures) {
            lines.push(
                `- ${creature.name}: ${creature.ids.size} encountered across ${
                    creature.encounterIds.size
                } ${creature.encounterIds.size === 1 ? "encounter" : "encounters"}, ${
                    creature.damageDealt
                } damage dealt, ${creature.highestDamageRoll} highest damage roll, ${
                    creature.overkillDamage
                } overkill, ${creature.damageReceived} damage received, ${
                    creature.healingGiven
                } healing given, ${creature.healingReceived} healing received, ${
                    creature.downs
                } down${creature.downs === 1 ? "" : "s"}`,
            );
        }
    }

    const highlights = buildHighlights(aggregateCombatants(allEvents, participants, true));
    if (highlights.length > 0) lines.push("", "Highlights:", ...highlights.map((highlight) => `- ${highlight}`));

    return lines.join("\n");
}

function EncounterDeleteButton({
    encounterName,
    onDelete,
}: {
    encounterName: string;
    onDelete: () => void;
}) {
    return (
        <Tooltip title="Delete encounter">
            <IconButton
                size="small"
                aria-label={`Delete ${encounterName}`}
                onClick={(event) => {
                    event.stopPropagation();
                    if (window.confirm(`Delete ${encounterName}? You can undo this action.`)) {
                        onDelete();
                    }
                }}
            >
                <Delete fontSize="small" />
            </IconButton>
        </Tooltip>
    );
}

function Summary({
    title,
    events,
    combatants = [],
    action,
}: {
    title: string;
    events: CombatEvent[];
    combatants?: CombatantSnapshot[];
    action?: ReactNode;
}) {
    const [npcExpanded, setNpcExpanded] = useState(false);
    const rows = useMemo(
        () =>
            aggregateCombatants(events, combatants).filter(
                (row) =>
                    row.damageDealt ||
                    row.damageReceived ||
                    row.healingGiven ||
                    row.healingReceived ||
                    row.selfHealing ||
                    row.teamDamage ||
                    row.downs ||
                    row.killingBlows ||
                    row.revivals,
            ),
        [events, combatants],
    );
    const individualRows = useMemo(
        () => aggregateCombatants(events, combatants, true),
        [events, combatants],
    );
    return (
        <Paper variant="outlined" sx={{ p: 1.5 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                <Typography variant="subtitle1">{title}</Typography>
                {action}
            </Stack>
            {rows.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                    No combat activity recorded.
                </Typography>
            ) : (
                <Stack spacing={1}>
                    {rows.map((row) => (
                        <Stack
                            key={row.key}
                            direction="row"
                            alignItems="center"
                            spacing={0.75}
                            useFlexGap
                            flexWrap="wrap"
                        >
                            {row.key === "all-npcs" && (
                                <IconButton size="small" aria-label="Expand NPC summaries" onClick={() => setNpcExpanded((value) => !value)}>
                                    <ExpandMore sx={{ transform: npcExpanded ? "rotate(180deg)" : undefined }} />
                                </IconButton>
                            )}
                            <Typography variant="body2" fontWeight={600} sx={{ mr: 0.25 }}>
                                {row.name}:
                            </Typography>
                            {row.damageDealt > 0 && (
                                <Chip
                                    size="small"
                                    color="error"
                                    icon={<LocalFireDepartment />}
                                    label={`${row.damageDealt} dealt`}
                                />
                            )}
                            {row.highestDamageRoll > 0 && (
                                <Chip
                                    size="small"
                                    color="error"
                                    variant="outlined"
                                    label={`${row.highestDamageRoll} highest roll`}
                                />
                            )}
                            {row.overkillDamage > 0 && (
                                <Chip
                                    size="small"
                                    color="warning"
                                    variant="outlined"
                                    label={`${row.overkillDamage} overkill`}
                                />
                            )}
                            {row.damageReceived > 0 && (
                                <Chip
                                    size="small"
                                    color="error"
                                    variant="outlined"
                                    icon={<Shield />}
                                    label={`${row.damageReceived} received`}
                                />
                            )}
                            {row.healingGiven > 0 && (
                                <Chip
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                    icon={<FavoriteBorder />}
                                    label={`${row.healingGiven} healing given`}
                                />
                            )}
                            {row.healingReceived > 0 && (
                                <Chip
                                    size="small"
                                    color="success"
                                    icon={<Favorite />}
                                    label={`${row.healingReceived} healed`}
                                />
                            )}
                            {row.selfHealing > 0 && (
                                <Chip
                                    size="small"
                                    color="success"
                                    icon={<Favorite />}
                                    label={`${row.selfHealing} self-healed`}
                                />
                            )}
                            {row.teamDamage > 0 && (
                                <Chip
                                    size="small"
                                    color="warning"
                                    variant="outlined"
                                    icon={<Groups />}
                                    label={`${row.teamDamage} team damage`}
                                />
                            )}
                            {row.downs > 0 && (
                                <Chip
                                    size="small"
                                    color="warning"
                                    variant="outlined"
                                    label={`${row.downs} down${row.downs === 1 ? "" : "s"}`}
                                />
                            )}
                            {row.killingBlows > 0 && (
                                <Chip
                                    size="small"
                                    color="warning"
                                    icon={<MilitaryTech />}
                                    label={`${row.killingBlows} killing blow${row.killingBlows === 1 ? "" : "s"}`}
                                />
                            )}
                            {row.revivals > 0 && (
                                <Chip size="small" color="success" variant="outlined" label={`${row.revivals} revival${row.revivals === 1 ? "" : "s"}`} />
                            )}
                            {row.key === "all-npcs" && npcExpanded && (
                                <Stack sx={{ width: "100%", pl: 4 }} spacing={0.5}>
                                    {individualRows
                                        .filter((npc) => !npc.isPlayerCharacter)
                                        .map((npc) => (
                                            <Typography key={npc.key} variant="caption">
                                                {npc.name}: {formatCombatMetrics(npc)}
                                            </Typography>
                                        ))}
                                </Stack>
                            )}
                        </Stack>
                    ))}
                </Stack>
            )}
            <Highlights rows={individualRows} />
        </Paper>
    );
}

function CreatureStatistics({
    events,
    encounters,
}: {
    events: CombatEvent[];
    encounters: Array<{ id: string; participants: CombatantSnapshot[] }>;
}) {
    const creatures = useMemo(
        () => aggregateCreatureStatistics(events, encounters),
        [encounters, events],
    );

    return (
        <Stack spacing={0.5}>
            <Typography variant="subtitle1">Creature statistics</Typography>
            {creatures.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No NPC activity recorded.</Typography>
            ) : (
                creatures.map((creature) => (
                    <Typography variant="body2" key={creature.name}>
                        <strong>{creature.name}</strong>: {creature.ids.size} creatures across{" "}
                        {creature.encounterIds.size} encounters, {formatCreatureMetrics(creature)}
                    </Typography>
                ))
            )}
        </Stack>
    );
}

function aggregateCreatureStatistics(
    events: CombatEvent[],
    encounters: Array<{ id: string; participants: CombatantSnapshot[] }>,
) {
    const values = new Map<
        string,
        {
            name: string;
            damageDealt: number;
            highestDamageRoll: number;
            overkillDamage: number;
            damageReceived: number;
            healingGiven: number;
            healingReceived: number;
            selfHealing: number;
            downs: number;
            ids: Set<string>;
            encounterIds: Set<string>;
        }
    >();
    const combatantsById = new Map(
        encounters
            .flatMap((encounter) => encounter.participants)
            .map((combatant) => [combatant.id, combatant]),
    );
    const resolveCombatant = (combatant: CombatantSnapshot) =>
        combatantsById.get(combatant.id) ?? combatant;
    const addCreature = (candidate: CombatantSnapshot, encounterId: string) => {
        const combatant = resolveCombatant(candidate);
        if (combatant.isPlayerCharacter) return;
        const key = combatant.creatureType.toLocaleLowerCase();
        if (!values.has(key)) {
            values.set(key, {
                name: combatant.creatureType,
                damageDealt: 0,
                highestDamageRoll: 0,
                overkillDamage: 0,
                damageReceived: 0,
                healingGiven: 0,
                healingReceived: 0,
                selfHealing: 0,
                downs: 0,
                ids: new Set(),
                encounterIds: new Set(),
            });
        }
        values.get(key)!.ids.add(combatant.id);
        values.get(key)!.encounterIds.add(encounterId);
    };
    for (const encounter of encounters) {
        for (const participant of encounter.participants) {
            addCreature(participant, encounter.id);
        }
    }
    for (const event of events) {
        const source = event.source ? resolveCombatant(event.source) : undefined;
        const target = resolveCombatant(event.target);
        if (source) addCreature(source, event.encounterId);
        addCreature(target, event.encounterId);
        if (event.type === "damage") {
            if (source && !source.isPlayerCharacter) {
                const sourceStatistics = values.get(source.creatureType.toLocaleLowerCase())!;
                sourceStatistics.damageDealt += event.amount;
                sourceStatistics.highestDamageRoll = Math.max(
                    sourceStatistics.highestDamageRoll,
                    event.amount,
                );
                sourceStatistics.overkillDamage += event.overkill ?? 0;
            }
            if (!target.isPlayerCharacter) {
                values.get(target.creatureType.toLocaleLowerCase())!.damageReceived += event.amount;
            }
        } else if (source?.id === target.id) {
            if (!target.isPlayerCharacter) {
                values.get(target.creatureType.toLocaleLowerCase())!.selfHealing += event.amount;
            }
        } else {
            if (source && !source.isPlayerCharacter) {
                values.get(source.creatureType.toLocaleLowerCase())!.healingGiven += event.amount;
            }
            if (!target.isPlayerCharacter) {
                values.get(target.creatureType.toLocaleLowerCase())!.healingReceived += event.amount;
            }
        }
        if ((event.downed ?? event.killingBlow) && !target.isPlayerCharacter) {
            values.get(target.creatureType.toLocaleLowerCase())!.downs += 1;
        }
    }
    return [...values.values()];
}

interface CombatantSummary {
    key: string;
    name: string;
    initiative?: number;
    isPlayerCharacter: boolean;
    damageDealt: number;
    highestDamageRoll: number;
    overkillDamage: number;
    damageReceived: number;
    healingGiven: number;
    healingReceived: number;
    selfHealing: number;
    teamDamage: number;
    downs: number;
    killingBlows: number;
    revivals: number;
}

function aggregateCombatants(
    events: CombatEvent[],
    combatants: CombatantSnapshot[],
    separateNpcs = false,
): CombatantSummary[] {
    const rows = new Map<string, CombatantSummary>();
    const combatantsById = new Map(combatants.map((combatant) => [combatant.id, combatant]));
    const resolveCombatant = (combatant: CombatantSnapshot) =>
        combatantsById.get(combatant.id) ?? combatant;
    const rowFor = (candidate: CombatantSnapshot) => {
        const combatant = resolveCombatant(candidate);
        const key = combatant.isPlayerCharacter || separateNpcs ? combatant.id : "all-npcs";
        if (!rows.has(key)) {
            rows.set(key, {
                key,
                name: combatant.isPlayerCharacter || separateNpcs ? combatant.name : "NPCs",
                initiative: combatant.initiative,
                isPlayerCharacter: combatant.isPlayerCharacter,
                damageDealt: 0,
                highestDamageRoll: 0,
                overkillDamage: 0,
                damageReceived: 0,
                healingGiven: 0,
                healingReceived: 0,
                selfHealing: 0,
                teamDamage: 0,
                downs: 0,
                killingBlows: 0,
                revivals: 0,
            });
        }
        return rows.get(key)!;
    };

    for (const combatant of combatants) rowFor(combatant);
    for (const event of events) {
        const source = event.source ? resolveCombatant(event.source) : undefined;
        const target = resolveCombatant(event.target);
        if (event.downed ?? event.killingBlow) rowFor(target).downs += 1;
        if (event.killingBlow && source) rowFor(source).killingBlows += 1;
        if (event.revival && source) rowFor(source).revivals += 1;
        if (event.type === "healing" && source?.id === target.id) {
            rowFor(target).selfHealing += event.amount;
            continue;
        }
        if (source) {
            const sourceRow = rowFor(source);
            if (event.type === "damage") {
                sourceRow.damageDealt += event.amount;
                sourceRow.highestDamageRoll = Math.max(sourceRow.highestDamageRoll, event.amount);
                sourceRow.overkillDamage += event.overkill ?? 0;
                if (
                    source.isPlayerCharacter &&
                    target.isPlayerCharacter &&
                    source.id !== target.id
                ) {
                    sourceRow.teamDamage += event.amount;
                }
            } else {
                sourceRow.healingGiven += event.amount;
            }
        }
        const targetRow = rowFor(target);
        if (event.type === "damage") targetRow.damageReceived += event.amount;
        else targetRow.healingReceived += event.amount;
    }
    return [...rows.values()].sort((a, b) => {
        if (a.isPlayerCharacter !== b.isPlayerCharacter) {
            return a.isPlayerCharacter ? -1 : 1;
        }
        return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });
}

function formatCombatMetrics(row: CombatantSummary): string {
    return [
        row.damageDealt > 0 ? `${row.damageDealt} dealt` : "",
        row.highestDamageRoll > 0 ? `${row.highestDamageRoll} highest roll` : "",
        row.overkillDamage > 0 ? `${row.overkillDamage} overkill` : "",
        row.damageReceived > 0 ? `${row.damageReceived} received` : "",
        row.healingGiven > 0 ? `${row.healingGiven} healing given` : "",
        row.healingReceived > 0 ? `${row.healingReceived} healed` : "",
        row.selfHealing > 0 ? `${row.selfHealing} self-healed` : "",
        row.teamDamage > 0 ? `${row.teamDamage} team damage` : "",
        row.downs > 0 ? `${row.downs} down${row.downs === 1 ? "" : "s"}` : "",
        row.killingBlows > 0
            ? `${row.killingBlows} killing blow${row.killingBlows === 1 ? "" : "s"}`
            : "",
        row.revivals > 0 ? `${row.revivals} revival${row.revivals === 1 ? "" : "s"}` : "",
    ]
        .filter(Boolean)
        .join(", ");
}

function formatCreatureMetrics(creature: ReturnType<typeof aggregateCreatureStatistics>[number]): string {
    return [
        `${creature.damageDealt} damage dealt`,
        `${creature.highestDamageRoll} highest damage roll`,
        `${creature.overkillDamage} overkill`,
        `${creature.damageReceived} damage received`,
        `${creature.healingGiven} healing given`,
        `${creature.healingReceived} healing received`,
        `${creature.selfHealing} self-healed`,
        `${creature.downs} down${creature.downs === 1 ? "" : "s"}`,
    ].join(", ");
}

function Highlights({ rows }: { rows: CombatantSummary[] }) {
    const highlights = buildHighlights(rows);
    if (highlights.length === 0) return null;
    return (
        <Stack spacing={0.25} sx={{ pt: 0.5 }}>
            <Typography variant="subtitle2">Highlights</Typography>
            {highlights.map((highlight) => (
                <Typography key={highlight} variant="body2" color="text.secondary">
                    {highlight}
                </Typography>
            ))}
        </Stack>
    );
}

function buildHighlights(rows: CombatantSummary[]): string[] {
    const highlights = [
        buildTopHighlight("Most damage dealt", rows, (row) => row.damageDealt, "damage"),
        buildTopHighlight("Highest damage roll", rows, (row) => row.highestDamageRoll, "damage"),
        buildTopHighlight("Most revivals", rows, (row) => row.revivals, "revival"),
        buildTopHighlight(
            "Most heals",
            rows,
            (row) => row.healingGiven + row.selfHealing,
            "healing",
        ),
        buildTopHighlight("Most damage taken", rows, (row) => row.damageReceived, "damage"),
        buildTopHighlight("Most team damage", rows, (row) => row.teamDamage, "team damage"),
    ].filter((highlight): highlight is string => Boolean(highlight));
    const rowsWithInitiative = rows.filter((row) => Number.isFinite(row.initiative));
    if (rowsWithInitiative.length > 0) {
        const highestInitiative = Math.max(
            ...rowsWithInitiative.map((row) => row.initiative as number),
        );
        const names = rowsWithInitiative
            .filter((row) => row.initiative === highestInitiative)
            .map((row) => row.name)
            .join(", ");
        highlights.push(`Highest initiative roll: ${names} (${highestInitiative})`);
    }
    return highlights;
}

function buildTopHighlight(
    label: string,
    rows: CombatantSummary[],
    metric: (row: CombatantSummary) => number,
    unit: string,
): string | null {
    const topValue = Math.max(0, ...rows.map(metric));
    if (topValue === 0) return null;
    const names = rows
        .filter((row) => metric(row) === topValue)
        .map((row) => row.name)
        .join(", ");
    return `${label}: ${names} (${topValue} ${unit})`;
}

function formatDate(date: string) {
    return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

const CharacterTable = styled("div")`
    display: flex;
    flex-direction: column;
    gap: 10px;
`;
