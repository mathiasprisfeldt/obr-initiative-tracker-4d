import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Button, Divider, IconButton, List, ListItem, ListItemText, Skeleton, Stack, TextField, Typography } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useTrackerStore } from "../../store/tracker-store";
import { usePortraitImagePickerStore } from "../../character-portrait/portrait-image-picker-store";
import { useApi, useSettingsStore } from "../../store/settings-store";
import type { ConnectedClientInfo } from "obr-initiative-tracker-4d-backend/api-client";
import { createTrackerBackup, parseTrackerBackup } from "../../store/tracker-backup";

export function SettingsPanel() {
    const {
        document: trackerDocument,
        replaceDocument,
    } = useTrackerStore();
    const {
        state: portraitImagePickerState,
        replaceState: replacePortraitState,
    } = usePortraitImagePickerStore();
    const { state: settings, setBackendUrl, replaceState: replaceSettingsState } = useSettingsStore();
    const api = useApi();
    const [loading, setLoading] = useState(false);
    const [healthStatus, setHealthStatus] = useState<"idle" | "ok" | "unhealthy" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [connectedClients, setConnectedClients] = useState<ConnectedClientInfo[]>([]);
    const [clientsLoading, setClientsLoading] = useState(false);
    const [backupStatus, setBackupStatus] = useState<string | null>(null);
    const backupInputRef = useRef<HTMLInputElement>(null);

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
            const ownIds = new Set(api.getOwnClientIds());
            // Hide our own connection(s) — we already know we're connected.
            const filtered = res.clients
                .map((room) => {
                    const clients = room.clients.filter((c) => !ownIds.has(c.id));
                    return { ...room, clients, clientCount: clients.length };
                })
                .filter((room) => room.clients.length > 0);
            setConnectedClients(filtered);
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

    function formatLastPing(lastPing: string | null): string {
        if (!lastPing) return "Never";
        const diff = Date.now() - new Date(lastPing).getTime();
        if (diff < 1000) return "Just now";
        return `${Math.round(diff / 1000)}s ago`;
    }

    const downloadBackup = () => {
        const backup = createTrackerBackup({
            settings,
            tracker: trackerDocument,
            portraits: portraitImagePickerState,
        });
        const blob = new Blob([JSON.stringify(backup, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const download = document.createElement("a");
        download.href = url;
        download.download = `initiative-tracker-backup-${backup.exportedAt.slice(0, 10)}.json`;
        download.style.display = "none";
        document.body.append(download);
        download.click();
        download.remove();
        window.setTimeout(() => URL.revokeObjectURL(url));
        setBackupStatus("Backup downloaded.");
    };

    const importBackup = async (file: File) => {
        try {
            const backup = parseTrackerBackup(JSON.parse(await file.text()));
            if (!window.confirm("Replace the current tracker, portrait, and backend settings with this backup?")) {
                return;
            }
            replaceSettingsState(backup.settings);
            replacePortraitState(backup.portraits);
            replaceDocument(backup.tracker);
            setBackupStatus("Backup imported. The restored state is now shared with connected players.");
        } catch (error) {
            setBackupStatus(
                error instanceof Error ? `Could not import backup: ${error.message}` : "Could not import backup.",
            );
        }
    };

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
                                        Client {idx + 1}: connected {new Date(client.connectedAt).toLocaleTimeString()} — last ping: {formatLastPing(client.lastPing)}
                                    </Typography>
                                ))}
                            </ListItem>
                        ))}
                    </List>
                )}
            </Stack>
            <Divider />
            <Stack spacing={1}>
                <Typography variant="subtitle2">Backup</Typography>
                <Typography variant="body2" color="text.secondary">
                    Export all tracker history, portrait settings, and backend settings as JSON, then restore it here later.
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Button variant="outlined" onClick={downloadBackup}>
                        Export JSON
                    </Button>
                    <Button variant="outlined" onClick={() => backupInputRef.current?.click()}>
                        Import JSON
                    </Button>
                    <input
                        ref={backupInputRef}
                        hidden
                        type="file"
                        accept="application/json,.json"
                        onChange={(event) => {
                            const [file] = Array.from(event.target.files ?? []);
                            event.target.value = "";
                            if (file) void importBackup(file);
                        }}
                    />
                </Stack>
                {backupStatus && <Typography variant="body2">{backupStatus}</Typography>}
            </Stack>
        </Stack>
    );
}
