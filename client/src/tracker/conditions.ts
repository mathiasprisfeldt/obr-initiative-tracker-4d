const CONDITION_ICON_MODULES = import.meta.glob<string>("../assets/conditions/*.png", {
    eager: true,
    query: "?url",
    import: "default",
});

const CONDITION_NAME_OVERRIDES: Record<string, string> = {
    "Ancenstral Protectors": "Ancestral Protectors",
    Exhausted: "Exhaustion",
    Unconcious: "Unconscious",
};

interface ConditionPreset {
    name: string;
    iconUrl: string;
}

const CONDITION_PRESETS = Object.entries(CONDITION_ICON_MODULES)
    .map(([path, iconUrl]): ConditionPreset => {
        const filename = path.split("/").pop()?.replace(/\.png$/i, "") ?? path;
        return {
            name: CONDITION_NAME_OVERRIDES[filename] ?? filename,
            iconUrl,
        };
    })
    .sort((left, right) => left.name.localeCompare(right.name));

const CONDITION_PRESETS_BY_NAME = new Map(
    CONDITION_PRESETS.map((preset) => [preset.name.toLowerCase(), preset]),
);

export const DND_CONDITIONS: readonly string[] = CONDITION_PRESETS.map(({ name }) => name);

export interface ConditionAppearance {
    abbreviation: string;
    color: string;
    iconUrl?: string;
}

const CURATED_CONDITION_COLORS: Record<string, string> = {
    Blinded: "#161618",
    Charmed: "#743274",
    Deafened: "#c27c3e",
    Exhaustion: "#a71821",
    Frightened: "#442e79",
    Grappled: "#dab892",
    Incapacitated: "#9ba04d",
    Invisible: "#d8b864",
    Paralyzed: "#969792",
    Petrified: "#38373a",
    Poisoned: "#31633b",
    Prone: "#a1887f",
    Restrained: "#522427",
    Stunned: "#aea9cb",
    Unconscious: "#805e44",
};

export function getConditionAppearance(condition: string): ConditionAppearance {
    const trimmed = condition.trim();
    const preset = CONDITION_PRESETS_BY_NAME.get(trimmed.toLowerCase());
    return {
        abbreviation: getConditionAbbreviation(preset?.name ?? trimmed),
        color:
            (preset ? CURATED_CONDITION_COLORS[preset.name] : undefined) ??
            getCustomConditionColor(preset?.name ?? trimmed),
        iconUrl: preset?.iconUrl,
    };
}

function getConditionAbbreviation(condition: string): string {
    return (
        condition
            .split(/\s+/)
            .map((word) => word[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() || "?"
    );
}

export function getCustomConditionColor(condition: string): string {
    const normalized = condition.trim().toLowerCase();
    let hash = 2166136261;
    for (let index = 0; index < normalized.length; index++) {
        hash ^= normalized.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }

    const unsignedHash = hash >>> 0;
    const hue = unsignedHash % 360;
    const saturation = 62 + ((unsignedHash >>> 9) % 13);
    const lightness = 44 + ((unsignedHash >>> 17) % 9);
    return hslToHex(hue, saturation, lightness);
}

function hslToHex(hue: number, saturation: number, lightness: number): string {
    const s = saturation / 100;
    const l = lightness / 100;
    const chroma = (1 - Math.abs(2 * l - 1)) * s;
    const segment = hue / 60;
    const secondary = chroma * (1 - Math.abs((segment % 2) - 1));
    const [red, green, blue] =
        segment < 1
            ? [chroma, secondary, 0]
            : segment < 2
              ? [secondary, chroma, 0]
              : segment < 3
                ? [0, chroma, secondary]
                : segment < 4
                  ? [0, secondary, chroma]
                  : segment < 5
                    ? [secondary, 0, chroma]
                    : [chroma, 0, secondary];
    const offset = l - chroma / 2;
    return `#${[red, green, blue]
        .map((channel) => Math.round((channel + offset) * 255).toString(16).padStart(2, "0"))
        .join("")}`;
}

export function getActiveConditions(
    characters: Array<{ properties: { conditions?: string[] } }>,
): string[] {
    return [
        ...new Map(
            characters
                .flatMap((character) => character.properties.conditions ?? [])
                .map((condition) => [condition.toLowerCase(), condition]),
        ).values(),
    ];
}
