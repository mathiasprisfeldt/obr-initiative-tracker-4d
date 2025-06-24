import OBR from "@owlbear-rodeo/sdk";

OBR.onReady(() => {
  OBR.popover.open({
    id: "popover",
    url: "/popover.html",
    width: 0,
    height: 0,
    anchorOrigin: { horizontal: "RIGHT", vertical: "BOTTOM" },
    transformOrigin: { horizontal: "RIGHT", vertical: "BOTTOM" },
    disableClickAway: true,
    hidePaper: true,
    marginThreshold: 0,
  });
});
