import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "obr-initiative-tracker-4d-layout-settings";

/**
 * All tunable tracker layout parameters. Persisted per-user (per-device) so that
 * every player can tweak the tracker to match whatever screen/setup they run.
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

export interface LayoutSettingsStore {
    settings: LayoutSettings;

    setSetting(key: keyof LayoutSettings, value: number): void;
    resetSetting(key: keyof LayoutSettings): void;
    reset(): void;
}

function sanitize(value: unknown): LayoutSettings {
    if (!value || typeof value !== "object") return { ...DEFAULT_LAYOUT_SETTINGS };
    const partial = value as Partial<Record<keyof LayoutSettings, unknown>>;
    const result = { ...DEFAULT_LAYOUT_SETTINGS };
    for (const key of Object.keys(DEFAULT_LAYOUT_SETTINGS) as (keyof LayoutSettings)[]) {
        const raw = partial[key];
        if (typeof raw === "number" && Number.isFinite(raw)) {
            result[key] = raw;
        }
    }
    return result;
}

function loadSettings(): LayoutSettings {
    if (typeof window === "undefined" || !window.localStorage) {
        return { ...DEFAULT_LAYOUT_SETTINGS };
    }
    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (!stored) return { ...DEFAULT_LAYOUT_SETTINGS };
        return sanitize(JSON.parse(stored));
    } catch {
        return { ...DEFAULT_LAYOUT_SETTINGS };
    }
}

const context = createContext<LayoutSettingsStore>({
    settings: DEFAULT_LAYOUT_SETTINGS,
    setSetting: () => {},
    resetSetting: () => {},
    reset: () => {},
});

export function useLayoutSettingsStore(): LayoutSettingsStore {
    return useContext(context);
}

export function useLayoutSettings(): LayoutSettings {
    return useContext(context).settings;
}

export function LayoutSettingsStoreProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<LayoutSettings>(loadSettings);

    // Persist to localStorage whenever the settings change.
    useEffect(() => {
        if (typeof window === "undefined" || !window.localStorage) return;
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch {
            // Ignore storage failures (e.g. private mode / quota).
        }
    }, [settings]);

    // Sync live between iframes/tabs of the same user (e.g. GM admin panel and
    // the tracker popover) so tweaks apply on the fly.
    useEffect(() => {
        if (typeof window === "undefined") return;
        const onStorage = (event: StorageEvent) => {
            if (event.key !== STORAGE_KEY) return;
            setSettings(
                event.newValue
                    ? sanitize(JSON.parse(event.newValue))
                    : { ...DEFAULT_LAYOUT_SETTINGS },
            );
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    const setSetting = useCallback((key: keyof LayoutSettings, value: number) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
    }, []);

    const resetSetting = useCallback((key: keyof LayoutSettings) => {
        setSettings((prev) => ({ ...prev, [key]: DEFAULT_LAYOUT_SETTINGS[key] }));
    }, []);

    const reset = useCallback(() => {
        setSettings({ ...DEFAULT_LAYOUT_SETTINGS });
    }, []);

    const store = useMemo<LayoutSettingsStore>(
        () => ({ settings, setSetting, resetSetting, reset }),
        [settings, setSetting, resetSetting, reset],
    );

    return <context.Provider value={store}>{children}</context.Provider>;
}
