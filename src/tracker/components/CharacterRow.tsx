import { styled } from "@mui/material";
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
        <CharacterAvatarContainer key={character.id}>
          <StyledCharacterAvatar
            character={character}
            hasTurn={currentCharacter?.id === character.id}
          />
        </CharacterAvatarContainer>
      ))}
    </Container>
  );
}

const StyledCharacterAvatar = styled(CharacterAvatar)`
  rotate: -90deg;
  flex-shrink: 1;
`;

const CharacterAvatarContainer = styled("div")`
  display: flex;
  max-height: 150px;
  flex-grow: 1;
  justify-content: center;
`;

const Container = styled("div")`
  display: flex;
  flex-direction: column-reverse;
  gap: 16px;
  width: 100%;
  height: 100%;
  justify-content: center;
`;

function Preview() {
  const characters: Character[] = [
    {
      id: "1",
      properties: {
        name: "Daggert Skyggestikker",
        health: 0,
        maxHealth: 0,
        portraitImage: {
          displayName: "Daggert Skyggestikker",
          url: "https://dnd.mathiasprisfeldt.me/img/Peter.png",
        },
        hideName: true,
      },
    },
    {
      id: "2",
      properties: {
        name: "Alaeya",
        health: 0,
        maxHealth: 0,
        portraitImage: {
          displayName: "Alaeya",
          url: "https://dnd.mathiasprisfeldt.me/img/Vanessa.png",
        },
        hideName: true,
      },
    },
    {
      id: "3",
      properties: {
        name: "Nadarr",
        health: 0,
        maxHealth: 0,
        portraitImage: {
          displayName: "Nadarr",
          url: "https://dnd.mathiasprisfeldt.me/img/Nicholai.png",
        },
        hideName: true,
      },
    },
    {
      id: "4",
      properties: {
        name: "Wolf",
        health: 0,
        maxHealth: 0,
        portraitImage: {
          displayName: "Wolf",
          url: "https://dnd.mathiasprisfeldt.me/img/Wolf.png",
        },
        hideName: false,
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
