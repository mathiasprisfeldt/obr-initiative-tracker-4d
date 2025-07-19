import OBR from "@owlbear-rodeo/sdk";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Tracker } from "./tracker";

OBR.onReady(async () => {
  OBR.broadcast.onMessage("state", ({ data }) => {
    console.log(data);
  });
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Tracker />
  </StrictMode>
);
