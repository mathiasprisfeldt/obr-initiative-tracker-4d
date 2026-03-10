import { useCallback, useEffect, useRef, useState } from "react";
import {
    Alert,
    Button,
    Divider,
    IconButton,
    Skeleton,
    Stack,
    TextField,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useTrackerStore } from "../store/tracker-store";
import { usePortraitImagePickerStore } from "../character-portrait/portrait-image-picker-store";
import { useApi, useSettingsStore } from "../store/settings-store";
import OBR from "@owlbear-rodeo/sdk";

export function SettingsPanel() {
    const { state: trackerState } = useTrackerStore();
    const { state: portraitImagePickerState } = usePortraitImagePickerStore();
    const { state: settings, setBackendUrl } = useSettingsStore();
    const api = useApi();
    const [loading, setLoading] = useState(false);
    const [healthStatus, setHealthStatus] = useState<"idle" | "ok" | "unhealthy" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const checkHealth = useCallback(async () => {
        if (!api) {
            setHealthStatus("idle");
            setErrorMessage(null);
            return;
        }
        setLoading(true);
        setHealthStatus("idle");
        setErrorMessage(null);
        try {
            const healthy = await api.isHealthy();
            setHealthStatus(healthy ? "ok" : "unhealthy");
            if (!healthy) setErrorMessage("Backend responded but reported unhealthy status");
        } catch (e) {
            setHealthStatus("error");
            setErrorMessage(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }, [api]);

    const debounceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
    useEffect(() => {
        clearTimeout(debounceTimer.current);
        if (!api) {
            setHealthStatus("idle");
            setErrorMessage(null);
            return;
        }
        debounceTimer.current = setTimeout(checkHealth, 500);
        return () => clearTimeout(debounceTimer.current);
    }, [api, checkHealth]);

    const healthSeverity =
        healthStatus === "ok" ? "success" : healthStatus === "idle" ? "info" : "error";
    const healthMessage =
        healthStatus === "idle"
            ? (api ? "Checking..." : "Enter a backend URL to check health")
            : healthStatus === "ok"
              ? "Backend is healthy"
              : (errorMessage ?? "Unknown error");

    return (
        <Stack spacing={2}>
            <TextField
                label="Backend URL"
                placeholder="https://your-server.com"
                value={settings.backendUrl}
                onChange={(e) => setBackendUrl(e.target.value)}
                fullWidth
                size="small"
            />
            <Alert
                severity={healthSeverity}
                action={
                    api && (
                        <IconButton
                            color="inherit"
                            size="small"
                            onClick={checkHealth}
                            loading={loading}
                        >
                            <RefreshIcon />
                        </IconButton>
                    )
                }
            >
                {loading ? (
                    <Skeleton variant="text" width={150} animation="wave" />
                ) : (
                    healthMessage
                )}
            </Alert>
            <Divider />
            <Stack direction="row" spacing={2} alignItems="center">
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => console.log(trackerState)}
                >
                    Print tracker state
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => console.log(portraitImagePickerState)}
                >
                    Print portrait image picker state
                </Button>
                <Button
                    onClick={async () => {
                        const metadata = await OBR.room.getMetadata();
                        open(
                            "data:text/json," + encodeURIComponent(JSON.stringify(metadata)),
                            "_blank",
                        );
                    }}
                >
                    Download metadata
                </Button>
            </Stack>
        </Stack>
    );
}
