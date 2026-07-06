import { useMemo, useState } from "react";
import {
    Box,
    Collapse,
    IconButton,
    Paper,
    Tooltip,
    Typography,
    useTheme,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import RefreshIcon from "@mui/icons-material/Refresh";
import type { RoomConnectionLogEntry } from "obr-initiative-tracker-4d-backend/api-client";
import type { RoomConnectionStatus } from "../../hooks/use-room-connection";

export interface ConnectionStatusProps {
    status: RoomConnectionStatus;
    logs: RoomConnectionLogEntry[];
    onReconnect(): void;
}

const STATUS_LABEL: Record<RoomConnectionStatus, string> = {
    idle: "Not connected",
    connecting: "Connecting…",
    connected: "Connected",
    disconnected: "Disconnected",
};

export function ConnectionStatus({ status, logs, onReconnect }: ConnectionStatusProps) {
    const theme = useTheme();
    const [expanded, setExpanded] = useState(false);

    const { color, Icon } = useMemo(() => {
        switch (status) {
            case "connected":
                return { color: theme.palette.success.main, Icon: CheckCircleIcon };
            case "disconnected":
                return { color: theme.palette.error.main, Icon: ErrorIcon };
            case "connecting":
                return { color: theme.palette.warning.main, Icon: HourglassEmptyIcon };
            default:
                return { color: theme.palette.text.secondary, Icon: HourglassEmptyIcon };
        }
    }, [status, theme]);

    // Show newest entries first.
    const orderedLogs = useMemo(() => logs.slice().reverse(), [logs]);

    return (
        <Box
            sx={{
                position: "fixed",
                bottom: 6,
                left: 6,
                zIndex: 10,
                pointerEvents: "auto",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 0.5,
            }}
        >
            <Collapse in={expanded} timeout={150} unmountOnExit>
                <Paper
                    elevation={6}
                    sx={{
                        p: 1,
                        mb: 0.5,
                        width: 240,
                        maxHeight: 200,
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        backgroundColor: "rgba(20, 20, 35, 0.95)",
                        color: "rgba(230, 230, 240, 0.9)",
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            mb: 0.5,
                        }}
                    >
                        <Typography variant="caption" sx={{ fontWeight: "bold" }}>
                            {STATUS_LABEL[status]}
                        </Typography>
                        <Tooltip title="Reconnect now">
                            <span>
                                <IconButton
                                    size="small"
                                    aria-label="Reconnect"
                                    onClick={onReconnect}
                                    sx={{ color: "inherit" }}
                                >
                                    <RefreshIcon fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>
                    </Box>
                    <Box
                        sx={{
                            overflowY: "auto",
                            fontFamily: "monospace",
                            fontSize: 10,
                            lineHeight: 1.4,
                        }}
                    >
                        {orderedLogs.length === 0 ? (
                            <Typography variant="caption" sx={{ opacity: 0.6 }}>
                                No connection events yet.
                            </Typography>
                        ) : (
                            orderedLogs.map((entry, index) => (
                                <LogRow key={`${entry.timestamp}-${index}`} entry={entry} />
                            ))
                        )}
                    </Box>
                </Paper>
            </Collapse>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
                <Tooltip title={STATUS_LABEL[status]}>
                    <IconButton
                        size="small"
                        aria-label="Connection status"
                        onClick={() => setExpanded((prev) => !prev)}
                        sx={{ color, p: 0.25 }}
                    >
                        <Icon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>
        </Box>
    );
}

function LogRow({ entry }: { entry: RoomConnectionLogEntry }) {
    const theme = useTheme();
    const color =
        entry.level === "error"
            ? theme.palette.error.light
            : entry.level === "warn"
              ? theme.palette.warning.light
              : "inherit";
    const time = new Date(entry.timestamp).toLocaleTimeString();

    return (
        <Box sx={{ color, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            <Box component="span" sx={{ opacity: 0.6, mr: 0.5 }}>
                {time}
            </Box>
            {entry.message}
        </Box>
    );
}
