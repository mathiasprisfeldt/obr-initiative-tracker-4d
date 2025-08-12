import {
  Autocomplete,
  InputAdornment,
  styled,
  TextField,
  Typography,
} from "@mui/material";
import {
  PortraitImage,
  usePortraitImagePickerStore,
} from "./portrait-image-picker-store";
const AvatarPlaceholder = "/public/avatar-placeholder.png";

export interface Props {
  disabled: boolean;
  value: PortraitImage | null;
  onChange?: (image: PortraitImage | null) => void;
}

export function ImagePicker({ disabled, value, onChange }: Props) {
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
          slotProps={{
            input: {
              ...InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <ImagePortait
                    src={value?.url.toString() || AvatarPlaceholder}
                    alt={value?.displayName}
                    sx={{ width: 32 }}
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
            <ImagePortait
              src={option.url.toString() || AvatarPlaceholder}
              alt={option.displayName}
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

const ImagePortait = styled("img")`
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  object-fit: cover;
  object-position: center;
  border: 2px solid #ccc;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;
