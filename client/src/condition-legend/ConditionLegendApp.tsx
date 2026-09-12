import { useCallback, useEffect, useMemo } from "react";
import OBR from "@owlbear-rodeo/sdk";
import { AnimatePresence } from "motion/react";
import { useTracker } from "../store/tracker-store";
import { isCharacterInEncounter } from "../store/tracker-domain";
import RotatedConditionLegend from "../tracker/components/RotatedConditionLegend";
import { getActiveConditions } from "../tracker/conditions";
import { ConditionLegendPopoverId } from "./ConditionLegendPopover";

export function ConditionLegendApp() {
    const { state } = useTracker();
    const visible = Boolean(state?.isDisplayed && state.hasEncounterStarted);
    const conditions = useMemo(
        () =>
            getActiveConditions(
                (state?.characters ?? []).filter(isCharacterInEncounter),
            ),
        [state?.characters],
    );
    const showLegend = visible && conditions.length > 0;

    const collapsePopover = useCallback(() => {
        Promise.all([
            OBR.popover.setWidth(ConditionLegendPopoverId, 1),
            OBR.popover.setHeight(ConditionLegendPopoverId, 1),
        ]).catch(() => {});
    }, []);

    useEffect(() => {
        if (!state) collapsePopover();
    }, [collapsePopover, state]);

    const resizePopover = useCallback((width: number, height: number) => {
        Promise.all([
            OBR.popover.setWidth(ConditionLegendPopoverId, width),
            OBR.popover.setHeight(ConditionLegendPopoverId, height),
        ]).catch(() => {});
    }, []);

    return (
        <AnimatePresence
            onExitComplete={() => {
                if (!showLegend) collapsePopover();
            }}
        >
            {showLegend && (
                <RotatedConditionLegend
                    key="condition-legend"
                    conditions={conditions}
                    onSizeChange={resizePopover}
                />
            )}
        </AnimatePresence>
    );
}
