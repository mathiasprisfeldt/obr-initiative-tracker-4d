import { useLayoutEffect, useRef, useState } from "react";
import { styled } from "@mui/material";
import { motion } from "motion/react";
import ConditionLegend from "./ConditionLegend";

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
    const contentRef = useRef<HTMLDivElement>(null);
    const [contentSize, setContentSize] = useState({ width: 1, height: 1 });

    useLayoutEffect(() => {
        const content = contentRef.current;
        if (!content) return;

        const updateSize = () => {
            const nextSize = {
                width: Math.ceil(content.offsetWidth),
                height: Math.ceil(content.offsetHeight),
            };
            setContentSize((currentSize) =>
                currentSize.width === nextSize.width && currentSize.height === nextSize.height
                    ? currentSize
                    : nextSize,
            );
            onSizeChange?.(nextSize.height, nextSize.width);
        };
        const observer = new ResizeObserver(updateSize);
        observer.observe(content);
        updateSize();
        return () => observer.disconnect();
    }, [onSizeChange]);

    return (
        <RotatedBounds
            className={className}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: contentSize.width > 1 ? 1 : 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            style={{
                width: contentSize.height,
                height: contentSize.width,
            }}
        >
            <UnrotatedContent ref={contentRef} style={{ left: contentSize.height }}>
                <ConditionLegend conditions={conditions} />
            </UnrotatedContent>
        </RotatedBounds>
    );
}

const RotatedBounds = styled(motion.div)`
    position: relative;
    overflow: visible;
    transition:
        width 320ms cubic-bezier(0.22, 1, 0.36, 1),
        height 320ms cubic-bezier(0.22, 1, 0.36, 1);
`;

const UnrotatedContent = styled(motion.div)`
    position: absolute;
    bottom: 0;
    padding: 8px;
    box-sizing: border-box;
    rotate: -90deg;
    transform-origin: left bottom;
    transition:
        left 320ms cubic-bezier(0.22, 1, 0.36, 1),
        width 320ms cubic-bezier(0.22, 1, 0.36, 1);
    width: max-content;
`;
