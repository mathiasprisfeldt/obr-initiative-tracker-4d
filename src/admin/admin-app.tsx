import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { TrackerStoreProvider } from "../store/tracker-store";
import Admin from "./Admin";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TrackerStoreProvider>
      <Admin />
    </TrackerStoreProvider>
  </StrictMode>
);
