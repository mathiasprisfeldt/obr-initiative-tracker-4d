import {
    Box,
    Button,
    IconButton,
    InputAdornment,
    Slider,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import {
    DEFAULT_LAYOUT_SETTINGS,
    LAYOUT_SETTING_FIELDS,
    useLayoutSettingsStore,
} from "../../store/layout-settings-store";

export function LayoutSettingsPanel() {
    const { settings, setSetting, resetSetting, reset } = useLayoutSettingsStore();

    const isDefault = LAYOUT_SETTING_FIELDS.every(
        (field) => settings[field.key] === DEFAULT_LAYOUT_SETTINGS[field.key],
    );

    return (
        <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
                Tune the tracker layout to match your setup. Changes are saved on this device and
                apply to the tracker on the fly.
            </Typography>
            {LAYOUT_SETTING_FIELDS.map((field) => {
                const fieldIsDefault = settings[field.key] === DEFAULT_LAYOUT_SETTINGS[field.key];
                return (
                    <Box key={field.key}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="subtitle2">{field.label}</Typography>
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                                <TextField
                                    type="number"
                                    size="small"
                                    value={settings[field.key]}
                                    onChange={(event) => {
                                        const next = Number(event.target.value);
                                        if (!Number.isFinite(next)) return;
                                        setSetting(
                                            field.key,
                                            Math.min(field.max, Math.max(field.min, next)),
                                        );
                                    }}
                                    slotProps={{
                                        htmlInput: {
                                            min: field.min,
                                            max: field.max,
                                            step: field.step,
                                            "aria-label": `${field.label} value`,
                                        },
                                        input: {
                                            endAdornment: (
                                                <InputAdornment position="end">px</InputAdornment>
                                            ),
                                        },
                                    }}
                                    sx={{ width: 110 }}
                                />
                                <Tooltip title="Reset to default">
                                    <span>
                                        <IconButton
                                            size="small"
                                            onClick={() => resetSetting(field.key)}
                                            sx={{
                                                visibility: fieldIsDefault ? "hidden" : "visible",
                                            }}
                                            aria-label={`Reset ${field.label} to default`}
                                        >
                                            <RestartAltIcon fontSize="small" />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                            </Stack>
                        </Stack>
                        <Slider
                            value={settings[field.key]}
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            valueLabelDisplay="auto"
                            onChange={(_event, value) =>
                                setSetting(field.key, Array.isArray(value) ? value[0] : value)
                            }
                            aria-label={field.label}
                        />
                        <Typography variant="caption" color="text.secondary">
                            {field.description}
                        </Typography>
                    </Box>
                );
            })}
            <Button
                variant="outlined"
                color="secondary"
                startIcon={<RestartAltIcon />}
                onClick={reset}
                disabled={isDefault}
            >
                Reset to defaults
            </Button>
        </Stack>
    );
}
