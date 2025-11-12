import { Button, TableCell, TableRow, TextField, Tooltip, Typography } from "@mui/material";
import { PortraitImage } from "./portrait-image-picker-store";
import { CharacterPortraitThumbnail } from "./CharacterPortraitThumbnail";
import { MouseEventHandler } from "react";

interface Props {
    portraitImage: PortraitImage;
    portraitTooltip?: string;
    portraitClickEnabled?: boolean;
    onPositionChanged?: (position: string) => void;
    onPortraitClicked?: MouseEventHandler<HTMLButtonElement>;
}

export function CharacterPortraitProperties({
    portraitImage,
    portraitTooltip,
    portraitClickEnabled,
    onPositionChanged,
    onPortraitClicked,
}: Props) {
    return (
        <TableRow>
            <TableCell>
                <Tooltip title={portraitTooltip}>
                    <Button onClick={onPortraitClicked} disabled={!portraitClickEnabled}>
                        <CharacterPortraitThumbnail
                            portraitImage={portraitImage}
                            showBorder={true}
                            sx={{ width: 100 }}
                        />
                    </Button>
                </Tooltip>
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
