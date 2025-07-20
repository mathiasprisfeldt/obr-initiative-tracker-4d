import { createContext, useContext, useState } from "react";

export interface Character {
  name: string;
  initiative: number;
}

export interface TrackerState {
  characters: Character[];
  currentTurnIndex: number;
  round: number;
}

export interface TrackerStore {
  state: TrackerState;
  addCharacter(character: Character): void;
  previousTurn(): void;
  nextTurn(): void;
}

const context = createContext<TrackerStore>({
  state: {
    characters: [],
    currentTurnIndex: 0,
    round: 1,
  },

  addCharacter: () => {},
  previousTurn: () => {},
  nextTurn: () => {},
});

export function useTrackerStore(): TrackerStore {
  return useContext(context);
}

export function TrackerStoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<TrackerState>({
    characters: [],
    currentTurnIndex: 0,
    round: 1,
  });

  return (
    <context.Provider
      value={{
        state,

        addCharacter: (character: Character) => {
          setState((prevState) => ({
            ...prevState,
            characters: [...prevState.characters, character],
          }));
        },

        previousTurn: () => {
          setState((prevState) => {
            const previousTurnIndex =
              (prevState.currentTurnIndex - 1) % prevState.characters.length;

            return {
              ...prevState,
              currentTurnIndex: previousTurnIndex,
              round:
                previousTurnIndex === prevState.characters.length - 1
                  ? prevState.round - 1
                  : prevState.round,
            };
          });
        },

        nextTurn: () => {
          setState((prevState) => {
            const nextTurnIndex =
              (prevState.currentTurnIndex + 1) % prevState.characters.length;

            return {
              ...prevState,
              currentTurnIndex: nextTurnIndex,
              round:
                nextTurnIndex === 0 ? prevState.round + 1 : prevState.round,
            };
          });
        },
      }}
    >
      {children}
    </context.Provider>
  );
}
