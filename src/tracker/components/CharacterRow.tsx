import styled from "styled-components";
import { Character } from "../../store/tracker-store";
import CharacterAvatar from "./CharacterAvatar";

export interface Props {
  characters: Character[];
}

export default function CharacterRow({ characters }: Props) {
  return (
    <Container>
      {characters.map((character) => (
        <StyledCharacterAvatar key={character.id} character={character} />
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
