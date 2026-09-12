import { CharacterPortraitPicker } from "../../../character-portrait";
import {
    Autocomplete,
    Badge,
    Box,
    Button,
    IconButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Popover,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import { Character } from "../../../store/tracker-store";
import HealthInput from "./HealthInput";
import { useEffect, useRef, useState } from "react";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import {
    Circle,
    Delete,
    Favorite,
    LocalFireDepartment,
    PersonAddAlt1,
    SmartToy,
    Healing,
} from "@mui/icons-material";
import { DND_CONDITIONS } from "../../../tracker/conditions";

interface Props {
    hasTurn: boolean;
    combatTrackingEnabled: boolean;
    character: Character;
    inEncounter?: boolean;
    portraitNames: string[];
    onNameChange?: (name: string) => void;
    onNameAndPortraitChange?: (name: string, portraitImageId: string) => void;
    onPlayerCharacterChange?: (isPlayerCharacter: boolean) => void;
    onInitiativeChange?: (initiative: number) => void;
    onInitiativeSubmit?: () => void;
    onHealthChange?: (health: number) => void;
    onMaxHealthChange?: (maxHealth: number) => void;
    onDamageTaken?: (amount: number) => void;
    onKillingBlow?: () => void;
    onHealingReceived?: (amount: number) => void;
    onRevive?: () => void;
    onPortraitImageChange?: (imageId: string | null) => void;
    onConditionsChange?: (conditions: string[]) => void;
    onDelete?: () => void;
    onEncounterParticipationToggle?: () => void;
}

export default function CharacterRow({
    hasTurn,
    combatTrackingEnabled,
    character,
    inEncounter = true,
    portraitNames,
    onNameChange,
    onNameAndPortraitChange,
    onPlayerCharacterChange,
    onInitiativeChange,
    onInitiativeSubmit,
    onHealthChange,
    onMaxHealthChange,
    onDamageTaken,
    onKillingBlow,
    onHealingReceived,
    onRevive,
    onPortraitImageChange,
    onConditionsChange,
    onDelete,
    onEncounterParticipationToggle,
}: Props) {
    const isDraft = character.properties.name === "";
    const [draftName, setDraftName] = useState(character.properties.name);
    const selectedPortraitNameRef = useRef<string | null>(null);
    const submittedNameRef = useRef<string | null>(null);
    const initiativeInputRef = useRef<HTMLInputElement>(null);

    const [contextMenu, setContextMenu] = useState<null | HTMLElement>(null);
    const isContextMenuOpen = Boolean(contextMenu);
    const [deleteHovered, setDeleteHovered] = useState(false);
    const [conditionsAnchor, setConditionsAnchor] = useState<HTMLElement | null>(null);
    const [conditionInput, setConditionInput] = useState("");

    const togglesEncounterParticipation = Boolean(
        character.properties.isPlayerCharacter && onEncounterParticipationToggle,
    );
    const turnColor = isDraft || !inEncounter ? "disabled" : hasTurn ? "success" : "warning";
    const conditions = character.properties.conditions ?? [];
    const optionsTooltip = conditions.join(", ");

    useEffect(() => {
        setDraftName(character.properties.name);
        if (submittedNameRef.current === character.properties.name) {
            submittedNameRef.current = null;
        }
    }, [character.properties.name]);

    const submitName = () => {
        if (submittedNameRef.current === draftName) {
            submittedNameRef.current = null;
            return;
        }
        if (selectedPortraitNameRef.current === draftName) {
            selectedPortraitNameRef.current = null;
            return;
        }
        if (draftName !== character.properties.name) onNameChange?.(draftName);
    };

    return (
        <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            onKeyDownCapture={(event) => {
                const input = event.target as HTMLInputElement;
                if (
                    event.key !== "Tab" ||
                    event.shiftKey ||
                    input.dataset.field !== "character-name"
                ) {
                    return;
                }
                event.preventDefault();
                event.stopPropagation();
                if (input.value !== character.properties.name) {
                    submittedNameRef.current = input.value;
                    onNameChange?.(input.value);
                }
                input.blur();
                setTimeout(() => initiativeInputRef.current?.focus());
            }}
        >
            <IconButton
                size="small"
                disabled={isDraft}
                aria-label={
                    togglesEncounterParticipation
                        ? `${inEncounter ? "Remove" : "Add"} ${character.properties.name} ${
                              inEncounter ? "from" : "to"
                          } encounter`
                        : `Delete ${character.properties.name}`
                }
                onMouseEnter={() => {
                    if (!togglesEncounterParticipation) setDeleteHovered(true);
                }}
                onMouseLeave={() => setDeleteHovered(false)}
                onClick={
                    togglesEncounterParticipation ? onEncounterParticipationToggle : onDelete
                }
                sx={{ width: 24, height: 24, p: 0 }}
            >
                {deleteHovered && !isDraft && !togglesEncounterParticipation ? (
                    <Delete fontSize="small" color="error" />
                ) : (
                    <Circle fontSize="small" color={turnColor} />
                )}
            </IconButton>

            <Autocomplete
                freeSolo
                options={portraitNames}
                inputValue={draftName}
                value={null}
                onInputChange={(_event, value, reason) => {
                    setDraftName(value);
                    if (reason === "input") selectedPortraitNameRef.current = null;
                }}
                onChange={(_event, value) => {
                    if (typeof value !== "string" || !value) return;
                    selectedPortraitNameRef.current = value;
                    setDraftName(value);
                    onNameAndPortraitChange?.(value, value);
                }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        size="small"
                        inputProps={{
                            ...params.inputProps,
                            "data-field": "character-name",
                        }}
                        onBlur={submitName}
                        onKeyDownCapture={(event) => {
                            if (event.key === "Enter" && !event.defaultPrevented) {
                                event.currentTarget.blur();
                                setTimeout(() => initiativeInputRef.current?.focus());
                            } else if (event.key === "Escape") {
                                setDraftName(character.properties.name);
                                event.currentTarget.blur();
                            }
                        }}
                    />
                )}
                sx={{ mr: 1, flex: 1, minWidth: 0 }}
            />
            <TextField
                size="small"
                disabled={isDraft || !inEncounter}
                value={character?.properties.initiative}
                inputRef={initiativeInputRef}
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
            {character.properties.isPlayerCharacter ? (
                <>
                    <ActionField
                        label="Damage"
                        disabled={!combatTrackingEnabled}
                        onSubmit={onDamageTaken}
                        onKillingBlow={onKillingBlow}
                    />
                    <ActionField
                        label="Healing"
                        disabled={!combatTrackingEnabled}
                        onSubmit={onHealingReceived}
                        onRevive={onRevive}
                    />
                </>
            ) : (
                <HealthInput
                    disabled={isDraft}
                    health={character?.properties.health}
                    maxHealth={character?.properties.maxHealth}
                    onHealthChange={onHealthChange}
                    onMaxHealthChange={onMaxHealthChange}
                />
            )}
            <CharacterPortraitPicker
                disabled={isDraft}
                value={character?.properties.portraitImageId}
                onChange={onPortraitImageChange}
            />
            <Popover
                open={Boolean(conditionsAnchor)}
                anchorEl={conditionsAnchor}
                onClose={() => setConditionsAnchor(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                slotProps={{
                    paper: {
                        sx: { maxHeight: "calc(100vh - 32px)", overflowY: "auto" },
                    },
                }}
            >
                <Stack spacing={1} sx={{ p: 2, width: 360, maxWidth: "calc(100vw - 32px)" }}>
                    <Autocomplete
                        multiple
                        freeSolo
                        disableCloseOnSelect
                        options={[...DND_CONDITIONS]}
                        value={character.properties.conditions ?? []}
                        inputValue={conditionInput}
                        onInputChange={(_event, value) => setConditionInput(value)}
                        onChange={(_event, values) => {
                            onConditionsChange?.(normalizeConditions(values));
                            setConditionInput("");
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                autoFocus
                                label="Conditions"
                                placeholder="Select or type a condition"
                                onKeyDown={(event) => {
                                    if (event.key !== "Enter" || !conditionInput.trim()) return;
                                    event.preventDefault();
                                    onConditionsChange?.(
                                        normalizeConditions([
                                            ...(character.properties.conditions ?? []),
                                            conditionInput,
                                        ]),
                                    );
                                    setConditionInput("");
                                }}
                            />
                        )}
                    />
                </Stack>
            </Popover>
            <Tooltip
                title={optionsTooltip}
                placement="top"
                arrow
                disableFocusListener
                disableInteractive
            >
                <Box component="span" sx={{ display: "inline-flex" }}>
                <IconButton
                    id="context-menu-button"
                    disabled={isDraft}
                    tabIndex={-1}
                    aria-label={`More actions for ${character.properties.name}`}
                    aria-controls={isContextMenuOpen ? "basic-menu" : undefined}
                    aria-haspopup="true"
                    aria-expanded={isContextMenuOpen ? "true" : undefined}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                        setContextMenu(event.currentTarget);
                    }}
                >
                    <Badge color="secondary" badgeContent={conditions.length}>
                        <MoreVertIcon />
                    </Badge>
                </IconButton>
                </Box>
            </Tooltip>
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
                <MenuItem
                    onClick={() => {
                        onPlayerCharacterChange?.(!character.properties.isPlayerCharacter);
                        setContextMenu(null);
                    }}
                >
                    <ListItemIcon>
                        {character.properties.isPlayerCharacter ? <SmartToy /> : <PersonAddAlt1 />}
                    </ListItemIcon>
                    <ListItemText>
                        {character.properties.isPlayerCharacter
                            ? "Mark as non-player character"
                            : "Mark as player character"}
                    </ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        setConditionsAnchor(contextMenu);
                        setContextMenu(null);
                    }}
                >
                    <ListItemIcon>
                        <Healing />
                    </ListItemIcon>
                    <ListItemText
                        primary="Conditions"
                        secondary={
                            character.properties.conditions?.length
                                ? `${character.properties.conditions.length} active`
                                : undefined
                        }
                    />
                </MenuItem>
            </Menu>
        </Stack>
    );
}

