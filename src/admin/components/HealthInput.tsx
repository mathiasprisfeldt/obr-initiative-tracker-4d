import { TextField } from "@mui/material";

export interface Props {
  disabled: boolean;
  health: number;
  maxHealth: number;
  onHealthChange?: (health: number) => void;
  onMaxHealthChange?: (maxHealth: number) => void;
}

export default function HealthInput({
  disabled,
  health,
  maxHealth,
  onHealthChange,
  onMaxHealthChange,
}: Props) {
  return (
    <>
      <TextField
        label="HP"
        size="small"
        disabled={disabled}
        value={health}
        onChange={(e) => {
          const newValue = Number(e.target.value);
          if (isNaN(newValue)) return;
          return onHealthChange?.(newValue);
        }}
        sx={{ maxWidth: 75, mr: 1 }}
      />
      <TextField
        label="Max HP"
        size="small"
        disabled={disabled}
        value={maxHealth}
        onChange={(e) => {
          const newValue = Number(e.target.value);
          if (isNaN(newValue)) return;
          return onMaxHealthChange?.(newValue);
        }}
        sx={{ maxWidth: 75, ml: 1 }}
      />
    </>
  );
}
