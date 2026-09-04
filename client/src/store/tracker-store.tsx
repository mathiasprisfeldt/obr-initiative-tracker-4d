import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRoomConnection, type RoomConnectionStatus } from "../hooks/use-room-connection";
import type { RoomConnectionLogEntry } from "obr-initiative-tracker-4d-backend/api-client";
import { useApi } from "./settings-store";
import type { LayoutSettings } from "../tracker/layout-settings";
import {
    appendTrackerEvent,
    createCharacter,
    createInitialTrackerDocument,
    deriveTrackerState,
    normalizeTrackerDocument,
    numberDuplicateCharacters,
    snapshotCombatant,
    toLocalDate,
    type Character,
    type CharacterProperties,
    type CombatEvent,
    type Encounter,
    type GameSession,
    type LegacyTrackerState,
    type TrackerDocument,
    type TrackerEvent,
    type TrackerState,
} from "./tracker-domain";

export type {
    ActiveEncounter,
    Character,
    CharacterProperties,
    CombatEvent,
    CombatantSnapshot,
    Encounter,
    GameSession,
    TrackerDocument,
    TrackerEvent,
    TrackerState,
} from "./tracker-domain";

const TRACKER_STATE_KEY = "tracker";

export interface TrackerStore {
    state: TrackerState;
    document: TrackerDocument;
    events: TrackerEvent[];
    cursor: number;
    isLoading: boolean;
    canStartEncounter: boolean;
    canUndo: boolean;
    canRedo: boolean;
    roomConnectionStatus: RoomConnectionStatus;
    updateCharacter(id: string, properties: CharacterProperties): void;
    deleteCharacter(id: string): void;
    sortCharacters(): void;
    previousTurn(): void;
    nextTurn(): void;
    startEncounter(): void;
    endEncounter(): void;
    deleteEncounter(sessionId: string, encounterId: string): void;
    renameCompletedEncounter(sessionId: string, encounterId: string, name: string): void;
    renameEncounter(name: string): void;
    setDraftEncounterName(name: string): void;
    renameSession(sessionId: string, name: string): void;
    endSession(sessionId: string): void;
    deleteSession(sessionId: string): void;
    recordCombat(targetId: string, type: "damage" | "healing", amount: number): void;
    recordRevival(targetId: string): void;
    recordKillingBlow(targetId: string): void;
    replaceDocument(document: TrackerDocument): void;
    undo(): void;
    redo(): void;
    toggleDisplay(): void;
    updateLayoutSettings(settings: LayoutSettings): void;
}

const emptyDocument = createInitialTrackerDocument();
const context = createContext<TrackerStore>(null!);

export interface TrackerResult {
    state: TrackerState | undefined;
    connectionStatus: RoomConnectionStatus;
    logs: RoomConnectionLogEntry[];
    reconnect(): void;
}

export function useTrackerStore(): TrackerStore {
    return useContext(context);
}

export function useTracker(): TrackerResult {
    const [state, setState] = useState<TrackerState>();
    const room = useRoomConnection<TrackerDocument | LegacyTrackerState>({
        key: TRACKER_STATE_KEY,
        onInitialState: (serverState) => {
            if (serverState) setState(cleanUpStateForClient(deriveTrackerState(normalizeTrackerDocument(serverState))));
        },
        onStateChanged: (incomingState) => {
            setState(cleanUpStateForClient(deriveTrackerState(normalizeTrackerDocument(incomingState))));
        },
    });
    return { state, connectionStatus: room.status, logs: room.logs, reconnect: room.reconnect };
}

function cleanUpStateForClient(state: TrackerState): TrackerState {
    return {
        ...state,
        characters: state.characters.filter(
            (character) =>
                character.properties.name.trim() !== "" &&
                (character.properties.isPlayerCharacter ||
                    !(character.properties.maxHealth > 0 && character.properties.health <= 0)),
        ),
    };
}

