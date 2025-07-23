import { Character } from "../../store/tracker-store";
import HealthInput from "./HealthInput";

interface Props {
  hasTurn: boolean;
  character: Character;
  onNameChange?: (name: string) => void;
  onInitiativeChange?: (initiative: number) => void;
  onInitiativeSubmit?: () => void;
  onHealthChange?: (health: number) => void;
  onMaxHealthChange?: (maxHealth: number) => void;
}

export default function CharacterRow({
  hasTurn,
  character,
  onNameChange,
  onInitiativeChange,
  onInitiativeSubmit,
  onHealthChange,
  onMaxHealthChange,
}: Props) {
  const isDraft = character.properties.name === "";

  return (
    <div>
      <input
        type="text"
        placeholder="Name"
        value={character?.properties.name}
        onChange={(e) => onNameChange?.(e.target.value)}
      />
      <input
        type="number"
        placeholder="Initiative"
        disabled={isDraft}
        value={character?.properties.initiative}
        onChange={(e) => onInitiativeChange?.(Number(e.target.value))}
        onBlur={onInitiativeSubmit}
        onKeyUp={(e) => {
          if (e.key === "Enter") {
            onInitiativeSubmit?.();
          }
        }}
        min={1}
      />
      <HealthInput
        disabled={isDraft}
        health={character?.properties.health}
        maxHealth={character?.properties.maxHealth}
        onHealthChange={onHealthChange}
        onMaxHealthChange={onMaxHealthChange}
      />
      {hasTurn && !isDraft && <span>🟢</span>}
    </div>
  );
}
