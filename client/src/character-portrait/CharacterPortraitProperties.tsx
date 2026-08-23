import { Button, TableCell, TableRow, Tooltip, Typography } from "@mui/material";
import { PortraitImage } from "./portrait-image-picker-store";
import { CharacterPortraitThumbnail } from "./CharacterPortraitThumbnail";
import { MouseEventHandler } from "react";
import { ImagePositionInput } from "./ImagePositionInput";

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
        <TableRow
            key={portraitImage.url}
            sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
        >
            <TableCell>
                <Button onClick={onPortraitClicked} disabled={!portraitClickEnabled}>
                    <Tooltip title={portraitTooltip}>
                        <CharacterPortraitThumbnail
                            portraitImage={portraitImage}
                            showBorder={true}
                            sx={{ width: 100 }}
                        />
                    </Tooltip>
                </Button>
            </TableCell>
            <TableCell>
                <Typography>{portraitImage.displayName}</Typography>
            </TableCell>
            <TableCell>
                <ImagePositionInput
                    value={portraitImage.position}
                    onChange={onPositionChanged}
                />
            </TableCell>
        </TableRow>
    );
}
