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
            {!character.properties.hideName && (
                <Name variant="body2">{character.properties.name}</Name>
            )}
        </Background>
    );
}
const Name = styled(TextPlate)`
    position: absolute;
    bottom: 4px;
    text-align: center;
    z-index: 10;
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
