import {
    DEFAULT_LAYOUT_SETTINGS,
    type LayoutSettings,
} from "../tracker/layout-settings";

export const TRACKER_SCHEMA_VERSION = 2;

export interface Character {
    id: string;
    properties: CharacterProperties;
}

export interface CharacterProperties {
    name: string;
    initiative: number;
    health: number;
    maxHealth: number;
    portraitImageId: string | null;
    isPlayerCharacter: boolean;
}

export interface CombatantSnapshot {
    id: string;
    name: string;
    initiative: number;
    isPlayerCharacter: boolean;
    creatureType: string;
}

export interface CombatEvent {
    id: string;
    type: "damage" | "healing";
    timestamp: string;
    sessionId: string;
    encounterId: string;
    round: number;
    source?: CombatantSnapshot;
    target: CombatantSnapshot;
    amount: number;
    killingBlow?: boolean;
    revival?: boolean;
}


export interface Encounter {
    id: string;
    name: string;
    startedAt: string;
    endedAt?: string;
    rounds: number;
    participants: CombatantSnapshot[];
    combatEvents: CombatEvent[];
}

export interface GameSession {
    id: string;
    date: string;
    name: string;
    endedAt?: string;
    encounters: Encounter[];
}

export interface ActiveEncounter {
    id: string;
    sessionId: string;
    name: string;
    startedAt: string;
    combatEvents: CombatEvent[];
}

export interface TrackerState {
    characters: Character[];
    currentCharacterId?: string;
    round: number;
    hasEncounterStarted: boolean;
    activeEncounter?: ActiveEncounter;
    draftEncounterName?: string;
    sessions: GameSession[];
    isDisplayed: boolean;
    layoutSettings: LayoutSettings;
}

interface EventBase {
    id: string;
    timestamp: string;
    sessionId?: string;
}

export type TrackerEvent =
    | (EventBase & {
          type: "character-updated";
          character: Character;
          additionalCharacters?: Character[];
          previousCharacter?: Character;
          newDraftCharacterId?: string;
      })
    | (EventBase & {
          type: "character-deleted";
          characterId: string;
          characterName?: string;
      })
    | (EventBase & { type: "characters-sorted"; characterIds: string[] })
    | (EventBase & {
          type: "turn-changed";
          characterId?: string;
          characterName?: string;
          round: number;
      })
    | (EventBase & { type: "encounter-started"; encounter: ActiveEncounter; session: GameSession })
    | (EventBase & { type: "encounter-renamed"; name: string })
    | (EventBase & { type: "encounter-name-drafted"; name: string })
    | (EventBase & {
          type: "encounter-ended";
          sessionId: string;
          encounter: Encounter;
          remainingCharacters: Character[];
      })
    | (EventBase & {
          type: "encounter-deleted";
          sessionId: string;
          encounterId: string;
          encounterName: string;
      })
    | (EventBase & {
          type: "completed-encounter-renamed";
          sessionId: string;
          encounterId: string;
          previousName: string;
          name: string;
      })
    | (EventBase & { type: "combat-recorded"; event: CombatEvent; targetHealth?: number })
    | (EventBase & { type: "session-renamed"; sessionId: string; name: string })
    | (EventBase & { type: "session-ended"; sessionId: string; endedAt: string })
    | (EventBase & {
          type: "session-deleted";
          sessionId: string;
          sessionName: string;
      })
    | (EventBase & { type: "display-toggled" })
    | (EventBase & { type: "layout-updated"; settings: LayoutSettings });

export interface TrackerDocument {
    schemaVersion: number;
    baseState: TrackerState;
    events: TrackerEvent[];
    cursor: number;
}

export interface LegacyTrackerState {
    characters?: Array<{
        id: string;
        properties: Partial<CharacterProperties> & { hideName?: boolean };
    }>;
    currentCharacter?: { id: string };
    round?: number;
    hasEncounterStarted?: boolean;
    isDisplayed?: boolean;
    layoutSettings?: LayoutSettings;
    previousEncounters?: Array<{
        participants: string[];
        rounds: number;
        endedAt: string;
    }>;
}

