import { styled } from "@mui/material";
import { Character } from "../../store/tracker-store";
import CharacterAvatar from "./CharacterAvatar";

export interface Props {
    characters: Character[];
    currentCharacter?: Character;
}

export default function CharacterRow({ characters, currentCharacter, ...rest }: Props) {
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
    max-height: 200px;
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
