import { useLayoutEffect } from "react";
import { styled } from "@mui/material";
import { motion } from "motion/react";
import ConditionLegend from "./ConditionLegend";

const LEGEND_LENGTH = 320;

export interface RotatedConditionLegendProps {
    conditions: string[];
    className?: string;
    onSizeChange?(width: number, height: number): void;
}

export default function RotatedConditionLegend({
    conditions,
    className,
    onSizeChange,
}: RotatedConditionLegendProps) {
    const rows = Math.ceil(conditions.length / 2);
    const legendThickness = 38 + rows * 28 + Math.max(0, rows - 1) * 6;

    useLayoutEffect(() => {
        onSizeChange?.(legendThickness, LEGEND_LENGTH);
    }, [legendThickness, onSizeChange]);

    return (
        <RotatedBounds
            className={className}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: legendThickness > 1 ? 1 : 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            style={{
                width: legendThickness,
                height: LEGEND_LENGTH,
            }}
        >
            <UnrotatedContent
                style={{ left: legendThickness, width: LEGEND_LENGTH }}
            >
                <ConditionLegend conditions={conditions} />
            </UnrotatedContent>
        </RotatedBounds>
    );
}

const RotatedBounds = styled(motion.div)`
    position: relative;
    overflow: visible;
    transition: width 320ms cubic-bezier(0.22, 1, 0.36, 1);
`;

const UnrotatedContent = styled(motion.div)`
    position: absolute;
    bottom: 0;
    padding: 8px;
    box-sizing: border-box;
    rotate: -90deg;
    transform-origin: left bottom;
    transition: left 320ms cubic-bezier(0.22, 1, 0.36, 1);
`;
