import OBR from "@owlbear-rodeo/sdk";
import { OpenTracker } from "../tracker/Tracker";

OBR.onReady(async () => {
  if ((await OBR.player.getRole()) === "GM") return;
  OpenTracker();
});
