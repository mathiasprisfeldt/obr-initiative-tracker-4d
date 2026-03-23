import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRoomConnection, type RoomConnectionStatus } from "../hooks/use-room-connection";

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

export interface TrackerState {
    characters: Character[];
    currentCharacter?: Character;
    round: number;
    hasEncounterStarted: boolean;
    isDisplayed: boolean;
    visibleCount: number;
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
    setVisibleCount(count: number): void;
}

const context = createContext<TrackerStore>({
    state: {
        characters: [],
        round: 1,
        hasEncounterStarted: false,
        isDisplayed: true,
        visibleCount: 5,
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
    setVisibleCount: () => {},
});

export function useTrackerStore(): TrackerStore {
    return useContext(context);
}

export function useTrackerState(): TrackerState | undefined {
    const [state, setState] = useState<TrackerState>();

    useRoomConnection({
        onStateChanged: (key, incomingState) => {
            if (key === TRACKER_STATE_KEY) {
                setState(cleanUpStateForClient(incomingState as TrackerState));
            }
        },
    });

    return state;
}

function cleanUpStateForClient(state: TrackerState) {
    return {
        ...state,
        // remove draft characters
        characters: state.characters.filter((c) => c.properties.name.trim() !== ""),
    };
}

export function TrackerStoreProvider({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(true);
    const hasConnectedRef = useRef(false);
    const skipNextStateChangedRef = useRef(false);
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
        visibleCount: 5,
    });

    const canStartEncounter = useMemo(() => {
        return state.characters.length > 1;
    }, [state.characters.length]);

    stateRef.current = state;

    const room = useRoomConnection({
        onStateChanged: (key, incomingState) => {
            if (key === TRACKER_STATE_KEY) {
                if (skipNextStateChangedRef.current) {
                    skipNextStateChangedRef.current = false;
                    return;
                }
                setState(incomingState as TrackerState);
                setIsLoading(false);
            }
        },
        onConnected: () => {
            if (hasConnectedRef.current) {
                room.updateState(TRACKER_STATE_KEY, stateRef.current);
            }
            hasConnectedRef.current = true;
        },
        onDisconnected: () => {
            skipNextStateChangedRef.current = true;
        },
    });

    useEffect(() => {
        room.updateState(TRACKER_STATE_KEY, state);
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
                    setState((prevState) => ({
                        ...prevState,
                        hasEncounterStarted: false,
                        currentCharacter: undefined,
                        round: 1,
                    }));
                },

                toggleDisplay: () => {
                    setState((prevState) => ({
                        ...prevState,
                        isDisplayed: !prevState.isDisplayed,
                    }));
                },

                setVisibleCount: (count: number) => {
                    setState((prevState) => ({
                        ...prevState,
                        visibleCount: Math.max(1, Math.min(15, count)),
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
