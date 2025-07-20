import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Tracker } from "./Tracker";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Tracker />
  </StrictMode>
);
