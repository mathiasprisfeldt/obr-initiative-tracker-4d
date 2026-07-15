import { Box, Button, Slider, Stack, Typography } from "@mui/material";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import {
    DEFAULT_LAYOUT_SETTINGS,
    LAYOUT_SETTING_FIELDS,
    useLayoutSettingsStore,
} from "../../store/layout-settings-store";

export function LayoutSettingsPanel() {
    const { settings, setSetting, reset } = useLayoutSettingsStore();

    const isDefault = LAYOUT_SETTING_FIELDS.every(
        (field) => settings[field.key] === DEFAULT_LAYOUT_SETTINGS[field.key],
    );

    return (
        <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
                Tune the tracker layout to match your setup. Changes are saved on this device and
                apply to the tracker on the fly.
            </Typography>
            {LAYOUT_SETTING_FIELDS.map((field) => (
                <Box key={field.key}>
                    <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                        <Typography variant="subtitle2">{field.label}</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {settings[field.key]}px
                        </Typography>
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
            ))}
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
