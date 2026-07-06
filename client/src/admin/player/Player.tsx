import { useMemo } from "react";
import {
    Box,
    Button,
    Divider,
    Paper,
    Stack,
    Typography,
    useTheme,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import RefreshIcon from "@mui/icons-material/Refresh";
import type { RoomConnectionLogEntry } from "obr-initiative-tracker-4d-backend/api-client";
import { useTracker } from "../../store/tracker-store";
import type { RoomConnectionStatus } from "../../hooks/use-room-connection";

const STATUS_LABEL: Record<RoomConnectionStatus, string> = {
    idle: "Not connected",
    connecting: "Connecting…",
    connected: "Connected",
    disconnected: "Disconnected",
};

export default function Player() {
    const theme = useTheme();
    const { connectionStatus, logs, reconnect } = useTracker();

    const { color, Icon } = useMemo(() => {
        switch (connectionStatus) {
            case "connected":
                return { color: theme.palette.success.main, Icon: CheckCircleIcon };
            case "disconnected":
                return { color: theme.palette.error.main, Icon: ErrorIcon };
            case "connecting":
                return { color: theme.palette.warning.main, Icon: HourglassEmptyIcon };
            default:
                return { color: theme.palette.text.secondary, Icon: HourglassEmptyIcon };
        }
    }, [connectionStatus, theme]);

    // Show newest entries first.
    const orderedLogs = useMemo(() => logs.slice().reverse(), [logs]);

    return (
        <Box sx={{ width: "100%", color: "white", p: 2 }}>
            <Stack spacing={2}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Icon sx={{ color }} />
                    <Typography variant="h6">{STATUS_LABEL[connectionStatus]}</Typography>
                    <Box sx={{ flexGrow: 1 }} />
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<RefreshIcon />}
                        onClick={reconnect}
                    >
                        Reconnect
                    </Button>
                </Stack>
                <Divider />
                <Typography variant="subtitle2">Connection log</Typography>
                <Paper
                    variant="outlined"
                    sx={{
                        maxHeight: 400,
                        overflowY: "auto",
                        p: 1,
                        fontFamily: "monospace",
                        fontSize: 12,
                        lineHeight: 1.5,
                        backgroundColor: "rgba(0, 0, 0, 0.3)",
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
                </Paper>
            </Stack>
            <Typography
                variant="caption"
                sx={{
                    position: "fixed",
                    bottom: 4,
                    right: 8,
                    opacity: 0.5,
                    pointerEvents: "none",
                    userSelect: "none",
                }}
            >
                {import.meta.env.VITE_BUILD_VERSION}
            </Typography>
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
