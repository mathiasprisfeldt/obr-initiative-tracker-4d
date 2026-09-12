import OBR from "@owlbear-rodeo/sdk";
import { OpenTracker } from "../tracker/Tracker";
import { OpenConditionLegend } from "../condition-legend/ConditionLegendPopover";

OBR.onReady(async () => {
    if ((await OBR.player.getRole()) === "GM") return;
    await Promise.all([OpenTracker(), OpenConditionLegend()]);
});
