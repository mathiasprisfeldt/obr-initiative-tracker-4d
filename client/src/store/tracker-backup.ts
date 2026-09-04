import type { PortraitImagePickerState } from "../character-portrait/portrait-image-picker-store";
import type { SettingsState } from "./settings-store";
import type { TrackerDocument } from "./tracker-domain";

export const TRACKER_BACKUP_VERSION = 1;

export interface TrackerBackup {
    version: typeof TRACKER_BACKUP_VERSION;
    exportedAt: string;
    settings: SettingsState;
    tracker: TrackerDocument;
    portraits: PortraitImagePickerState;
}

export function createTrackerBackup({
    settings,
    tracker,
    portraits,
}: Omit<TrackerBackup, "version" | "exportedAt">): TrackerBackup {
    return {
        version: TRACKER_BACKUP_VERSION,
        exportedAt: new Date().toISOString(),
        settings,
        tracker,
        portraits,
    };
}

export function parseTrackerBackup(value: unknown): TrackerBackup {
    if (!isRecord(value) || value.version !== TRACKER_BACKUP_VERSION) {
        throw new Error("This is not a compatible initiative tracker backup.");
    }
    if (!isRecord(value.settings) || typeof value.settings.backendUrl !== "string") {
        throw new Error("The backup settings are invalid.");
    }
    if (
        !isRecord(value.tracker) ||
        typeof value.tracker.schemaVersion !== "number" ||
        !isRecord(value.tracker.baseState) ||
        !Array.isArray(value.tracker.events) ||
        typeof value.tracker.cursor !== "number"
    ) {
        throw new Error("The tracker data in this backup is invalid.");
    }
    if (
        !isRecord(value.portraits) ||
        typeof value.portraits.imageSourceUrl !== "string" ||
        !Array.isArray(value.portraits.images)
    ) {
        throw new Error("The portrait settings in this backup are invalid.");
    }

    return {
        version: TRACKER_BACKUP_VERSION,
        exportedAt: typeof value.exportedAt === "string" ? value.exportedAt : "",
        settings: { backendUrl: value.settings.backendUrl },
        tracker: value.tracker as unknown as TrackerDocument,
        portraits: value.portraits as unknown as PortraitImagePickerState,
    };
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}