export function TrackerStoreProvider({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(true);
    const [document, setDocument] = useState<TrackerDocument>(emptyDocument);
    const documentRef = useRef(document);
    const hasReceivedInitialStateRef = useRef(false);
    const state = useMemo(() => deriveTrackerState(document), [document]);
    documentRef.current = document;

    const room = useRoomConnection<TrackerDocument | LegacyTrackerState>({
        key: TRACKER_STATE_KEY,
        onInitialState: (serverState) => {
            if (hasReceivedInitialStateRef.current) {
                room.updateState(documentRef.current);
            } else {
                hasReceivedInitialStateRef.current = true;
                if (serverState) {
                    const incoming = normalizeTrackerDocument(serverState);
                    documentRef.current = incoming;
                    setDocument(incoming);
                } else {
                    room.updateState(documentRef.current);
                }
            }
            setIsLoading(false);
        },
        onStateChanged: (incomingState) => {
            const incoming = normalizeTrackerDocument(incomingState);
            documentRef.current = incoming;
            setDocument(incoming);
        },
    });

    const api = useApi();
    useEffect(() => {
        if (!api) return;
        const id = setInterval(() => api.isHealthy(), 10 * 60 * 1000);
        return () => clearInterval(id);
    }, [api]);

    const dispatch = (event: TrackerEvent) => {
        updateLocalDocument((current) => appendTrackerEvent(current, event));
    };
    const updateLocalDocument = (update: (current: TrackerDocument) => TrackerDocument) => {
        const next = update(documentRef.current);
        documentRef.current = next;
        setDocument(next);
        room.updateState(next);
    };
    const getCurrentState = () => deriveTrackerState(documentRef.current);
    const eventBase = (sessionId?: string) => {
        const current = getCurrentState();
        const currentSessionId =
            sessionId ??
            current.activeEncounter?.sessionId ??
            current.sessions.find(
                (session) => session.date === toLocalDate(new Date()) && !session.endedAt,
            )?.id;
        return {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            sessionId: currentSessionId,
        };
    };
    const recordCombat = (
        targetId: string,
        type: "damage" | "healing",
        amount: number,
        forcedResult?: "killing-blow" | "revival",
    ) => {
        const current = deriveTrackerState(documentRef.current);
        const encounter = current.activeEncounter;
        const target = current.characters.find((character) => character.id === targetId);
        if (
            !encounter ||
            !target ||
            !Number.isFinite(amount) ||
            (amount <= 0 && !forcedResult) ||
            (forcedResult && !target.properties.isPlayerCharacter) ||
            (forcedResult === "revival" && type !== "healing") ||
            (forcedResult === "killing-blow" && type !== "damage")
        ) {
            return;
        }
        const source = current.characters.find(
            (character) => character.id === current.currentCharacterId,
        );
        const combatEvent: CombatEvent = {
            id: crypto.randomUUID(),
            type,
            timestamp: new Date().toISOString(),
            sessionId: encounter.sessionId,
            encounterId: encounter.id,
            round: current.round,
            source: source ? snapshotCombatant(source) : undefined,
            target: snapshotCombatant(target),
            amount,
        };
        const targetHealth = target.properties.isPlayerCharacter
            ? undefined
            : Math.max(0, target.properties.health + (type === "healing" ? amount : -amount));
        const isDifferentSource = !source || source.id !== target.id;
        const killingBlow =
            forcedResult === "killing-blow" ||
            (type === "damage" &&
                isDifferentSource &&
                targetHealth === 0 &&
                target.properties.health > 0);
        const revival =
            forcedResult === "revival" ||
            (type === "healing" &&
                isDifferentSource &&
                target.properties.health === 0 &&
                targetHealth !== undefined &&
                targetHealth > 0);
        if (killingBlow || revival) {
            combatEvent.killingBlow = killingBlow;
            combatEvent.revival = revival;
        }
        dispatch({ ...eventBase(), type: "combat-recorded", event: combatEvent, targetHealth });
    };

    const value: TrackerStore = {
        state,
        document,
        events: document.events,
        cursor: document.cursor,
        isLoading,
        canStartEncounter:
            !state.hasEncounterStarted &&
            state.characters.filter((character) => character.properties.name.trim()).length > 0,
        canUndo: document.cursor > 0,
        canRedo: document.cursor < document.events.length,
        roomConnectionStatus: room.status,
        updateCharacter: (id, properties) => {
            const character = getCurrentState().characters.find((item) => item.id === id);
            if (!character) {
                dispatch({ ...eventBase(), type: "character-updated", character: { id, properties } });
                return;
            }
            const adjusted = { ...properties, health: Math.max(0, properties.health) };
            if (!adjusted.isPlayerCharacter && adjusted.health > adjusted.maxHealth) {
                adjusted.maxHealth = adjusted.health;
            }
            if (character.properties.name.trim() && !adjusted.name.trim()) {
                dispatch({
                    ...eventBase(),
                    type: "character-deleted",
                    characterId: id,
                    characterName: character.properties.name,
                });
                return;
            }
            const isNamingDraft =
                !character.properties.name.trim() && adjusted.name.trim() !== "";
            const numbered = isNamingDraft
                ? numberDuplicateCharacters(getCurrentState().characters, {
                      id,
                      properties: adjusted,
                  })
                : {
                      character: { id, properties: adjusted },
                      additionalCharacters: [],
                  };
            dispatch({
                ...eventBase(),
                type: "character-updated",
                character: numbered.character,
                additionalCharacters: numbered.additionalCharacters,
                previousCharacter: character,
                newDraftCharacterId: isNamingDraft ? crypto.randomUUID() : undefined,
            });
        },
        deleteCharacter: (characterId) => {
            const character = getCurrentState().characters.find(
                (item) => item.id === characterId,
            );
            dispatch({
                ...eventBase(),
                type: "character-deleted",
                characterId,
                characterName: character?.properties.name,
            });
        },
        sortCharacters: () => {
            const ids = [...getCurrentState().characters]
                .sort((a, b) => {
                    if (!b.properties.name) return -1;
                    if (!a.properties.name) return 1;
                    return (b.properties.initiative || 0) - (a.properties.initiative || 0);
                })
                .map((character) => character.id);
            dispatch({ ...eventBase(), type: "characters-sorted", characterIds: ids });
        },
        previousTurn: () => changeTurn(-1),
        nextTurn: () => changeTurn(1),
        startEncounter: () => {
            const current = getCurrentState();
            const now = new Date();
            const date = toLocalDate(now);
            const activeSession = current.sessions.find(
                (session) => session.date === date && !session.endedAt,
            );
            const session: GameSession =
                activeSession ?? {
                    id: crypto.randomUUID(),
                    date,
                    name: `Session ${current.sessions.length + 1}`,
                    encounters: [],
                };
            dispatch({
                ...eventBase(session.id),
                type: "encounter-started",
                session,
                encounter: {
                    id: crypto.randomUUID(),
                    sessionId: session.id,
                    name:
                        current.draftEncounterName?.trim() ||
                        `Encounter ${session.encounters.length + 1}`,
                    startedAt: now.toISOString(),
                    combatEvents: [],
                },
            });
        },
        endEncounter: () => {
            const current = getCurrentState();
            if (!current.activeEncounter) return;
            const encounter: Encounter = {
                id: current.activeEncounter.id,
                name: current.activeEncounter.name,
                startedAt: current.activeEncounter.startedAt,
                endedAt: new Date().toISOString(),
                rounds: current.round,
                participants: current.characters
                    .filter((character) => character.properties.name.trim())
                    .map(snapshotCombatant),
                combatEvents: current.activeEncounter.combatEvents,
            };
            dispatch({
                ...eventBase(),
                type: "encounter-ended",
                sessionId: current.activeEncounter.sessionId,
                encounter,
                remainingCharacters: current.characters.filter(
                    (character) =>
                        character.properties.isPlayerCharacter || !character.properties.name.trim(),
                ),
            });
        },
        deleteEncounter: (sessionId, encounterId) => {
            const encounter = getCurrentState().sessions
                .find((session) => session.id === sessionId)
                ?.encounters.find((item) => item.id === encounterId);
            if (!encounter) return;
            dispatch({
                ...eventBase(),
                type: "encounter-deleted",
                sessionId,
                encounterId,
                encounterName: encounter.name,
            });
        },
        renameCompletedEncounter: (sessionId, encounterId, name) => {
            const encounter = getCurrentState().sessions
                .find((session) => session.id === sessionId)
                ?.encounters.find((item) => item.id === encounterId);
            const nextName = name.trim();
            if (!encounter || !nextName || nextName === encounter.name) return;
            dispatch({
                ...eventBase(),
                type: "completed-encounter-renamed",
                sessionId,
                encounterId,
                previousName: encounter.name,
                name: nextName,
            });
        },
        renameEncounter: (name) =>
            dispatch({ ...eventBase(), type: "encounter-renamed", name: name.trim() || "Encounter" }),
        setDraftEncounterName: (name) =>
            dispatch({
                ...eventBase(),
                type: "encounter-name-drafted",
                name: name.trim(),
            }),
        renameSession: (sessionId, name) =>
            dispatch({
                ...eventBase(),
                type: "session-renamed",
                sessionId,
                name: name.trim() || "Session",
            }),
        endSession: (sessionId) => {
            const current = getCurrentState();
            if (current.hasEncounterStarted) return;
            const session = current.sessions.find((item) => item.id === sessionId);
            if (!session || session.endedAt) return;
            dispatch({
                ...eventBase(),
                type: "session-ended",
                sessionId,
                endedAt: new Date().toISOString(),
            });
        },
        deleteSession: (sessionId) => {
            const session = getCurrentState().sessions.find((item) => item.id === sessionId);
            if (!session?.endedAt) return;
            dispatch({
                ...eventBase(),
                type: "session-deleted",
                sessionId,
                sessionName: session.name,
            });
        },
        recordCombat,
        recordRevival: (targetId) => recordCombat(targetId, "healing", 0, "revival"),
        recordKillingBlow: (targetId) => recordCombat(targetId, "damage", 0, "killing-blow"),
        replaceDocument: (nextDocument) =>
            updateLocalDocument(() => normalizeTrackerDocument(nextDocument)),
        undo: () =>
            updateLocalDocument((current) => ({
                ...current,
                cursor: Math.max(0, current.cursor - 1),
            })),
        redo: () =>
            updateLocalDocument((current) => ({
                ...current,
                cursor: Math.min(current.events.length, current.cursor + 1),
            })),
        toggleDisplay: () => dispatch({ ...eventBase(), type: "display-toggled" }),
        updateLayoutSettings: (settings) =>
            dispatch({ ...eventBase(), type: "layout-updated", settings }),
    };

    return <context.Provider value={value}>{children}</context.Provider>;

    function changeTurn(direction: -1 | 1) {
        const current = getCurrentState();
        const characters = current.characters.filter((character) => character.properties.name.trim());
        if (!characters.length) return;
        const canTakeTurn = (character: Character) =>
            character.properties.isPlayerCharacter ||
            !(character.properties.maxHealth > 0 && character.properties.health <= 0);
        if (!characters.some(canTakeTurn)) return;

        const index = characters.findIndex((character) => character.id === current.currentCharacterId);
        if (index < 0) {
            const nextCharacter = direction === 1
                ? characters.find(canTakeTurn)
                : [...characters].reverse().find(canTakeTurn);
            if (!nextCharacter) return;
            dispatch({
                ...eventBase(),
                type: "turn-changed",
                characterId: nextCharacter.id,
                characterName: nextCharacter.properties.name,
                round: current.round,
            });
            return;
        }

        let nextIndex = index;
        let round = current.round;
        for (let attempts = 0; attempts < characters.length; attempts += 1) {
            nextIndex += direction;
            if (nextIndex >= characters.length) {
                nextIndex = 0;
                round += 1;
            } else if (nextIndex < 0) {
                if (round === 1) return;
                nextIndex = characters.length - 1;
                round -= 1;
            }
            if (canTakeTurn(characters[nextIndex])) break;
        }
        if (!canTakeTurn(characters[nextIndex])) return;
        dispatch({
            ...eventBase(),
            type: "turn-changed",
            characterId: characters[nextIndex].id,
            characterName: characters[nextIndex].properties.name,
            round,
        });
    }
}
