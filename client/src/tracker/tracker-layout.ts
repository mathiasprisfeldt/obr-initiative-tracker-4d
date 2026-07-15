import { useEffect, useMemo, useState } from "react";
import {
    DEFAULT_LAYOUT_SETTINGS,
    type LayoutSettings,
    useLayoutSettings,
} from "../store/layout-settings-store";

// Default layout parameters. These remain exported for backwards compatibility
// and as fallbacks; the live values come from the layout settings store so each
// user can tweak them on the fly.
export const PORTRAIT_GAP = DEFAULT_LAYOUT_SETTINGS.portraitGap;
export const COLUMN_GAP = DEFAULT_LAYOUT_SETTINGS.columnGap;
export const VERTICAL_PADDING = DEFAULT_LAYOUT_SETTINGS.verticalPadding;
export const MAX_PORTRAIT_SIZE = DEFAULT_LAYOUT_SETTINGS.maxPortraitSize;
export const MIN_PORTRAIT_SIZE = DEFAULT_LAYOUT_SETTINGS.minPortraitSize;
export const HORIZONTAL_PADDING = DEFAULT_LAYOUT_SETTINGS.horizontalPadding;
export const MIN_POPOVER_WIDTH = DEFAULT_LAYOUT_SETTINGS.minPopoverWidth;

export interface TrackerLayout {
    /** Number of portrait columns to render. */
    columns: number;
    /** Maximum number of portraits stacked in a single column. */
    itemsPerColumn: number;
    /** Size (width/height) of each square portrait in pixels. */
    itemSize: number;
    /** Width the popover should be resized to in order to fit every column. */
    popoverWidth: number;
    /** Vertical gap between portraits within a column. */
    portraitGap: number;
    /** Combined top + bottom padding of the portrait column. */
    verticalPadding: number;
}

/**
 * Works out how portraits should be laid out so that they stay large enough to
 * see. When many creatures are present the portraits are wrapped into multiple
 * columns instead of shrinking a single column indefinitely.
 */
export function computeTrackerLayout(
    count: number,
    viewportHeight: number,
    settings: LayoutSettings = DEFAULT_LAYOUT_SETTINGS,
): TrackerLayout {
    const {
        portraitGap,
        columnGap,
        verticalPadding,
        maxPortraitSize,
        minPortraitSize,
        horizontalPadding,
        minPopoverWidth,
    } = settings;

    const safeCount = Math.max(1, count);
    const available = Math.max(1, viewportHeight - verticalPadding);

    // How many portraits fit in one column before they would drop below the
    // minimum readable size.
    const perColumnMax = Math.max(
        1,
        Math.floor((available + portraitGap) / (minPortraitSize + portraitGap)),
    );

    const columns = Math.max(1, Math.ceil(safeCount / perColumnMax));
    const itemsPerColumn = Math.max(1, Math.ceil(safeCount / columns));

    const itemSize = Math.min(
        maxPortraitSize,
        (available - (itemsPerColumn - 1) * portraitGap) / itemsPerColumn,
    );

    const popoverWidth = Math.max(
        minPopoverWidth,
        Math.round(columns * itemSize + (columns - 1) * columnGap + horizontalPadding),
    );

    return { columns, itemsPerColumn, itemSize, popoverWidth, portraitGap, verticalPadding };
}

/** Reactively computes the tracker layout from the creature count and window height. */
export function useTrackerLayout(count: number): TrackerLayout {
    const settings = useLayoutSettings();
    const [viewportHeight, setViewportHeight] = useState(() =>
        typeof window === "undefined" ? 0 : window.innerHeight,
    );

    useEffect(() => {
        const onResize = () => setViewportHeight(window.innerHeight);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    return useMemo(
        () => computeTrackerLayout(count, viewportHeight, settings),
        [count, viewportHeight, settings],
    );
}
