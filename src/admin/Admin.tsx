import { TrackerStore, useTrackerStore } from "../store/tracker-store";
import CharacterRow from "./components/CharacterRow";
import styled from "styled-components";

export default function Admin() {
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
  },
}: {
  trackerStore: TrackerStore;
}) {
  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Admin Panel</h1>
      <h2>Round: {state.round}</h2>

      <CharacterTable>
        {state.characters.map((character) => (
          <CharacterRow
            key={character.id}
            hasTurn={character.id === state.currentCharacter?.id}
            character={character}
            onNameChange={(name) => {
              updateCharacter(character.id, { ...character.properties, name });
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
          />
        ))}
      </CharacterTable>

      <button disabled={!state.hasEncounterStarted} onClick={previousTurn}>
        Previous Turn
      </button>
      <button disabled={!state.hasEncounterStarted} onClick={nextTurn}>
        Next Turn
      </button>

      <br />
      <br />

      {!state.hasEncounterStarted && (
        <button disabled={!canStartEncounter} onClick={startEncounter}>
          Start Encounter
        </button>
      )}

      {state.hasEncounterStarted && (
        <button onClick={endEncounter}>End Encounter</button>
      )}
    </div>
  );
}

function Preview() {
  const trackerStore: TrackerStore = {
    state: {
      characters: [
        {
          id: "1",
          properties: {
            name: "Character 1",
            initiative: 10,
            health: 100,
            maxHealth: 100,
          },
        },
        {
          id: "2",
          properties: {
            name: "Character 2",
            initiative: 15,
            health: 80,
            maxHealth: 80,
          },
        },
      ],
      currentCharacter: undefined,
      round: 1,
      hasEncounterStarted: false,
    },
    isLoading: false,
    canStartEncounter: true,
    updateCharacter: () => {},
    sortCharacters: () => {},
    previousTurn: () => {},
    nextTurn: () => {},
    startEncounter: () => {},
    endEncounter: () => {},
  };

  return <Content trackerStore={trackerStore} />;
}

const CharacterTable = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;
