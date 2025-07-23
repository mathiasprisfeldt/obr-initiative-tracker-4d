import "./tracker.css";
import { useTrackerState } from "../store/tracker-store";
import CharacterRow from "./components/CharacterRow";

export function Tracker() {
  const state = useTrackerState();

  return <>{state && <CharacterRow characters={state.characters} />}</>;
}
