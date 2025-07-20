import OBR from "@owlbear-rodeo/sdk";
import { useEffect } from "react";
import { useTrackerStore } from "../store/tracker-store";

export default function Admin() {
  const { state, addCharacter, nextTurn } = useTrackerStore();

  useEffect(() => {
    if (!OBR.isReady) return;

    OBR.broadcast.sendMessage("state", {
      state,
    });
  }, [state]);

  return (
    <div>
      <h1>Admin Panel</h1>
      <ul>
        {state.characters.map((character, index) => (
          <li key={index}>
            {character.name} - {character.initiative}
          </li>
        ))}
      </ul>
      <button
        onClick={() =>
          addCharacter({
            name: `Character ${state.characters.length + 1}`,
            initiative: Math.floor(Math.random() * 20) + 1,
          })
        }
      >
        Add Character
      </button>
      <button onClick={nextTurn}>Next Turn</button>
    </div>
  );
}
