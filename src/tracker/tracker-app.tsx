import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Tracker } from "./tracker";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Tracker />
  </StrictMode>
);
