import { styled } from "@mui/material";
import type { HTMLAttributes } from "react";

interface ConditionBadgeProps extends HTMLAttributes<HTMLSpanElement> {
    color: string;
    badgeSize?: "portrait" | "legend";
    iconUrl?: string;
    className?: string;
}

export function ConditionBadge({
    children,
    color,
    badgeSize = "portrait",
    iconUrl,
    className,
    ...rest
}: ConditionBadgeProps) {
    return (
        <BadgeRoot
            {...rest}
            className={className}
            color={color}
            badgeSize={badgeSize}
        >
            {iconUrl ? <BadgeIcon src={iconUrl} alt="" /> : children}
        </BadgeRoot>
    );
}

const BadgeRoot = styled("span", {
    shouldForwardProp: (prop) => prop !== "color" && prop !== "badgeSize",
})<{ color: string; badgeSize?: "portrait" | "legend" }>(({ color, badgeSize = "portrait" }) => {
    const size = badgeSize === "portrait" ? 32 : 28;
    return {
        display: "grid",
        placeItems: "center",
        width: size,
        height: size,
        boxSizing: "border-box",
        flexShrink: 0,
        border: "1.5px solid rgba(255, 255, 255, 0.75)",
        borderRadius: "50%",
        background: `radial-gradient(circle at 35% 30%, ${color}, color-mix(in srgb, ${color} 65%, #111))`,
        boxShadow: `0 2px 8px rgba(0, 0, 0, 0.9), 0 0 10px 1px ${color}`,
        color: "#fff",
        fontSize: badgeSize === "portrait" ? "clamp(0.65rem, 14%, 0.85rem)" : "0.68rem",
        fontWeight: 900,
        lineHeight: 1,
        textShadow: "0 1px 3px rgba(0, 0, 0, 0.95)",
    };
});

const BadgeIcon = styled("img")`
    width: 76%;
    height: 76%;
    object-fit: contain;
    filter: invert(1) drop-shadow(0 1px 2px rgba(0, 0, 0, 0.85));
`;
