import { Character } from "../../store/tracker-store";
import { PortraitImage } from "../../character-portrait";
import { keyframes, styled, Typography } from "@mui/material";
import { PortraitImageWithPlaceholder } from "../../character-portrait/PortraitImageWithPlaceholder";
import { TextPlate } from "./TextPlate";

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
                style={{
                    width: "100%",
                    height: "100%",
                }}
            />
            {hasTurn && <TurnIndicator>⚔️</TurnIndicator>}
            {!character.properties.hideName && (
                <Name variant="body2">{character.properties.name}</Name>
            )}
        </Background>
    );
}
const Name = styled(TextPlate)`
    position: absolute;
    bottom: 8px;
    text-align: center;
`;

const TurnIndcatorIdleAnimation = keyframes`
  0% {
    transform: translateX(0%);
  }

  3% {
    transform: translateX(-30px) rotate(-6deg);
  }

  6% {
    transform: translateX(15px) rotate(6deg);
  }

  9% {
    transform: translateX(-15px) rotate(-3.6deg);
  }

  12% {
    transform: translateX(9px) rotate(2.4deg);
  }

  15% {
    transform: translateX(-6px) rotate(-1.2deg);
  }

  18% {
    transform: translateX(0%);
  }
`;

const TurnIndicator = styled("div")({
    position: "absolute",
    bottom: -24,
    color: "initial",
    fontSize: "3em",
    animation: `${TurnIndcatorIdleAnimation} 5s ease-in-out infinite`,
    animationDelay: "1s",
    textShadow: "-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000",
});

const Background = styled("div")`
    display: flex;
    align-items: center;
    justify-content: center;

    border-radius: 100%;
    aspect-ratio: 1 / 1;
`;
