import { Character } from "../../store/tracker-store";

interface Props {
  hasTurn: boolean;
  character?: Character;
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
  const isDraft = !character?.properties.name;

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
      <input
        type="number"
        placeholder="Health"
        disabled={isDraft}
        value={character?.properties.health}
        onChange={(e) => onHealthChange?.(Number(e.target.value))}
      />
      /
      <input
        type="number"
        placeholder="Max Health"
        disabled={isDraft}
        value={character?.properties.maxHealth}
        onChange={(e) => onMaxHealthChange?.(Number(e.target.value))}
      />
      {hasTurn && !isDraft && <span>🟢</span>}
    </div>
  );
}
