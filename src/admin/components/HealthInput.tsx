import styled from "styled-components";
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
  const healthPercentage = maxHealth > 0 ? (health / maxHealth) * 100 : 0;
  let color = "white";
  if (healthPercentage < 50) {
    color = "yellow";
  }
  if (healthPercentage < 25) {
    color = "red";
  }

  return (
    <Container color={color}>
      <TextField
        label="HP"
        type="number"
        size="small"
        disabled={disabled}
        value={health}
        onChange={(e) => onHealthChange?.(Number(e.target.value))}
        inputProps={{ min: 0 }}
        sx={{ width: 110, mr: 1 }}
      />
      /
      <TextField
        label="Max HP"
        type="number"
        size="small"
        disabled={disabled}
        value={maxHealth}
        onChange={(e) => onMaxHealthChange?.(Number(e.target.value))}
        inputProps={{ min: 0 }}
        sx={{ width: 110, ml: 1 }}
      />
    </Container>
  );
}

const Container = styled.div<{ color?: string }>`
  color: var(--text-color);
`;
