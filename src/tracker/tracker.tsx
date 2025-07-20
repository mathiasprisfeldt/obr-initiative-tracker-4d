import "./tracker.css";
import { useTrackerState } from "../store/tracker-store";

export function Tracker() {
  const state = useTrackerState();

  return (
    <div>
      <h1>Tracker</h1>
      {JSON.stringify(state, null, 2)}
    </div>
  );
}
