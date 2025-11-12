import { TableCell, TableRow, TextField, Typography } from "@mui/material";
import { PortraitImage } from "./portrait-image-picker-store";
import { CharacterPortraitThumbnail } from "./CharacterPortraitThumbnail";
import { MouseEventHandler } from "react";

interface Props {
    portraitImage: PortraitImage;
    onPositionChanged?: (position: string) => void;
    onPortraitClicked?: MouseEventHandler<HTMLDivElement>;
}

export function CharacterPortraitProperties({
    portraitImage,
    onPositionChanged,
    onPortraitClicked,
}: Props) {
    return (
        <TableRow>
            <TableCell>
                <CharacterPortraitThumbnail
                    portraitImage={portraitImage}
                    showBorder={true}
                    sx={{ width: 100 }}
                    onClick={onPortraitClicked}
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
