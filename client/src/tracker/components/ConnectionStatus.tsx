import { styled } from "@mui/material";
import { AnimatePresence, motion } from "motion/react";
import type { RoomConnectionStatus } from "../../hooks/use-room-connection";

export interface ConnectionStatusProps {
    status: RoomConnectionStatus;
}

export function ConnectionStatus({ status }: ConnectionStatusProps) {
    const badConnection = status === "disconnected";

    return (
        <AnimatePresence>
            {badConnection && (
                <DisconnectedDot
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                />
            )}
        </AnimatePresence>
    );
}

const DisconnectedDot = styled(motion.div)`
    position: fixed;
    bottom: 6px;
    left: 6px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(220, 80, 80, 0.7);
    pointer-events: none;
`;
