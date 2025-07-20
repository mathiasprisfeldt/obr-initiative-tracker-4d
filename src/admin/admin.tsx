import { useTrackerStore } from "../store/tracker-store";
import CharacterRow from "./components/CharacterRow";
import styled from "styled-components";

export default function Admin() {
  const {
    state,
    isStartEncounterDisplayed,
    canStartEncounter,
    updateCharacter,
    sortCharacters,
    previousTurn,
    nextTurn,
  } = useTrackerStore();

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

      {(isStartEncounterDisplayed && (
        <button
          disabled={!canStartEncounter}
          onClick={() => {
            nextTurn();
          }}
        >
          Start Encounter
        </button>
      )) || (
        <>
          <button onClick={previousTurn}>Previous Turn</button>
          <button onClick={nextTurn}>Next Turn</button>
        </>
      )}
    </div>
  );
}

const CharacterTable = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;
