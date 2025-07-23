import styled from "styled-components";

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
      <input
        type="number"
        placeholder="Health"
        disabled={disabled}
        value={health}
        onChange={(e) => onHealthChange?.(Number(e.target.value))}
      />
      /
      <input
        type="number"
        placeholder="Max Health"
        disabled={disabled}
        value={maxHealth}
        onChange={(e) => onMaxHealthChange?.(Number(e.target.value))}
      />
    </Container>
  );
}

const Container = styled.div<{ color?: string }>`
  color: var(--text-color);
`;
