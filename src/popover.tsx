import OBR from "@owlbear-rodeo/sdk";
import "./popover-style.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

OBR.onReady(async () => {
  const isPlayer = (await OBR.player.getRole()) === "PLAYER";

  if (!isPlayer) {
    return;
  }

  OBR.broadcast.onMessage("state", ({ data }) => {
    console.log(data);
  });
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div>
      <h1>Popover</h1>
    </div>
  </StrictMode>
);
