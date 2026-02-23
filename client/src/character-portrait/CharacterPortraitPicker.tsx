import {
    Autocomplete,
    Box,
    InputAdornment,
    Paper,
    type PaperProps,
    TextField,
    Typography,
} from "@mui/material";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import { PortraitImage, usePortraitImagePickerStore } from "./portrait-image-picker-store";
import { CharacterPortraitThumbnail } from "./CharacterPortraitThumbnail";
import { useState, useRef, useMemo, forwardRef, MouseEventHandler } from "react";

export interface Props {
    disabled: boolean;
    value: PortraitImage | null;
    onChange?: (image: PortraitImage | null) => void;
}

export function CharacterPortraitPicker({ disabled, value, onChange }: Props) {
    const {
        state: { images },
    } = usePortraitImagePickerStore();

    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const searchInputRef = useRef<HTMLInputElement | null>(null);
    const hiddenInputRef = useRef<HTMLInputElement | null>(null);
    const pickerIconSize = 32;

    const DropdownPaper = useMemo(
        () =>
            forwardRef<HTMLDivElement, PaperProps>(function DropdownPaper(
                { children, ...paperProps },
                ref,
            ) {
                const { onMouseDown: _omitOnMouseDown, ...restPaperProps } =
                    paperProps as PaperProps & {
                        onMouseDown?: MouseEventHandler<HTMLDivElement>;
                    };

                return (
                    <ClickAwayListener
                        onClickAway={() => {
                            setOpen(false);
                        }}
                    >
                        <Paper {...restPaperProps} ref={ref}>
                            <Box
                                sx={{
                                    position: "sticky",
                                    top: 0,
                                    zIndex: 10,
                                    bgcolor: "background.paper",
                                    borderBottom: 1,
                                    borderColor: "divider",
                                    p: 1,
                                }}
                            >
                                <TextField
                                    autoFocus
                                    fullWidth
                                    size="small"
                                    placeholder="Search portraits"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    inputRef={searchInputRef}
                                    onKeyDown={(e) => {
                                        const keysToForward = new Set([
                                            "ArrowDown",
                                            "ArrowUp",
                                            "Home",
                                            "End",
                                            "PageDown",
                                            "PageUp",
                                            "Enter",
                                        ]);
                                        if (keysToForward.has(e.key)) {
                                            e.preventDefault();
                                            const target = hiddenInputRef.current;
                                            if (target) {
                                                const ev = new KeyboardEvent("keydown", {
                                                    key: e.key,
                                                    bubbles: true,
                                                    cancelable: true,
                                                });
                                                target.dispatchEvent(ev);
                                            }
                                        }
                                        if (e.key === "Escape") {
                                            e.preventDefault();
                                            setOpen(false);
                                            (e.currentTarget as HTMLInputElement).blur();
                                        }
                                    }}
                                    onMouseDown={(e) => {
                                        e.stopPropagation();
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                    }}
                                    onBlur={(e) => {
                                        setOpen(false);
                                    }}
                                />
                            </Box>
                            {children}
                        </Paper>
                    </ClickAwayListener>
                );
            }),
        [inputValue],
    );

    return (
        <Autocomplete
            disabled={disabled}
            disablePortal
            options={images}
            sx={{ width: pickerIconSize }}
            value={value ?? { displayName: "", url: "" }}
            open={open}
            onOpen={() => {
                setOpen(true);
                setTimeout(() => searchInputRef.current?.focus(), 0);
            }}
            onClose={(_, reason) => {
                // Keep open on blur so the search input can take focus
                if (reason !== "blur") setOpen(false);
            }}
            onChange={(_, newValue) => {
                onChange?.(newValue);
            }}
            blurOnSelect={false}
            autoHighlight={false}
            disableClearable
            forcePopupIcon={false}
            isOptionEqualToValue={(option, v) => option.url === v?.url}
            filterOptions={(options) => {
                const q = inputValue.trim().toLowerCase();
                if (!q) return options;
                return options.filter((opt) => (opt.displayName ?? "").toLowerCase().includes(q));
            }}
            slots={{
                paper: DropdownPaper,
            }}
            slotProps={{
                popper: {
                    sx: { width: "fit-content !important", maxWidth: 500 },
                },
            }}
            getOptionKey={(option) => option.url.toString()}
            getOptionLabel={(option) => option.displayName}
            getOptionDisabled={(option) => !option.url}
            renderInput={({ InputProps, ...rest }) => (
                <TextField
                    {...rest}
                    disabled={disabled}
                    label=""
                    inputRef={hiddenInputRef}
                    sx={{
                        p: 0,
                        minWidth: 0,
                        "& .MuiInputBase-root": {
                            p: 0,
                            height: pickerIconSize,
                        },
                        "& .MuiInputAdornment-root": {
                            m: 0,
                            height: "100%",
                            maxHeight: "100%",
                        },
                    }}
                    slotProps={{
                        input: {
                            ...InputProps,
                            disabled: disabled,
                            endAdornment: null,
                            sx: {
                                p: 0,
                                minHeight: "auto",
                                "& .MuiOutlinedInput-notchedOutline": { display: "none" },
                                "& .MuiInputBase-input": {
                                    position: "absolute",
                                    opacity: 0,
                                    width: 1,
                                    height: 1,
                                    padding: 0,
                                    margin: 0,
                                    border: 0,
                                    left: -10000,
                                    top: "auto",
                                    overflow: "hidden",
                                },
                            },
                            startAdornment: (
                                <InputAdornment
                                    position="start"
                                    disablePointerEvents={false}
                                    sx={{ m: 0 }}
                                >
                                    <CharacterPortraitThumbnail
                                        portraitImage={value}
                                        showBorder={false}
                                        aria-disabled={disabled}
                                        sx={{
                                            width: "100%",
                                            cursor: disabled ? "default" : "pointer",
                                            outline: "none",
                                            borderColor: open ? "primary.main" : undefined,
                                            boxShadow: open
                                                ? (theme) =>
                                                      `0 0 0 2px ${theme.palette.primary.main}33`
                                                : "none",
                                            "&:focus-visible": {
                                                borderColor: "primary.main",
                                                boxShadow: (theme) =>
                                                    `0 0 0 2px ${theme.palette.primary.main}33`,
                                            },
                                        }}
                                        onClick={() => {
                                            if (disabled) return;
                                            setOpen((prev) => !prev);
                                            setTimeout(() => searchInputRef.current?.focus(), 0);
                                        }}
                                        tabIndex={disabled ? undefined : 0}
                                        onFocus={() => {
                                            if (disabled) return;
                                            setOpen(true);
                                            setTimeout(() => searchInputRef.current?.focus(), 0);
                                        }}
                                    />
                                </InputAdornment>
                            ),
                        },
                    }}
                />
            )}
            renderOption={({ key, ...rest }, option) => {
                return (
                    <li key={key} {...rest}>
                        <CharacterPortraitThumbnail
                            portraitImage={option}
                            showBorder={false}
                            sx={{ mr: 1, width: 24 }}
                        />
                        <Typography
                            sx={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {option.displayName}
                        </Typography>
                    </li>
                );
            }}
        />
    );
}
