import OBR from "@owlbear-rodeo/sdk";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { PortraitImage } from "../portrait-image-picker";

const metadataKey = "obr-initiative-tracker-4d-state-metadata";

export interface Character {
  id: string;
  properties: CharacterProperties;
}

export interface CharacterProperties {
  name: string;
  initiative?: number;
  health: number;
  maxHealth: number;
  portraitImage: PortraitImage | null;
}

export interface TrackerState {
  characters: Character[];
  currentCharacter?: Character;
  round: number;
  hasEncounterStarted: boolean;
}

export interface TrackerStore {
  state: TrackerState;
  isLoading: boolean;
  canStartEncounter: boolean;

  updateCharacter(id: string, properties: CharacterProperties): void;
  sortCharacters(): void;

  previousTurn(): void;
  nextTurn(): void;

  startEncounter(): void;
  endEncounter(): void;
}

const context = createContext<TrackerStore>({
  state: {
    characters: [],
    round: 1,
    hasEncounterStarted: false,
  },
  isLoading: true,
  canStartEncounter: false,

  updateCharacter: () => {},
  sortCharacters: () => {},

  previousTurn: () => {},
  nextTurn: () => {},

  startEncounter: () => {},
  endEncounter: () => {},
});

export function useTrackerStore(): TrackerStore {
  return useContext(context);
}

export function useTrackerState(): TrackerState | undefined {
  const [state, setState] = useState<TrackerState>();

  useEffect(() => {
    OBR.scene.onMetadataChange((metadata) => {
      let trackerState = metadata[metadataKey] as TrackerState;

      // clean up state before giving it to consumers, for instance removing draft characters
      trackerState = {
        ...trackerState,
        characters: trackerState.characters.filter(
          (c) => c.properties.name.trim() !== ""
        ),
      };

      setState(trackerState);
    });
  }, []);

  return state;
}

export function TrackerStoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);

  const [state, setState] = useState<TrackerState>({
    characters: [
      {
        id: crypto.randomUUID(),
        properties: { name: "", health: 0, maxHealth: 0, portraitImage: null },
      },
    ],
    round: 1,
    hasEncounterStarted: false,
  });

  const canStartEncounter = useMemo(() => {
    return state.characters.length > 1;
  }, [state.characters.length]);

  useEffect(() => {
    if (isLoading || !OBR.isAvailable) return;

    OBR.scene.setMetadata({
      [metadataKey]: state,
    });
  }, [state]);

  useEffect(() => {
    if (!OBR.isAvailable) {
      setIsLoading(false);
      return;
    }

    OBR.scene.onReadyChange(async () => {
      const metadata = await OBR.scene.getMetadata();
      const trackerState = metadata[metadataKey] as TrackerState;

      if (trackerState) {
        setState(trackerState);
      }

      setIsLoading(false);
    });
  }, []);

  return (
    <context.Provider
      value={{
        state,
        isLoading: isLoading,
        canStartEncounter: canStartEncounter,

        updateCharacter: (id: string, properties: CharacterProperties) => {
          setState((prevState) => {
            const updatedCharacters = prevState.characters.map((c) =>
              c.id === id ? { id, properties } : c
            );

            // Add new placeholder character if this one is new
            if (
              !prevState.characters.find((c) => c.id === id)?.properties.name
            ) {
              updatedCharacters.push({
                id: crypto.randomUUID(),
                properties: {
                  name: "",
                  health: 0,
                  maxHealth: 0,
                  portraitImage: null,
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
              if (!b.properties.name) return -1; // Ensure draft characters are sorted last

              return (
                (a.properties.initiative || 0) - (b.properties.initiative || 0)
              );
            }),
          }));
        },

        previousTurn: () => {
          setState((prevState) => {
            const currentCharacterIndex = prevState.characters.findIndex(
              (c) => c.id === prevState.currentCharacter?.id
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
      (state.characters.findIndex((c) => c.id === state.currentCharacter?.id) +
        1) %
      (state.characters.length - 1);

    return {
      ...state,
      currentCharacter: state.characters[nextTurnIndex],
      round: nextTurnIndex === 0 ? state.round + 1 : state.round,
    };
  }
}
