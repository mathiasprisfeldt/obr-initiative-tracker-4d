import { Character } from "../../store/tracker-store";
import { PortraitImage } from "../../character-portrait";
import { keyframes, styled, Typography } from "@mui/material";

export interface Props {
    character: Character;
    hasTurn: boolean;
}

export default function CharacterAvatar({ character, hasTurn, ...rest }: Props) {
    return (
        <Background {...rest} portraitImage={character.properties.portraitImage}>
            {hasTurn && <TurnIndicator>⚔️</TurnIndicator>}
            {!character.properties.hideName && (
                <Name variant="body2" sx={{ p: 1 }}>
                    {character.properties.name}
                </Name>
            )}
        </Background>
    );
}
const Name = styled(Typography)({
    position: "absolute",
    bottom: -16,
    color: "white",
    background: "gray",
    borderRadius: "16px",
    border: "2px solid white",
    textAlign: "center",
});

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

const Background = styled("div")<{
    portraitImage: PortraitImage | null;
}>`
    display: flex;
    align-items: center;
    justify-content: center;

    background-color: #f0f0f0;
    border-radius: 100%;
    aspect-ratio: 1 / 1;
    padding: 16px;

    background-image: url("${(props) => props.portraitImage?.url}");
    background-size: cover;
    background-repeat: no-repeat;
    background-position: ${(props) => props.portraitImage?.position || "center"};
`;
