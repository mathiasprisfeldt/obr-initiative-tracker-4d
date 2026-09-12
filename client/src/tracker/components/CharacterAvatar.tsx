import { Character } from "../../store/tracker-store";
import { styled } from "@mui/material";
import { PortraitImageWithPlaceholder } from "../../character-portrait/PortraitImageWithPlaceholder";
import { usePortraitImage } from "../../character-portrait";
import { TextPlate } from "./TextPlate";
import TurnIndicator from "./TurnIndicator";
import { DamageOverlay } from "./DamageOverlay";
import { getDamageLevel } from "../../utils/damage-level";
import { getConditionAppearance } from "../conditions";
import ConditionParticles from "./ConditionParticles";
import { ConditionBadge } from "./ConditionBadge";
import { AnimatePresence, motion } from "motion/react";

export interface Props {
    character: Character;
    hasTurn: boolean;
}

const MAX_CONDITION_BADGES = 11;

export default function CharacterAvatar({ character, hasTurn, ...rest }: Props) {
    const portraitImage = usePortraitImage(character.properties.portraitImageId);

    const name = character.properties.name;
    const number = name.match(/\d+/)?.[0];
    const nameWithoutNumber = name.replace(/\d+/, "").trim();
    const damageLevel = getDamageLevel(character.properties.health, character.properties.maxHealth);
    const conditions = character.properties.conditions ?? [];
    const conditionAppearances = conditions.map(getConditionAppearance);
    const visibleConditions =
        conditions.length <= MAX_CONDITION_BADGES
            ? conditions
            : conditions.slice(0, MAX_CONDITION_BADGES - 1);
    const conditionMarkers = visibleConditions.map((condition, index) => ({
        key: condition,
        label: conditionAppearances[index].abbreviation,
        color: conditionAppearances[index].color,
    }));
    if (conditions.length > MAX_CONDITION_BADGES) {
        conditionMarkers.push({
            key: "additional-conditions",
            label: `+${conditions.length - (MAX_CONDITION_BADGES - 1)}`,
            color: "#455a64",
        });
    }
    const turnParticleColors =
        portraitImage?.particleColors && portraitImage.particleColors.length > 0
            ? portraitImage.particleColors
            : portraitImage?.palette;

    return (
        <Background {...rest}>
            <PortraitImageWithPlaceholder
                portraitImage={portraitImage}
                showBorder={true}
                portraitOverlay={
                    <>
                        <DamageOverlay damageLevel={damageLevel} seed={name} />
                        {conditions.length > 0 && (
                            <>
                                <ConditionTint color={conditionAppearances[0].color} />
                                <ConditionParticlesStyled
                                    id={character.id}
                                    colors={conditionAppearances.map(({ color }) => color)}
                                />
                            </>
                        )}
                        <TurnIndicatorStyled
                            id={character.id}
                            hasTurn={hasTurn}
                            palette={turnParticleColors}
                        />
                    </>
                }
                style={{
                    width: "100%",
                    height: "100%",
                }}
            />
            {conditions.length > 0 && (
                <ConditionMarkers
                    aria-label={`Conditions: ${conditions.join(", ")}`}
                    title={conditions.join(", ")}
                >
                    <AnimatePresence initial>
                        {conditionMarkers.map((marker, index) => {
                            const angle = (index - (conditionMarkers.length - 1) / 2) * 26;
                            return (
                                <ConditionArcPosition
                                    key={marker.key}
                                    initial={{ opacity: 0, rotate: angle }}
                                    animate={{ opacity: 1, rotate: angle }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.24, ease: "easeOut" }}
                                >
                                    <BadgeScale
                                        initial={{ scale: 0.72, rotate: -angle }}
                                        animate={{ scale: 1, rotate: -angle }}
                                        exit={{ scale: 0.72 }}
                                        transition={{ duration: 0.24, ease: "easeOut" }}
                                    >
                                        <PortraitConditionBadge color={marker.color} aria-hidden>
                                            {marker.label}
                                        </PortraitConditionBadge>
                                    </BadgeScale>
                                </ConditionArcPosition>
                            );
                        })}
                    </AnimatePresence>
                </ConditionMarkers>
            )}
            {number && <NumberBadge hasTurn={hasTurn}>{number}</NumberBadge>}
            {!character.properties.isPlayerCharacter && nameWithoutNumber && (
                <Name variant="body2" hasTurn={hasTurn}>
                    {nameWithoutNumber}
                </Name>
            )}
        </Background>
    );
}
const Name = styled(TextPlate, {
    shouldForwardProp: (prop) => prop !== "hasTurn",
})<{ hasTurn: boolean }>`
    position: absolute;
    bottom: -12px;
    text-align: center;
    z-index: 10;
    white-space: nowrap;
    font-size: clamp(0.75rem, 3.5vw, 1.25rem);
    padding-inline: 1.6rem;
    padding-block: 0.8rem;
    transition:
        opacity 0.3s ease,
        transform 0.3s ease;
    opacity: ${({ hasTurn }) => (hasTurn ? 1 : 0)};
    transform: translateY(${({ hasTurn }) => (hasTurn ? "0" : "8px")});
    pointer-events: ${({ hasTurn }) => (hasTurn ? "auto" : "none")};
`;

const NumberBadge = styled("span")<{ hasTurn: boolean }>`
    position: absolute;
    z-index: 10;
    font-size: clamp(1.5rem, 50%, 4rem);
    font-weight: bold;
    color: white;
    text-shadow:
        0 0 6px rgba(0, 0, 0, 0.8),
        0 2px 4px rgba(0, 0, 0, 0.6);
    pointer-events: none;
    transition:
        opacity 0.3s ease,
        transform 0.3s ease;
    opacity: 1;
    transform: scale(1);
`;

const Background = styled("div")`
    display: flex;
    align-items: center;
    justify-content: center;

    position: relative;
    border-radius: 100%;
    aspect-ratio: 1 / 1;
    overflow: visible;
`;

const TurnIndicatorStyled = styled(TurnIndicator)`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    clip-path: circle(38%);
`;

const ConditionParticlesStyled = styled(ConditionParticles)`
    position: absolute;
    inset: 8%;
    z-index: 3;
    overflow: hidden;
    border-radius: 50%;
    pointer-events: none;

    canvas {
        width: 100% !important;
        height: 100% !important;
    }
`;

const ConditionTint = styled("div", {
    shouldForwardProp: (prop) => prop !== "color",
})<{ color: string }>(({ color }) => ({
    position: "absolute",
    inset: "12%",
    zIndex: 2,
    borderRadius: "50%",
    pointerEvents: "none",
    boxShadow: `inset 0 0 22px 5px ${color}, 0 0 12px 2px ${color}`,
    background: `linear-gradient(145deg, ${color}38, transparent 55%)`,
}));

const ConditionMarkers = styled("div")`
    position: absolute;
    z-index: 12;
    inset: -3%;
    pointer-events: none;
`;

const ConditionArcPosition = styled(motion.div)`
    position: absolute;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    transform-origin: center;
`;

const BadgeScale = styled(motion.div)`
    display: flex;
    width: 32px;
    height: 32px;
    flex: 0 0 32px;
`;

const PortraitConditionBadge = styled(ConditionBadge)`
    width: 100%;
    height: 100%;
    margin-top: -4%;
`;
