import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Admin } from "./admin";
import OBR from "@owlbear-rodeo/sdk";

if ((await OBR.player.getRole()) === "GM") {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <Admin />
    </StrictMode>
  );
}
