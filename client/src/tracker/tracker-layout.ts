import { useEffect, useMemo, useState } from "react";

// Vertical gap between portraits within a column (matches StaggerContainer gap).
export const PORTRAIT_GAP = 16;
// Horizontal gap between portrait columns.
export const COLUMN_GAP = 16;
// Combined top + bottom padding of the portrait column (matches StaggerContainer padding).
export const VERTICAL_PADDING = 32;
// Largest a portrait is allowed to grow to.
export const MAX_PORTRAIT_SIZE = 150;
// Once portraits would shrink below this in a single column, add another column instead.
export const MIN_PORTRAIT_SIZE = 110;
// Extra horizontal room reserved for the round badge and breathing space.
export const HORIZONTAL_PADDING = 80;
// Never make the popover narrower than its original width.
export const MIN_POPOVER_WIDTH = 300;

export interface TrackerLayout {
    /** Number of portrait columns to render. */
    columns: number;
    /** Maximum number of portraits stacked in a single column. */
    itemsPerColumn: number;
    /** Size (width/height) of each square portrait in pixels. */
    itemSize: number;
    /** Width the popover should be resized to in order to fit every column. */
    popoverWidth: number;
}

/**
 * Works out how portraits should be laid out so that they stay large enough to
 * see. When many creatures are present the portraits are wrapped into multiple
 * columns instead of shrinking a single column indefinitely.
 */
export function computeTrackerLayout(count: number, viewportHeight: number): TrackerLayout {
    const safeCount = Math.max(1, count);
    const available = Math.max(1, viewportHeight - VERTICAL_PADDING);

    // How many portraits fit in one column before they would drop below the
    // minimum readable size.
    const perColumnMax = Math.max(
        1,
        Math.floor((available + PORTRAIT_GAP) / (MIN_PORTRAIT_SIZE + PORTRAIT_GAP)),
    );

    const columns = Math.max(1, Math.ceil(safeCount / perColumnMax));
    const itemsPerColumn = Math.max(1, Math.ceil(safeCount / columns));

    const itemSize = Math.min(
        MAX_PORTRAIT_SIZE,
        (available - (itemsPerColumn - 1) * PORTRAIT_GAP) / itemsPerColumn,
    );

    const popoverWidth = Math.max(
        MIN_POPOVER_WIDTH,
        Math.round(columns * itemSize + (columns - 1) * COLUMN_GAP + HORIZONTAL_PADDING),
    );

    return { columns, itemsPerColumn, itemSize, popoverWidth };
}

/** Reactively computes the tracker layout from the creature count and window height. */
export function useTrackerLayout(count: number): TrackerLayout {
    const [viewportHeight, setViewportHeight] = useState(() =>
        typeof window === "undefined" ? 0 : window.innerHeight,
    );

    useEffect(() => {
        const onResize = () => setViewportHeight(window.innerHeight);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    return useMemo(
        () => computeTrackerLayout(count, viewportHeight),
        [count, viewportHeight],
    );
}
