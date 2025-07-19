import OBR from "@owlbear-rodeo/sdk";

export const PopoverId = "popover";

OBR.onReady(async () => {
  if ((await OBR.player.getRole()) === "GM") return;

  OBR.popover.open({
    id: PopoverId,
    url: "/obr-initiative-tracker-4d/src/tracker/index.html",
    width: 200,
    height: 999999,
    anchorOrigin: { horizontal: "LEFT", vertical: "CENTER" },
    transformOrigin: { horizontal: "LEFT", vertical: "CENTER" },
    disableClickAway: true,
    hidePaper: true,
    marginThreshold: 0,
  });
});
