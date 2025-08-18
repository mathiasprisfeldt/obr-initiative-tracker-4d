import { styled } from "@mui/material";
import { PortraitImage } from "./portrait-image-picker-store";
import AvatarPlaceholder from "assets/avatar-placeholder.png";

interface Props {
  portraitImage?: PortraitImage | null;
}

function Content({ portraitImage, ...rest }: Props) {
  return (
    <img
      {...rest}
      src={portraitImage?.url || AvatarPlaceholder}
      alt={portraitImage?.displayName}
    />
  );
}

export const CharacterPortraitImageBase = styled(Content)`
  object-fit: cover;
  object-position: ${(props) => props.portraitImage?.position};
`;
