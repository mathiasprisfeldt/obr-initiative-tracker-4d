import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRoomConnection, type RoomConnectionStatus } from "../hooks/use-room-connection";
import { useApi } from "./settings-store";

const TRACKER_STATE_KEY = "tracker";

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
    hideName: boolean;
}

export interface CombatHistoryEntry {
    participants: string[];
    rounds: number;
    endedAt: string;
}

export interface TrackerState {
    characters: Character[];
    currentCharacter?: Character;
    round: number;
    hasEncounterStarted: boolean;
    isDisplayed: boolean;
    previousEncounters?: CombatHistoryEntry[];
}

export interface TrackerStore {
    state: TrackerState;
    isLoading: boolean;
    canStartEncounter: boolean;
    roomConnectionStatus: RoomConnectionStatus;

    updateCharacter(id: string, properties: CharacterProperties): void;
    sortCharacters(): void;

    previousTurn(): void;
    nextTurn(): void;

    startEncounter(): void;
    endEncounter(): void;
    toggleDisplay(): void;
    clearPreviousEncounters(): void;
}

const context = createContext<TrackerStore>({
    state: {
        characters: [],
        round: 1,
        hasEncounterStarted: false,
        isDisplayed: true,
    },
    isLoading: true,
    canStartEncounter: false,
    roomConnectionStatus: "idle",

    updateCharacter: () => {},
    sortCharacters: () => {},

    previousTurn: () => {},
    nextTurn: () => {},

    startEncounter: () => {},
    endEncounter: () => {},
    toggleDisplay: () => {},
    clearPreviousEncounters: () => {},
});

export interface TrackerResult {
    state: TrackerState | undefined;
    connectionStatus: RoomConnectionStatus;
}

export function useTrackerStore(): TrackerStore {
    return useContext(context);
}

export function useTracker(): TrackerResult {
    const [state, setState] = useState<TrackerState>();

    const room = useRoomConnection<TrackerState>({
        key: TRACKER_STATE_KEY,
        onInitialState: (serverState) => {
            if (serverState) {
                setState(cleanUpStateForClient(serverState));
            }
        },
        onStateChanged: (incomingState) => {
            setState(cleanUpStateForClient(incomingState));
        },
    });

    return { state, connectionStatus: room.status };
}

function cleanUpStateForClient(state: TrackerState) {
    return {
        ...state,
        // remove draft characters and dead characters
        characters: state.characters.filter(
            (c) =>
                c.properties.name.trim() !== "" &&
                !(c.properties.maxHealth > 0 && c.properties.health <= 0),
        ),
    };
}

