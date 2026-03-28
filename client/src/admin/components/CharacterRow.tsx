import { CharacterPortraitPicker } from "../../character-portrait";
import {
    Box,
    Checkbox,
    FormControlLabel,
    IconButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { Character } from "../../store/tracker-store";
import HealthInput from "./HealthInput";
import { useState } from "react";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Visibility, VisibilityOff } from "@mui/icons-material";

interface Props {
    hasTurn: boolean;
    character: Character;
    onNameChange?: (name: string) => void;
    onHideNameChange?: (hideName: boolean) => void;
    onInitiativeChange?: (initiative: number) => void;
    onInitiativeSubmit?: () => void;
    onHealthChange?: (health: number) => void;
    onMaxHealthChange?: (maxHealth: number) => void;
    onPortraitImageChange?: (imageId: string | null) => void;
}

export default function CharacterRow({
    hasTurn,
    character,
    onNameChange,
    onHideNameChange,
    onInitiativeChange,
    onInitiativeSubmit,
    onHealthChange,
    onMaxHealthChange,
    onPortraitImageChange,
}: Props) {
    const isDraft = character.properties.name === "";

    const [contextMenu, setContextMenu] = useState<null | HTMLElement>(null);
    const isContextMenuOpen = Boolean(contextMenu);

    return (
        <Stack direction="row" alignItems="center" spacing={1}>
            {!isDraft && hasTurn && <span>🟢</span>}
            {!isDraft && !hasTurn && <span>🟡</span>}
            {isDraft && <span>⚪️</span>}

            <TextField
                size="small"
                value={character?.properties.name}
                onChange={(e) => onNameChange?.(e.target.value)}
                sx={{ mr: 1, flex: 1, minWidth: 0 }}
            />
            <TextField
                size="small"
                disabled={isDraft}
                value={character?.properties.initiative}
                onChange={(e) => {
                    const newValue = Number(e.target.value);
                    if (isNaN(newValue)) return;
                    return onInitiativeChange?.(newValue);
                }}
                onBlur={onInitiativeSubmit}
                onKeyUp={(e) => {
                    if (e.key === "Enter") {
                        onInitiativeSubmit?.();
                    }
                }}
                sx={{ mr: 1, width: 60 }}
            />
            <HealthInput
                disabled={isDraft}
                health={character?.properties.health}
                maxHealth={character?.properties.maxHealth}
                onHealthChange={onHealthChange}
                onMaxHealthChange={onMaxHealthChange}
            />
            <CharacterPortraitPicker
                disabled={isDraft}
                value={character?.properties.portraitImageId}
                onChange={onPortraitImageChange}
            />
            <IconButton
                id="context-menu-button"
                disabled={isDraft}
                tabIndex={-1}
                aria-controls={isContextMenuOpen ? "basic-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={isContextMenuOpen ? "true" : undefined}
                onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                    setContextMenu(event.currentTarget);
                }}
            >
                <MoreVertIcon />
            </IconButton>
            <Menu
                id="context-menu"
                anchorEl={contextMenu}
                open={isContextMenuOpen}
                onClose={() => {
                    setContextMenu(null);
                }}
                slotProps={{
                    list: {
                        "aria-labelledby": "context-menu-button",
                    },
                }}
            >
                <MenuItem onClick={() => onHideNameChange?.(!character.properties.hideName)}>
                    <ListItemIcon>
                        {character.properties.hideName ? <VisibilityOff /> : <Visibility />}
                    </ListItemIcon>
                    <ListItemText>
                        {character.properties.hideName ? "Show name" : "Hide name"}
                    </ListItemText>
                </MenuItem>
            </Menu>
        </Stack>
    );
}

export function CharacterRowHeader() {
    return (
        <Stack direction="row" alignItems="center" spacing={1}>
            <Box sx={{ width: 24 }} />
            <Typography variant="caption" sx={{ flex: 1, minWidth: 0, mr: 1 }}>
                Name
            </Typography>
            <Typography variant="caption" sx={{ width: 60, mr: 1, textAlign: "center" }}>
                INI
            </Typography>
            <Typography
                variant="caption"
                sx={{ maxWidth: 60, width: 60, mr: 1, textAlign: "center" }}
            >
                HP
            </Typography>
            <Typography
                variant="caption"
                sx={{ maxWidth: 60, width: 60, ml: 1, textAlign: "center" }}
            >
                Max HP
            </Typography>
            {/* Spacers for portrait picker and menu button columns */}
            <Box sx={{ width: 40 }} />
            <Box sx={{ width: 40 }} />
        </Stack>
    );
}
