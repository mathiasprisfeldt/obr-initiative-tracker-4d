import styled from "@emotion/styled";
import {
  usePortraitImagePickerStore,
  PortraitImage,
} from "./portrait-image-picker-store";
import { Autocomplete, InputAdornment, TextField } from "@mui/material";

export interface Props {
  value?: PortraitImage;
  onChange?: (image: PortraitImage | undefined) => void;
}

export function ImagePicker({ value, onChange }: Props) {
  const {
    state: { images },
  } = usePortraitImagePickerStore();

  return (
    <Autocomplete
      disablePortal
      options={images}
      sx={{ width: 300 }}
      value={value}
      onChange={(_, newValue) => {
        onChange?.(newValue ?? undefined);
      }}
      getOptionKey={(option) => option.url.toString()}
      getOptionLabel={(option) => option.displayName}
      getOptionDisabled={(option) => !option.url}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Portrait"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <ImagePortait />
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
