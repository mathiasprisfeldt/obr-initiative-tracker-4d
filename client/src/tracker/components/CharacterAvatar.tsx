import { Character } from "../../store/tracker-store";
import { styled } from "@mui/material";
import { PortraitImageWithPlaceholder } from "../../character-portrait/PortraitImageWithPlaceholder";
import { usePortraitImage } from "../../character-portrait";
import { TextPlate } from "./TextPlate";
import TurnIndicator from "./TurnIndicator";
import { useEffect, useState } from "react";
import { paletteFromImageElement } from "../../utils/palette";

export interface Props {
    character: Character;
    hasTurn: boolean;
}

export default function CharacterAvatar({ character, hasTurn, ...rest }: Props) {
    const portraitImage = usePortraitImage(character.properties.portraitImageId);
    const [portraitImageEl, setPortraitImageEl] = useState<HTMLImageElement | undefined>(undefined);
    const [portraitPalette, setPortraitPalette] = useState<string[] | undefined>(undefined);

    useEffect(() => {
        if (!portraitImageEl) return;
        let ignore = false;

        (async () => {
            const palette = await paletteFromImageElement(portraitImageEl);

            if (ignore) return;
            setPortraitPalette(palette);
        })();

        return () => {
            ignore = true;
        };
    }, [portraitImageEl]);

    const name = character.properties.name;
    const number = name.match(/\d+/)?.[0];
    const nameWithoutNumber = name.replace(/\d+/, "").trim();

    return (
        <Background {...rest}>
            <PortraitImageWithPlaceholder
                portraitImage={portraitImage}
                showBorder={true}
                portraitOverlay={
                    <TurnIndicatorStyled
                        id={character.id}
                        hasTurn={hasTurn}
                        palette={portraitPalette}
                    />
                }
                style={{
                    width: "100%",
                    height: "100%",
                }}
                onImageLoad={(event) => {
                    setPortraitImageEl(event);
                }}
            />
            {number && <NumberBadge hasTurn={hasTurn}>{number}</NumberBadge>}
            {!character.properties.hideName && nameWithoutNumber && (
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