function normalizeConditions(conditions: string[]): string[] {
    const normalized = conditions
        .map((condition) => {
            const trimmed = condition.trim();
            return (
                DND_CONDITIONS.find(
                    (knownCondition) => knownCondition.toLowerCase() === trimmed.toLowerCase(),
                ) ?? trimmed
            );
        })
        .filter(Boolean);
    return normalized.filter(
        (condition, index) =>
            normalized.findIndex((candidate) => candidate.toLowerCase() === condition.toLowerCase()) ===
            index,
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

function ActionField({
    label,
    disabled,
    onSubmit,
    onKillingBlow,
    onRevive,
}: {
    label: string;
    disabled: boolean;
    onSubmit?: (amount: number) => void;
    onKillingBlow?: () => void;
    onRevive?: () => void;
}) {
    const [value, setValue] = useState("");
    const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);
    const amountInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!anchorElement) return;
        const focusTimer = window.setTimeout(() => amountInputRef.current?.focus());
        return () => window.clearTimeout(focusTimer);
    }, [anchorElement]);

    const submit = () => {
        const amount = Number(value);
        if (!Number.isFinite(amount) || amount <= 0) return;
        onSubmit?.(amount);
        setValue("");
        setAnchorElement(null);
    };

    return (
        <>
            <Tooltip title={label}>
                <span>
                    <Button
                        size="small"
                        variant="outlined"
                        color={label === "Damage" ? "error" : "success"}
                        aria-label={label}
                        disabled={disabled}
                        onClick={(event) => setAnchorElement(event.currentTarget)}
                        sx={{ width: 60, minWidth: 60, height: 40 }}
                    >
                        {label === "Damage" ? <LocalFireDepartment /> : <Favorite />}
                    </Button>
                </span>
            </Tooltip>
            <Popover
                open={Boolean(anchorElement)}
                anchorEl={anchorElement}
                onClose={() => {
                    setAnchorElement(null);
                    setValue("");
                }}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                transformOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Stack
                    component="form"
                    sx={{ p: 1.5 }}
                    onSubmit={(event) => {
                        event.preventDefault();
                        submit();
                    }}
                >
                    <TextField
                        inputRef={amountInputRef}
                        size="small"
                        value={value}
                        label={`${label} amount`}
                        inputProps={{ inputMode: "numeric" }}
                        onChange={(event) => setValue(event.target.value)}
                        sx={{ width: 120 }}
                    />
                    {onRevive && (
                        <Button
                            type="button"
                            color="success"
                            onClick={() => {
                                onRevive();
                                setValue("");
                                setAnchorElement(null);
                            }}
                            sx={{ mt: 1 }}
                        >
                            Revive
                        </Button>
                    )}
                    {onKillingBlow && (
                        <Button
                            type="button"
                            color="error"
                            onClick={() => {
                                onKillingBlow();
                                setValue("");
                                setAnchorElement(null);
                            }}
                            sx={{ mt: 1 }}
                        >
                            Killing blow
                        </Button>
                    )}
                </Stack>
            </Popover>
        </>
    );
}
