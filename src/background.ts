import OBR from "@owlbear-rodeo/sdk";

OBR.onReady(() => {
  OBR.popover.open({
    id: "popover",
    url: "/obr-initiative-tracker-4d/popover.html",
    width: 100,
    height: 100,
    anchorOrigin: { horizontal: "RIGHT", vertical: "BOTTOM" },
    transformOrigin: { horizontal: "RIGHT", vertical: "BOTTOM" },
    disableClickAway: true,
    hidePaper: true,
    marginThreshold: 0,
  });
});
