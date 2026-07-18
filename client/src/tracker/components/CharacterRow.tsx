import { styled } from "@mui/material";
import { Character } from "../../store/tracker-store";
import CharacterAvatar from "./CharacterAvatar";
import { AnimatePresence, motion, Variants } from "motion/react";
import {
    MAX_PORTRAIT_SIZE,
    PORTRAIT_GAP,
    VERTICAL_PADDING,
    HORIZONTAL_PADDING,
} from "../tracker-layout";

export interface Props {
    characters: Character[];
    currentCharacter?: Character;
    visible?: boolean;
    itemSize?: number;
    /** Vertical gap between portraits within a column. */
    gap?: number;
    /** Combined top + bottom padding of the portrait column. */
    verticalPadding?: number;
    /** Combined left + right padding of the portrait column. */
    horizontalPadding?: number;
}

const containerVariants: Variants = {
    show: {
        transition: {
            staggerChildren: 0.08,
        },
    },
    hide: {
        transition: {
            staggerChildren: 0.05,
            staggerDirection: -1,
        },
    },
};

const itemVariants: Variants = {
    show: {
        opacity: 1,
        scale: 1,
        x: 0,
        transition: { type: "spring", stiffness: 300, damping: 25 },
    },
    hide: {
        opacity: 0,
        scale: 0.3,
        x: -200,
        transition: { type: "spring", stiffness: 300, damping: 25 },
    },
};

export default function CharacterRow({
    characters,
    currentCharacter,
    visible = true,
    itemSize = MAX_PORTRAIT_SIZE,
    gap = PORTRAIT_GAP,
    verticalPadding = VERTICAL_PADDING,
    horizontalPadding = HORIZONTAL_PADDING,
    ...rest
}: Props) {
    return (
        <StaggerContainer
            {...rest}
            gap={gap}
            verticalPadding={verticalPadding}
            horizontalPadding={horizontalPadding}
            variants={containerVariants}
            initial="hide"
            animate={visible ? "show" : "hide"}
        >
            <AnimatePresence mode="popLayout">
                {characters.map((character) => {
                    const hasTurn = currentCharacter?.id === character.id;
                    return (
                        <motion.div
                            key={character.id}
                            layout
                            variants={itemVariants}
                            exit={{
                                opacity: [1, 1, 1, 0],
                                scale: [1, 1.05, 1.05, 0.3],
                                rotate: [0, -3, 3, -2, 3, -1, 10],
                                filter: [
                                    "grayscale(0)",
                                    "grayscale(0.5)",
                                    "grayscale(1) brightness(0.3)",
                                    "grayscale(1) brightness(0)",
                                ],
                                transition: {
                                    duration: 0.8,
                                    times: [0, 0.4, 0.7, 1],
                                    rotate: {
                                        duration: 0.6,
                                        times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 1],
                                    },
                                },
                            }}
                            style={{
                                display: "flex",
                                width: itemSize,
                                height: itemSize,
                                flexShrink: 0,
                                justifyContent: "center",
                            }}
                        >
                            <motion.div
                                layout
                                animate={{
                                    scale: hasTurn ? 1.25 : 1,
                                    zIndex: hasTurn ? 1 : 0,
                                }}
                                transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 25,
                                }}
                                style={{
                                    display: "flex",
                                    width: "100%",
                                    justifyContent: "center",
                                }}
                            >
                                <StyledCharacterAvatar character={character} hasTurn={hasTurn} />
                            </motion.div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </StaggerContainer>
    );
}

const StyledCharacterAvatar = styled(CharacterAvatar)`
    rotate: -90deg;
    flex-shrink: 1;
`;

const StaggerContainer = styled(motion.div, {
    shouldForwardProp: (prop) =>
        prop !== "gap" && prop !== "verticalPadding" && prop !== "horizontalPadding",
})<{ gap: number; verticalPadding: number; horizontalPadding: number }>(
    ({ gap, verticalPadding, horizontalPadding }) => ({
        display: "flex",
        flexDirection: "column-reverse",
        flexWrap: "wrap",
        gap: `${gap}px`,
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignContent: "center",
        overflow: "visible",
        padding: `${verticalPadding}px ${horizontalPadding}px`,
        boxSizing: "border-box",
    }),
);
