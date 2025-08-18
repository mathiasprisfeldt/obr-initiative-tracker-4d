import AvatarPlaceholder from "assets/avatar-placeholder.png";
import {
  Autocomplete,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import {
  PortraitImage,
  usePortraitImagePickerStore,
} from "./portrait-image-picker-store";
import { CharacterPortraitThumbnail } from "./CharacterPortraitThumbnail";

export interface Props {
  disabled: boolean;
  value: PortraitImage | null;
  onChange?: (image: PortraitImage | null) => void;
}

export function CharacterPortraitPicker({ disabled, value, onChange }: Props) {
  const {
    state: { images },
  } = usePortraitImagePickerStore();

  return (
    <Autocomplete
      disabled={disabled}
      disablePortal
      options={images}
      sx={{ width: 300 }}
      value={value}
      onChange={(_, newValue) => {
        onChange?.(newValue);
      }}
      getOptionKey={(option) => option.url.toString()}
      getOptionLabel={(option) => option.displayName}
      getOptionDisabled={(option) => !option.url}
      renderInput={({ InputProps, ...rest }) => (
        <TextField
          {...rest}
          label="Portrait"
          size="small"
          slotProps={{
            input: {
              ...InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <CharacterPortraitThumbnail
                    portraitImage={value}
                    sx={{ width: 24 }}
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
              sx={{ mr: 1, width: 52 }}
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
