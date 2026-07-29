/**
 * All tunable tracker layout parameters. Stored in the shared tracker room state.
 */
export interface LayoutSettings {
    /** Vertical gap between portraits within a column. */
    portraitGap: number;
    /** Horizontal gap between portrait columns. */
    columnGap: number;
    /** Padding applied to the top and bottom of the portrait column. */
    verticalPadding: number;
    /** Largest a portrait is allowed to grow to. */
    maxPortraitSize: number;
    /** Once portraits would shrink below this, add another column instead. */
    minPortraitSize: number;
    /** Padding applied to the left and right of the portrait columns. */
    horizontalPadding: number;
}

export const DEFAULT_LAYOUT_SETTINGS: LayoutSettings = {
    portraitGap: 16,
    columnGap: 16,
    verticalPadding: 16,
    maxPortraitSize: 150,
    minPortraitSize: 110,
    horizontalPadding: 40,
};

export interface LayoutSettingField {
    key: keyof LayoutSettings;
    label: string;
    /** Human readable explanation of what the parameter controls. */
    description: string;
    min: number;
    max: number;
    step: number;
}

/** Metadata used to drive the settings UI (sliders, ranges, labels). */
export const LAYOUT_SETTING_FIELDS: LayoutSettingField[] = [
    {
        key: "maxPortraitSize",
        label: "Max portrait size",
        description: "Largest a portrait is allowed to grow to.",
        min: 40,
        max: 400,
        step: 5,
    },
    {
        key: "minPortraitSize",
        label: "Min portrait size",
        description: "Below this a portrait wraps into a new column instead of shrinking.",
        min: 40,
        max: 400,
        step: 5,
    },
    {
        key: "portraitGap",
        label: "Portrait gap",
        description: "Vertical gap between portraits within a column.",
        min: 0,
        max: 64,
        step: 1,
    },
    {
        key: "columnGap",
        label: "Column gap",
        description: "Horizontal gap between portrait columns.",
        min: 0,
        max: 64,
        step: 1,
    },
    {
        key: "verticalPadding",
        label: "Vertical padding",
        description: "Padding on the top and bottom of the portrait column.",
        min: 0,
        max: 64,
        step: 1,
    },
    {
        key: "horizontalPadding",
        label: "Horizontal padding",
        description: "Padding on the left and right of the portrait columns.",
        min: 0,
        max: 100,
        step: 1,
    },
];
