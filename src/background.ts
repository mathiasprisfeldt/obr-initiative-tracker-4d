import OBR from "@owlbear-rodeo/sdk";

OBR.onReady(() => {
  OBR.popover.open({
    id: "popover",
    url: "/obr-initiative-tracker-4d/popover.html",
    width: 200,
    height: window.innerHeight - 100,
    anchorOrigin: { horizontal: "LEFT", vertical: "CENTER" },
    transformOrigin: { horizontal: "LEFT", vertical: "CENTER" },
    disableClickAway: true,
    hidePaper: true,
    marginThreshold: 0,
  });
});
