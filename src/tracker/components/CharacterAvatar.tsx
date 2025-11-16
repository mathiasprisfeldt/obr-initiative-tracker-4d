import { Character } from "../../store/tracker-store";
import { styled } from "@mui/material";
import { PortraitImageWithPlaceholder } from "../../character-portrait/PortraitImageWithPlaceholder";
import { TextPlate } from "./TextPlate";
import TurnIndicator from "./TurnIndicator";

export interface Props {
    character: Character;
    hasTurn: boolean;
}

export default function CharacterAvatar({ character, hasTurn, ...rest }: Props) {
    return (
        <Background {...rest}>
            <PortraitImageWithPlaceholder
                portraitImage={character.properties.portraitImage}
                showBorder={true}
                portraitOverlay={<TurnIndicatorStyled id={character.id} hasTurn={hasTurn} />}
                style={{
                    width: "100%",
                    height: "100%",
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
