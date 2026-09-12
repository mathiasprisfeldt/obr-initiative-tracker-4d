import OBR from "@owlbear-rodeo/sdk";

export const ConditionLegendPopoverId = "obr-initiative-tracker-4d-condition-legend-popover";

export function OpenConditionLegend() {
    return OBR.popover.open({
        id: ConditionLegendPopoverId,
        url: `${import.meta.env.BASE_URL}/src/condition-legend/index.html`,
        width: 1,
        height: 1,
        anchorReference: "POSITION",
        anchorPosition: { left: 999999, top: 999999 },
        transformOrigin: { horizontal: "RIGHT", vertical: "BOTTOM" },
        disableClickAway: true,
        hidePaper: true,
        marginThreshold: 8,
    });
}
