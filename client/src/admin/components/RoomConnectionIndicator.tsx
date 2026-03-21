import { IconButton } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import { useTrackerStore } from "../../store/tracker-store";

export function RoomConnectionIndicator({ onClick }: { onClick?: () => void }) {
    const { roomConnectionStatus } = useTrackerStore();

    let statusColor: string;
    let StatusIcon: typeof CheckCircleIcon;

    switch (roomConnectionStatus) {
        case "connected":
            statusColor = "success.main";
            StatusIcon = CheckCircleIcon;
            break;
        case "disconnected":
            statusColor = "error.main";
            StatusIcon = ErrorIcon;
            break;
        default:
            statusColor = "text.secondary";
            StatusIcon = HourglassEmptyIcon;
            break;
    }

    return (
        <IconButton
            size="small"
            aria-label="Room connection status"
            onClick={onClick}
            sx={{
                position: "absolute",
                top: "50%",
                right: 8,
                transform: "translateY(-50%)",
                color: statusColor,
            }}
        >
            <StatusIcon fontSize="small" />
        </IconButton>
    );
}
