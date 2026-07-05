import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Button, Divider, IconButton, List, ListItem, ListItemText, Skeleton, Stack, TextField, Typography } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useTrackerStore } from "../store/tracker-store";
import { usePortraitImagePickerStore } from "../character-portrait/portrait-image-picker-store";
import { useApi, useSettingsStore } from "../store/settings-store";
import type { ConnectedClientInfo } from "obr-initiative-tracker-4d-backend/api-client";
import OBR from "@owlbear-rodeo/sdk";

export function SettingsPanel() {
    const { state: trackerState } = useTrackerStore();
    const { state: portraitImagePickerState } = usePortraitImagePickerStore();
    const { state: settings, setBackendUrl } = useSettingsStore();
    const api = useApi();
    const [loading, setLoading] = useState(false);
    const [healthStatus, setHealthStatus] = useState<"idle" | "ok" | "unhealthy" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [connectedClients, setConnectedClients] = useState<ConnectedClientInfo[]>([]);
    const [clientsLoading, setClientsLoading] = useState(false);

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

    const fetchClients = useCallback(async () => {
        if (!api) {
            setConnectedClients([]);
            return;
        }
        setClientsLoading(true);
        try {
            const res = await api.getConnectedClients();
            setConnectedClients(res.clients);
        } catch {
            setConnectedClients([]);
        } finally {
            setClientsLoading(false);
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

    // Poll connected clients every 2 seconds when api is available
    useEffect(() => {
        if (!api) {
            setConnectedClients([]);
            return;
        }
        fetchClients();
        const interval = setInterval(fetchClients, 2000);
        return () => clearInterval(interval);
    }, [api, fetchClients]);

    const healthSeverity =
        healthStatus === "ok" ? "success" : healthStatus === "idle" ? "info" : "error";
    const healthMessage =
        healthStatus === "idle"
            ? api
                ? "Checking..."
                : "Enter a backend URL to check health"
            : healthStatus === "ok"
              ? "Backend is healthy"
              : (errorMessage ?? "Unknown error");

    function formatLastPong(lastPong: string | null): string {
        if (!lastPong) return "Never";
        const diff = Date.now() - new Date(lastPong).getTime();
        if (diff < 1000) return "Just now";
        return `${Math.round(diff / 1000)}s ago`;
    }

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
                {loading ? <Skeleton variant="text" width={150} animation="wave" /> : healthMessage}
            </Alert>
            <Divider />
            <Stack spacing={1}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="subtitle2">Connected Clients</Typography>
                    <IconButton
                        size="small"
                        onClick={fetchClients}
                        loading={clientsLoading}
                    >
                        <RefreshIcon fontSize="small" />
                    </IconButton>
                </Stack>
                {connectedClients.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                        {api ? "No clients connected" : "Set backend URL to view clients"}
                    </Typography>
                ) : (
                    <List dense disablePadding>
                        {connectedClients.map((room) => (
                            <ListItem key={room.roomId} disableGutters sx={{ flexDirection: "column", alignItems: "flex-start" }}>
                                <ListItemText
                                    primary={`Room: ${room.roomId}`}
                                    secondary={`${room.clientCount} client(s)`}
                                />
                                {room.clients.map((client, idx) => (
                                    <Typography key={idx} variant="caption" color="text.secondary" sx={{ pl: 2 }}>
                                        Client {idx + 1}: connected {new Date(client.connectedAt).toLocaleTimeString()} — last ping: {formatLastPong(client.lastPong)}
                                    </Typography>
                                ))}
                            </ListItem>
                        ))}
                    </List>
                )}
            </Stack>
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
