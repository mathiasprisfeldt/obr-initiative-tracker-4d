import OBR from "@owlbear-rodeo/sdk";
import { initializeGmRoot } from "./gm";
import { initializePlayerRoot } from "./player";

if (OBR.isAvailable) {
    OBR.onReady(async () => {
        if ((await OBR.player.getRole()) === "PLAYER") {
            initializePlayerRoot();
        } else {
            initializeGmRoot();
        }
    });
} else {
    // Fallback for development or testing without OBR
    initializeGmRoot();
}