export function createCharacter(id: string = crypto.randomUUID()): Character {
    return {
        id,
        properties: {
            name: "",
            initiative: 0,
            health: 0,
            maxHealth: 0,
            portraitImageId: null,
            isPlayerCharacter: false,
        },
    };
}

export function createInitialTrackerDocument(): TrackerDocument {
    return {
        schemaVersion: TRACKER_SCHEMA_VERSION,
        baseState: {
            characters: [createCharacter()],
            round: 1,
            hasEncounterStarted: false,
            sessions: [],
            isDisplayed: true,
            layoutSettings: { ...DEFAULT_LAYOUT_SETTINGS },
        },
        events: [],
        cursor: 0,
    };
}

export function normalizeTrackerDocument(value: TrackerDocument | LegacyTrackerState): TrackerDocument {
    if ("schemaVersion" in value && "baseState" in value && Array.isArray(value.events)) {
        return {
            ...value,
            schemaVersion: TRACKER_SCHEMA_VERSION,
            baseState: normalizeTrackerState(value.baseState),
            cursor: Math.min(Math.max(value.cursor, 0), value.events.length),
        };
    }

    const legacy = value as LegacyTrackerState;
    const sessions: GameSession[] = (legacy.previousEncounters ?? []).map((entry, index) => ({
        id: crypto.randomUUID(),
        date: toLocalDate(entry.endedAt),
        name: `Imported session ${index + 1}`,
        encounters: [
            {
                id: crypto.randomUUID(),
                name: `Imported encounter ${index + 1}`,
                startedAt: entry.endedAt,
                endedAt: entry.endedAt,
                rounds: entry.rounds,
                participants: entry.participants.map((name) => ({
                    id: crypto.randomUUID(),
                    name,
                    initiative: 0,
                    isPlayerCharacter: false,
                    creatureType: normalizeCreatureType(name),
                })),
                combatEvents: [],
            },
        ],
    }));

    const characters = (legacy.characters ?? []).map((character) => ({
            id: character.id,
            properties: {
                name: character.properties.name ?? "",
                initiative: character.properties.initiative ?? 0,
                health: character.properties.health ?? 0,
                maxHealth: character.properties.maxHealth ?? 0,
                portraitImageId: character.properties.portraitImageId ?? null,
                // The old hidden-name flag most closely represented NPCs.
                isPlayerCharacter:
                    character.properties.isPlayerCharacter ??
                    character.properties.hideName === false,
            },
        }));
    let activeEncounter: ActiveEncounter | undefined;
    if (legacy.hasEncounterStarted) {
        const date = toLocalDate(new Date());
        let session = sessions.find((entry) => entry.date === date);
        if (!session) {
            session = {
                id: crypto.randomUUID(),
                date,
                name: `Session ${sessions.length + 1}`,
                encounters: [],
            };
            sessions.push(session);
        }
        activeEncounter = {
            id: crypto.randomUUID(),
            sessionId: session.id,
            name: `Encounter ${session.encounters.length + 1}`,
            startedAt: new Date().toISOString(),
            combatEvents: [],
        };
    }

    const baseState: TrackerState = normalizeTrackerState({
        characters,
        currentCharacterId: legacy.currentCharacter?.id,
        round: legacy.round ?? 1,
        hasEncounterStarted: legacy.hasEncounterStarted ?? false,
        activeEncounter,
        sessions,
        isDisplayed: legacy.isDisplayed ?? true,
        layoutSettings: legacy.layoutSettings ?? { ...DEFAULT_LAYOUT_SETTINGS },
    });

    return {
        schemaVersion: TRACKER_SCHEMA_VERSION,
        baseState,
        events: [],
        cursor: 0,
    };
}

