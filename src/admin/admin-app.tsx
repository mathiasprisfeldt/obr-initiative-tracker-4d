import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Admin } from "./admin";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Admin />
  </StrictMode>
);
