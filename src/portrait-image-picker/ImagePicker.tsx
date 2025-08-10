import styled from "@emotion/styled";
import { Autocomplete, InputAdornment, TextField } from "@mui/material";
import {
  PortraitImage,
  usePortraitImagePickerStore,
} from "./portrait-image-picker-store";

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
                    src={value?.url.toString()}
                    alt={value?.displayName}
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
              src={option.url.toString()}
              alt={option.displayName}
            />
            {option.displayName}
          </li>
        );
      }}
    />
  );
}

const ImagePortait = styled.img`
  width: 50px;
  height: 50px;
  aspect-ratio: 1 / 1;
  margin-right: 10px;
  border-radius: 50%;
  object-fit: cover;
  object-position: center;
  border: 2px solid #ccc;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;
