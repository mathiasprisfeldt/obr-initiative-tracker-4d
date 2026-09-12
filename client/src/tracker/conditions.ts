export const DND_CONDITIONS = [
    "Blinded",
    "Charmed",
    "Deafened",
    "Exhaustion",
    "Frightened",
    "Grappled",
    "Incapacitated",
    "Invisible",
    "Paralyzed",
    "Petrified",
    "Poisoned",
    "Prone",
    "Restrained",
    "Stunned",
    "Unconscious",
] as const;

export interface ConditionAppearance {
    abbreviation: string;
    color: string;
}

const CONDITION_APPEARANCES: Record<(typeof DND_CONDITIONS)[number], ConditionAppearance> = {
    Blinded: { abbreviation: "BL", color: "#161618" },
    Charmed: { abbreviation: "CH", color: "#743274" },
    Deafened: { abbreviation: "DE", color: "#c27c3e" },
    Exhaustion: { abbreviation: "EX", color: "#a71821" },
    Frightened: { abbreviation: "FR", color: "#442e79" },
    Grappled: { abbreviation: "GR", color: "#dab892" },
    Incapacitated: { abbreviation: "IN", color: "#9ba04d" },
    Invisible: { abbreviation: "IV", color: "#d8b864" },
    Paralyzed: { abbreviation: "PA", color: "#969792" },
    Petrified: { abbreviation: "PE", color: "#38373a" },
    Poisoned: { abbreviation: "PO", color: "#31633b" },
    Prone: { abbreviation: "PR", color: "#a1887f" },
    Restrained: { abbreviation: "RE", color: "#522427" },
    Stunned: { abbreviation: "ST", color: "#aea9cb" },
    Unconscious: { abbreviation: "UN", color: "#805e44" },
};

export function getConditionAppearance(condition: string): ConditionAppearance {
    if (condition in CONDITION_APPEARANCES) {
        return CONDITION_APPEARANCES[condition as keyof typeof CONDITION_APPEARANCES];
    }

    const abbreviation =
        condition
            .trim()
            .split(/\s+/)
            .map((word) => word[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() || "?";
    return { abbreviation, color: getCustomConditionColor(condition) };
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
