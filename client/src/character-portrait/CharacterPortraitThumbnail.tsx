import { styled } from "@mui/material";
import { PortraitImageWithPlaceholder } from "./PortraitImageWithPlaceholder";

export const CharacterPortraitThumbnail = styled(PortraitImageWithPlaceholder)`
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  border: 2px solid #ccc;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;
