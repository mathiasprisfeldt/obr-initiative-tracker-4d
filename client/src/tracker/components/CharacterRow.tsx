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
            {characters.map((character) => {
                const hasTurn = currentCharacter?.id === character.id;
                return (
                    <CharacterAvatarContainer key={character.id} hasTurn={hasTurn}>
                        <StyledCharacterAvatar character={character} hasTurn={hasTurn} />
                    </CharacterAvatarContainer>
                );
            })}
        </Container>
    );
}

const StyledCharacterAvatar = styled(CharacterAvatar)`
    rotate: -90deg;
    flex-shrink: 1;
`;

const CharacterAvatarContainer = styled("div")<{ hasTurn: boolean }>`
    display: flex;
    max-height: 200px;
    flex-grow: 1;
    justify-content: center;
    transition: transform 0.4s ease;
    transform: scale(${({ hasTurn }) => (hasTurn ? 1.25 : 1)});
`;

const Container = styled("div")`
    display: flex;
    flex-direction: column-reverse;
    gap: 16px;
    width: 100%;
    height: 100%;
    justify-content: center;
    overflow: hidden;
    padding: 16px 0;
    box-sizing: border-box;
`;
