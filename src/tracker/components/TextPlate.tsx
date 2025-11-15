import { styled, Typography, TypographyProps } from "@mui/material";
import background from "assets/metallic-9-slice.png";

export function TextPlate({ children, ...rest }: TypographyProps) {
    return (
        <Base {...rest} color="white">
            {children}
        </Base>
    );
}

const Base = styled(Typography)`
    border-image: url(${background}) 206 264 210 270 fill / 206px 264px 210px 270px;
    border-image-repeat: round;
    padding-inline: 1.6rem;
    padding-block: 1rem;
`;

function Preview() {
    return <TextPlate />;
}
