import { styled } from "@mui/material";
import { CharacterPortraitImageBase } from "./CharacterPortraitImageBase";

export const CharacterPortraitThumbnail = styled(CharacterPortraitImageBase)`
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  border: 2px solid #ccc;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;
