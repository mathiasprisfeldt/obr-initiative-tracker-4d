import styled from "styled-components";
import { Character } from "../../store/tracker-store";
import CharacterAvatar from "./CharacterAvatar";

export interface Props {
  characters: Character[];
  currentCharacter?: Character;
}

export default function CharacterRow({
  characters,
  currentCharacter,
  ...rest
}: Props) {
  return (
    <Container {...rest}>
      {characters.map((character) => (
        <StyledCharacterAvatar
          key={character.id}
          character={character}
          hasTurn={currentCharacter?.id === character.id}
        />
      ))}
    </Container>
  );
}

const StyledCharacterAvatar = styled(CharacterAvatar)`
  rotate: -90deg;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

function Preview() {
  const characters = [
    {
      id: "1",
      properties: {
        name: "Daggert Skyggestikker",
        health: 0,
        maxHealth: 0,
        imageUrl: "https://dnd.mathiasprisfeldt.me/img/Peter.png",
      },
    },
    {
      id: "2",
      properties: {
        name: "Alaeya",
        health: 0,
        maxHealth: 0,
        imageUrl: "https://dnd.mathiasprisfeldt.me/img/Vanessa.png",
      },
    },
    {
      id: "3",
      properties: {
        name: "Nadarr",
        health: 0,
        maxHealth: 0,
        imageUrl: "https://dnd.mathiasprisfeldt.me/img/Nicholai.png",
      },
    },
    {
      id: "4",
      properties: {
        name: "Wolf",
        health: 0,
        maxHealth: 0,
        imageUrl: "https://dnd.mathiasprisfeldt.me/img/Wolf.png",
      },
    },
  ];

  const currentCharacter = characters[0];

  return (
    <div style={{ width: "200px" }}>
      <CharacterRow
        characters={characters}
        currentCharacter={currentCharacter}
      />
    </div>
  );
}
