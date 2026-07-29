/** All tunable tracker layout parameters stored in the shared room state. */
export interface LayoutSettings {
    portraitGap: number;
    columnGap: number;
    verticalPadding: number;
    maxPortraitSize: number;
    minPortraitSize: number;
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
    description: string;
    min: number;
    max: number;
    step: number;
}

/** Metadata used to drive the settings UI. */
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
