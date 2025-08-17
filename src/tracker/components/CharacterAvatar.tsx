import styled from "styled-components";
import { Character } from "../../store/tracker-store";

export interface Props {
  character: Character;
  hasTurn: boolean;
}

export default function CharacterAvatar({
  character,
  hasTurn,
  ...rest
}: Props) {
  return (
    <Background
      {...rest}
      hasTurn={hasTurn}
      imageUrl={character.properties.portraitImage?.url.toString()}
    >
      {!character.properties.portraitImage && (
        <h3>{character.properties.name}</h3>
      )}
    </Background>
  );
}

const Background = styled.div<{
  hasTurn: boolean;
  imageUrl: string | undefined;
}>`
  display: flex;
  align-items: center;
  justify-content: center;

  box-shadow: 0px -10px 60px black inset;
  background-color: #f0f0f0;
  border-radius: 100%;
  aspect-ratio: 1 / 1;
  padding: 16px;

  border: ${(props) => (props.hasTurn ? "6px solid #007bff" : "none")};

  background-image: url(${(props) => props.imageUrl});
  background-size: cover;
  background-repeat: no-repeat;
  background-position: top;
`;