export function TrackerStoreProvider({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(true);
    const hasReceivedInitialStateRef = useRef(false);
    const stateRef = useRef<TrackerState>(null!);
    const [state, setState] = useState<TrackerState>({
        characters: [
            {
                id: crypto.randomUUID(),
                properties: {
                    name: "",
                    initiative: 0,
                    health: 0,
                    maxHealth: 0,
                    portraitImageId: null,
                    hideName: false,
                },
            },
        ],
        round: 1,
        hasEncounterStarted: false,
        isDisplayed: true,
    });

    const canStartEncounter = useMemo(() => {
        return state.characters.length > 1;
    }, [state.characters.length]);

    stateRef.current = state;

    const room = useRoomConnection<TrackerState>({
        key: TRACKER_STATE_KEY,
        onInitialState: (serverState) => {
            if (hasReceivedInitialStateRef.current) {
                // Reconnect — local state takes priority over stale server state
                room.updateState(stateRef.current);
            } else {
                hasReceivedInitialStateRef.current = true;
                if (serverState) {
                    setState(serverState);
                } else {
                    room.updateState(stateRef.current);
                }
            }
            setIsLoading(false);
        },
        onStateChanged: (incomingState) => {
            setState(incomingState);
        },
    });

    // Keepalive: ping the backend health endpoint every 10 minutes
    // to prevent the service from shutting down due to inactivity.
    const api = useApi();
    useEffect(() => {
        if (!api) return;
        const intervalMs = 10 * 60 * 1000;
        const id = setInterval(() => api.isHealthy(), intervalMs);
        return () => clearInterval(id);
    }, [api]);

    useEffect(() => {
        room.updateState(state);
    }, [state]);

    return (
        <context.Provider
            value={{
                state,
                isLoading: isLoading,
                canStartEncounter: canStartEncounter,
                roomConnectionStatus: room.status,

                updateCharacter: (id: string, properties: CharacterProperties) => {
                    setState((prevState) => {
                        if (properties.health > properties.maxHealth) {
                            properties.maxHealth = properties.health;
                        }

                        const updatedCharacters = prevState.characters.map((c) =>
                            c.id === id ? { id, properties } : c,
                        );

                        // Add new placeholder character if this one is new
                        if (!prevState.characters.find((c) => c.id === id)?.properties.name) {
                            updatedCharacters.push({
                                id: crypto.randomUUID(),
                                properties: {
                                    name: "",
                                    initiative: 0,
                                    health: 0,
                                    maxHealth: 0,
                                    portraitImageId: null,
                                    hideName: false,
                                },
                            });
                        }

                        // Remove character if name is cleared
                        if (properties.name.trim() === "") {
                            // Advance turn if the current character is being removed
                            if (prevState.currentCharacter?.id === id) {
                                return {
                                    ...nextTurn(prevState),
                                    characters: updatedCharacters.filter((c) => c.id !== id),
                                };
                            }

                            return {
                                ...prevState,
                                characters: updatedCharacters.filter((c) => c.id !== id),
                            };
                        }

                        return {
                            ...prevState,
                            characters: updatedCharacters,
                        };
                    });
                },

                sortCharacters: () => {
                    setState((prevState) => ({
                        ...prevState,
                        characters: prevState.characters.sort((a, b) => {
                            // Ensure draft characters are sorted last
                            if (!b.properties.name) return -1;
                            if (!a.properties.name) return 1;

                            return (b.properties.initiative || 0) - (a.properties.initiative || 0);
                        }),
                    }));
                },

                previousTurn: () => {
                    setState((prevState) => {
                        const currentCharacterIndex = prevState.characters.findIndex(
                            (c) => c.id === prevState.currentCharacter?.id,
                        );
                        let previousTurnIndex = currentCharacterIndex - 1;

                        // Go back to previous round if at the start of the current round
                        if (previousTurnIndex < 0) {
                            if (prevState.round === 1) {
                                return prevState; // No previous turn if already at round 1
                            }

                            previousTurnIndex = prevState.characters.length - 2;
                        }

                        return {
                            ...prevState,
                            currentCharacter: prevState.characters[previousTurnIndex],
                            round:
                                previousTurnIndex === prevState.characters.length - 2
                                    ? prevState.round - 1
                                    : prevState.round,
                        };
                    });
                },

                nextTurn: () => {
                    setState((prevState) => nextTurn(prevState));
                },

                startEncounter: () => {
                    setState((prevState) => ({
                        ...prevState,
                        hasEncounterStarted: true,
                        currentCharacter: prevState.characters[0],
                        round: 1,
                    }));
                },

                endEncounter: () => {
                    setState((prevState) => {
                        const entry: CombatHistoryEntry = {
                            participants: prevState.characters
                                .filter((c) => c.properties.name.trim() !== "")
                                .map((c) => c.properties.name),
                            rounds: prevState.round,
                            endedAt: new Date().toISOString(),
                        };
                        const history = [entry, ...(prevState.previousEncounters ?? [])].slice(
                            0,
                            3,
                        );
                        return {
                            ...prevState,
                            hasEncounterStarted: false,
                            currentCharacter: undefined,
                            round: 1,
                            previousEncounters: history,
                        };
                    });
                },

                toggleDisplay: () => {
                    setState((prevState) => ({
                        ...prevState,
                        isDisplayed: !prevState.isDisplayed,
                    }));
                },

                clearPreviousEncounters: () => {
                    setState((prevState) => ({
                        ...prevState,
                        previousEncounters: [],
                    }));
                },
            }}
        >
            {children}
        </context.Provider>
    );

    function nextTurn(state: TrackerState): TrackerState {
        if (state.currentCharacter === undefined) {
            return {
                ...state,
                currentCharacter: state.characters[0],
            };
        }

        const nextTurnIndex =
            (state.characters.findIndex((c) => c.id === state.currentCharacter?.id) + 1) %
            (state.characters.length - 1);

        return {
            ...state,
            currentCharacter: state.characters[nextTurnIndex],
            round: nextTurnIndex === 0 ? state.round + 1 : state.round,
        };
    }
}
