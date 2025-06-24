import OBR from "@owlbear-rodeo/sdk";

export const PopoverId = "popover";

OBR.onReady(() => {
  OBR.popover.open({
    id: PopoverId,
    url: "/obr-initiative-tracker-4d/popover.html",
    width: 100,
    height: 999,
    anchorOrigin: { horizontal: "LEFT", vertical: "CENTER" },
    transformOrigin: { horizontal: "LEFT", vertical: "CENTER" },
    disableClickAway: true,
    hidePaper: true,
    marginThreshold: 0,
  });
});
