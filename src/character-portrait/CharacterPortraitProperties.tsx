import { TableCell, TableRow, TextField, Typography } from "@mui/material";
import { PortraitImage } from "./portrait-image-picker-store";
import { CharacterPortraitThumbnail } from "./CharacterPortraitThumbnail";

interface Props {
  portraitImage: PortraitImage;
  onPositionChanged?: (position: string) => void;
}

export function CharacterPortraitProperties({
  portraitImage,
  onPositionChanged,
}: Props) {
  return (
    <TableRow>
      <TableCell>
        <CharacterPortraitThumbnail
          portraitImage={portraitImage}
          sx={{ width: 64 }}
        />
      </TableCell>
      <TableCell>
        <Typography>{portraitImage.displayName}</Typography>
      </TableCell>
      <TableCell>
        <TextField
          label="Position"
          value={portraitImage.position}
          onChange={(e) => onPositionChanged?.(e.target.value)}
        />
      </TableCell>
    </TableRow>
  );
}
