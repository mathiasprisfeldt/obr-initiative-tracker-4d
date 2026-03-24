import { styled } from "@mui/material";
import { Character } from "../../store/tracker-store";
import CharacterAvatar from "./CharacterAvatar";
import { AnimatePresence, motion } from "motion/react";

export interface Props {
    characters: Character[];
    currentCharacter?: Character;
    visible?: boolean;
}

const containerVariants = {
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

const itemVariants = {
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
    ...rest
}: Props) {
    return (
        <StaggerContainer
            {...rest}
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
                                opacity: 0,
                                scale: 0.3,
                                x: -200,
                                transition: { type: "spring", stiffness: 300, damping: 25 },
                            }}
                            style={{
                                display: "flex",
                                maxHeight: 150,
                                flexGrow: 1,
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

const StaggerContainer = styled(motion.div)`
    display: flex;
    flex-direction: column-reverse;
    gap: 16px;
    width: 100%;
    height: 100%;
    justify-content: center;
    overflow: hidden;
    padding: 16px 0;
    box-sizing: border-box;
`;
