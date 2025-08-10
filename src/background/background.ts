import OBR from "@owlbear-rodeo/sdk";

OBR.onReady(async () => {
  if ((await OBR.player.getRole()) === "GM") return;
});