export function deriveTrackerState(document: TrackerDocument): TrackerState {
    return document.events
        .slice(0, document.cursor)
        .reduce(reduceTrackerEvent, normalizeTrackerState(document.baseState));
}

export function appendTrackerEvent(document: TrackerDocument, event: TrackerEvent): TrackerDocument {
    const events = [...document.events.slice(0, document.cursor), event];
    return { ...document, events, cursor: events.length };
}

export function reduceTrackerEvent(state: TrackerState, event: TrackerEvent): TrackerState {
    switch (event.type) {
        case "character-updated": {
            const updates = new Map(
                [event.character, ...(event.additionalCharacters ?? [])].map((character) => [
                    character.id,
                    character,
                ]),
            );
            const existingIds = new Set(state.characters.map((character) => character.id));
            const characters = [
                ...state.characters.map(
                    (character) => updates.get(character.id) ?? character,
                ),
                ...[...updates.values()].filter(
                    (character) => !existingIds.has(character.id),
                ),
            ];
            return {
                ...state,
                characters: ensureDraftCharacter(characters, event.newDraftCharacterId),
            };
        }
        case "character-deleted":
            return {
                ...state,
                characters: ensureDraftCharacter(
                    state.characters.filter((character) => character.id !== event.characterId),
                ),
                currentCharacterId:
                    state.currentCharacterId === event.characterId
                        ? undefined
                        : state.currentCharacterId,
            };
        case "characters-sorted": {
            const positions = new Map(event.characterIds.map((id, index) => [id, index]));
            return {
                ...state,
                characters: [...state.characters].sort(
                    (a, b) =>
                        (positions.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
                        (positions.get(b.id) ?? Number.MAX_SAFE_INTEGER),
                ),
            };
        }
        case "turn-changed":
            return { ...state, currentCharacterId: event.characterId, round: event.round };
        case "encounter-started": {
            const sessions = state.sessions.some((session) => session.id === event.session.id)
                ? state.sessions
                : [...state.sessions, event.session];
            return {
                ...state,
                sessions,
                activeEncounter: event.encounter,
                draftEncounterName: undefined,
                hasEncounterStarted: true,
                currentCharacterId: state.characters.find((c) => c.properties.name.trim())?.id,
                round: 1,
            };
        }
        case "encounter-renamed":
            return state.activeEncounter
                ? { ...state, activeEncounter: { ...state.activeEncounter, name: event.name } }
                : state;
        case "encounter-name-drafted":
            return { ...state, draftEncounterName: event.name };
        case "combat-recorded":
            return {
                ...state,
                characters:
                    event.targetHealth === undefined
                        ? state.characters
                        : state.characters.map((character) =>
                              character.id === event.event.target.id
                                  ? {
                                        ...character,
                                        properties: {
                                            ...character.properties,
                                            health: event.targetHealth!,
                                        },
                                    }
                                  : character,
                          ),
                activeEncounter: state.activeEncounter
                    ? {
                          ...state.activeEncounter,
                          combatEvents: [...state.activeEncounter.combatEvents, event.event],
                      }
                          : state.activeEncounter,
            };
        case "encounter-ended":
            return {
                ...state,
                sessions: state.sessions.map((session) =>
                    session.id === event.sessionId
                        ? { ...session, encounters: [...session.encounters, event.encounter] }
                        : session,
                ),
                characters: ensureDraftCharacter(event.remainingCharacters),
                activeEncounter: undefined,
                hasEncounterStarted: false,
                currentCharacterId: undefined,
                round: 1,
            };
        case "encounter-deleted":
            return {
                ...state,
                sessions: state.sessions.map((session) =>
                    session.id === event.sessionId
                        ? {
                              ...session,
                              encounters: session.encounters.filter(
                                  (encounter) => encounter.id !== event.encounterId,
                              ),
                          }
                        : session,
                ),
            };
        case "completed-encounter-renamed":
            return {
                ...state,
                sessions: state.sessions.map((session) =>
                    session.id === event.sessionId
                        ? {
                              ...session,
                              encounters: session.encounters.map((encounter) =>
                                  encounter.id === event.encounterId
                                      ? { ...encounter, name: event.name }
                                      : encounter,
                              ),
                          }
                        : session,
                ),
            };
        case "session-renamed":
            return {
                ...state,
                sessions: state.sessions.map((session) =>
                    session.id === event.sessionId ? { ...session, name: event.name } : session,
                ),
            };
        case "session-ended":
            return {
                ...state,
                sessions: state.sessions.map((session) =>
                    session.id === event.sessionId
                        ? { ...session, endedAt: event.endedAt }
                        : session,
                ),
            };
        case "session-deleted":
            return {
                ...state,
                sessions: state.sessions.filter((session) => session.id !== event.sessionId),
            };
        case "display-toggled":
            return { ...state, isDisplayed: !state.isDisplayed };
        case "layout-updated":
            return { ...state, layoutSettings: event.settings };
    }
}

export function normalizeCreatureType(value: string | null | undefined): string {
    const normalized = (value ?? "")
        .replace(/\.[a-z0-9]+$/i, "")
        .replace(/(?:[\s_-]+(?:#\s*)?\d+)$/i, "")
        .replace(/[\s_-]+/g, " ")
        .trim();
    return normalized || "Unknown creature";
}

export function numberDuplicateCharacters(
    characters: Character[],
    character: Character,
): { character: Character; additionalCharacters: Character[] } {
    const name = character.properties.name.trim();
    if (!name || /\d+\s*$/.test(name)) {
        return { character, additionalCharacters: [] };
    }

    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matchingName = new RegExp(`^${escapedName}(?:[\\s_-]+(\\d+))?$`, "i");
    const matches = characters.filter(
        (candidate) =>
            candidate.id !== character.id &&
            candidate.properties.name.trim() &&
            matchingName.test(candidate.properties.name.trim()),
    );
    if (matches.length === 0) return { character, additionalCharacters: [] };

    const usedNumbers = new Set(
        matches
            .map((candidate) => matchingName.exec(candidate.properties.name.trim())?.[1])
            .filter((value): value is string => value !== undefined)
            .map(Number),
    );
    let nextAvailable = 1;
    const additionalCharacters = matches.map((candidate) => {
        const match = matchingName.exec(candidate.properties.name.trim());
        if (match?.[1]) return candidate;
        while (usedNumbers.has(nextAvailable)) nextAvailable += 1;
        const numbered = {
            ...candidate,
            properties: {
                ...candidate.properties,
                name: `${name} ${nextAvailable}`,
            },
        };
        usedNumbers.add(nextAvailable);
        nextAvailable += 1;
        return numbered;
    });

    const highestNumber = Math.max(0, ...usedNumbers);
    return {
        character: {
            ...character,
            properties: {
                ...character.properties,
                name: `${name} ${highestNumber + 1}`,
            },
        },
        additionalCharacters,
    };
}

export function snapshotCombatant(character: Character): CombatantSnapshot {
    return {
        id: character.id,
        name: character.properties.name,
        initiative: character.properties.initiative,
        isPlayerCharacter: character.properties.isPlayerCharacter,
        creatureType: character.properties.isPlayerCharacter
            ? character.properties.name
            : normalizeCreatureType(
                  character.properties.portraitImageId ?? character.properties.name,
              ),
    };
}

export function toLocalDate(value: string | Date): string {
    const date = typeof value === "string" ? new Date(value) : value;
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export function describeTrackerEvent(event: TrackerEvent): string | null {
    switch (event.type) {
        case "character-updated":
            return describeCharacterUpdate(event.character, event.previousCharacter);
        case "character-deleted":
            return `Deleted ${event.characterName || "character"}`;
        case "characters-sorted":
            return "Sorted characters by initiative";
        case "combat-recorded": {
            const source = event.event.source?.name ?? "Unknown";
            return event.event.type === "damage"
                ? `${source} dealt ${event.event.amount} damage to ${event.event.target.name}`
                : event.event.source?.id === event.event.target.id
                  ? `${source} self-healed for ${event.event.amount}`
                  : `${source} healed ${event.event.target.name} for ${event.event.amount}`;
        }
        case "encounter-started":
            return `Started ${event.encounter.name}`;
        case "encounter-renamed":
            return `Renamed encounter to ${event.name}`;
        case "encounter-name-drafted":
            return event.name
                ? `Named the next encounter ${event.name}`
                : "Cleared the next encounter name";
        case "encounter-ended":
            return `Ended ${event.encounter.name}`;
        case "encounter-deleted":
            return `Deleted ${event.encounterName}`;
        case "completed-encounter-renamed":
            return `Renamed ${event.previousName} to ${event.name}`;
        case "turn-changed":
            return event.characterName
                ? `Changed turn to ${event.characterName} in round ${event.round}`
                : `Changed turn in round ${event.round}`;
        case "session-renamed":
            return `Renamed session to ${event.name}`;
        case "session-ended":
            return "Ended session";
        case "session-deleted":
            return `Deleted ${event.sessionName}`;
        case "display-toggled":
            return "Toggled the player tracker display";
        case "layout-updated":
            return "Updated the tracker layout";
    }
}

function describeCharacterUpdate(
    character: Character,
    previousCharacter?: Character,
): string {
    const name = character.properties.name || "draft character";
    if (!previousCharacter) return `Updated ${name}`;

    const previous = previousCharacter.properties;
    const next = character.properties;
    if (!previous.name && next.name) return `Added ${next.name}`;
    if (previous.name !== next.name) return `Renamed ${previous.name} to ${next.name}`;
    if (previous.isPlayerCharacter !== next.isPlayerCharacter) {
        return `Marked ${name} as ${
            next.isPlayerCharacter ? "a player character" : "a non-player character"
        }`;
    }
    if (previous.initiative !== next.initiative) {
        return `Set ${name}'s initiative to ${next.initiative}`;
    }
    if (previous.health !== next.health) return `Set ${name}'s HP to ${next.health}`;
    if (previous.maxHealth !== next.maxHealth) {
        return `Set ${name}'s max HP to ${next.maxHealth}`;
    }
    if (previous.portraitImageId !== next.portraitImageId) {
        return next.portraitImageId
            ? `Changed ${name}'s portrait to ${next.portraitImageId}`
            : `Removed ${name}'s portrait`;
    }
    return `Updated ${name}`;
}

function ensureDraftCharacter(characters: Character[], newDraftCharacterId?: string): Character[] {
    const recoveredCharacters = newDraftCharacterId
        ? characters
        : characters.map((character) =>
              character.id === "draft-character" && character.properties.name.trim()
                  ? { ...character, id: "recovered-draft-character" }
                  : character,
          );
    const uniqueCharacters = [
        ...new Map(recoveredCharacters.map((character) => [character.id, character])).values(),
    ];
    const nonDraft = uniqueCharacters.filter((character) => character.properties.name.trim());
    const draft = uniqueCharacters.find((character) => !character.properties.name.trim());
    return [
        ...nonDraft,
        createCharacter(draft?.id ?? newDraftCharacterId ?? "draft-character"),
    ];
}

function normalizeTrackerState(state: TrackerState): TrackerState {
    return {
        ...state,
        characters: ensureDraftCharacter(state.characters ?? []),
        sessions: state.sessions ?? [],
        round: state.round ?? 1,
        hasEncounterStarted: state.hasEncounterStarted ?? false,
        isDisplayed: state.isDisplayed ?? true,
        layoutSettings: state.layoutSettings ?? { ...DEFAULT_LAYOUT_SETTINGS },
    };
}
