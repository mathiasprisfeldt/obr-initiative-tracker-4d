import { styled } from "@mui/material";
import { AnimatePresence, motion } from "motion/react";
import { getConditionAppearance } from "../conditions";
import { ConditionBadge } from "./ConditionBadge";

export interface ConditionLegendProps {
    conditions: string[];
}

export default function ConditionLegend({ conditions }: ConditionLegendProps) {
    return (
        <Legend
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
        >
            <Items columns={Math.min(Math.max(conditions.length, 1), 2)}>
                <AnimatePresence initial={false} mode="popLayout">
                    {conditions.map((condition) => {
                        const appearance = getConditionAppearance(condition);
                        return (
                            <Item
                                key={condition.toLowerCase()}
                                initial={{ opacity: 0, scale: 0.82 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.82 }}
                                transition={{ duration: 0.18, ease: "easeOut" }}
                            >
                                <ConditionBadge
                                    color={appearance.color}
                                    badgeSize="legend"
                                    iconUrl={appearance.iconUrl}
                                >
                                    {appearance.abbreviation}
                                </ConditionBadge>
                                <span>{condition}</span>
                            </Item>
                        );
                    })}
                </AnimatePresence>
            </Items>
        </Legend>
    );
}

const Legend = styled(motion.aside)`
    width: max-content;
    padding: 10px 12px;
    box-sizing: border-box;
    border: 1px solid rgba(200, 170, 110, 0.35);
    border-radius: 10px;
    background: linear-gradient(145deg, rgba(30, 30, 45, 0.94), rgba(15, 15, 25, 0.9));
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45);
    color: white;
    pointer-events: none;
`;

const Items = styled("div", {
    shouldForwardProp: (prop) => prop !== "columns",
})<{ columns: number }>(({ columns }) => ({
    display: "grid",
    gridTemplateColumns: `repeat(${columns}, max-content)`,
    gap: "6px 10px",
}));

const Item = styled(motion.div)`
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.75rem;
    font-weight: 650;
    line-height: 1;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.9);

    & > span:last-child {
        white-space: nowrap;
    }
`;
