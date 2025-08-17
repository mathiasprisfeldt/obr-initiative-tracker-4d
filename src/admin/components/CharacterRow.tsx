import { PortraitImage, ImagePicker } from "../../portrait-image-picker";
import { Stack, TextField } from "@mui/material";
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
  onPortraitImageChange?: (image: PortraitImage | null) => void;
}

export default function CharacterRow({
  hasTurn,
  character,
  onNameChange,
  onInitiativeChange,
  onInitiativeSubmit,
  onHealthChange,
  onMaxHealthChange,
  onPortraitImageChange,
}: Props) {
  const isDraft = character.properties.name === "";

  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      {hasTurn && !isDraft && <span>🟢</span>}
      {hasTurn && isDraft && <span>🟡</span>}
      {!hasTurn && <span>⚪️</span>}

      <TextField
        label="Name"
        size="small"
        value={character?.properties.name}
        onChange={(e) => onNameChange?.(e.target.value)}
        sx={{ mr: 1, width: 200 }}
      />
      <TextField
        label="Initiative"
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
        sx={{ mr: 1, width: 130 }}
      />
      <HealthInput
        disabled={isDraft}
        health={character?.properties.health}
        maxHealth={character?.properties.maxHealth}
        onHealthChange={onHealthChange}
        onMaxHealthChange={onMaxHealthChange}
      />
      <ImagePicker
        disabled={isDraft}
        value={character?.properties.portraitImage}
        onChange={onPortraitImageChange}
      />
    </Stack>
  );
}
