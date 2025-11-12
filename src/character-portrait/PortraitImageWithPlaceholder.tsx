import { useEffect, useRef, useState, type HTMLAttributes } from "react";
import { css, styled } from "@mui/material";
import { PortraitImage, usePortraitImagePickerStore } from "./portrait-image-picker-store";
import AvatarPlaceholder from "assets/avatar-placeholder.png";
import { renderBlurhashToCanvas } from "../utils/blurhash";

export interface Props extends Omit<HTMLAttributes<HTMLDivElement>, "className"> {
    portraitImage?: PortraitImage | null;
    showBorder: boolean;
}

export function PortraitImageWithPlaceholder({ portraitImage, showBorder, ...rest }: Props) {
    const { findBorderById } = usePortraitImagePickerStore();

    const [isLoaded, setIsLoaded] = useState(false);
    const [src, setSrc] = useState(portraitImage?.url || AvatarPlaceholder);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        if (!portraitImage?.blurhash) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        renderBlurhashToCanvas(canvas, portraitImage.blurhash, 32, 32);
    }, [portraitImage?.blurhash]);

    useEffect(() => {
        setSrc(portraitImage?.url || AvatarPlaceholder);
        setIsLoaded(false);
    }, [portraitImage?.url]);

    const borderStyling = showBorder
        ? css`
              box-sizing: border-box;
              padding: 12%;
          `
        : undefined;

    const border = findBorderById(portraitImage?.borderId)?.url;

    return (
        <Root {...rest}>
            {portraitImage?.blurhash && (
                <Canvas
                    ref={canvasRef}
                    aria-hidden
                    style={{ opacity: isLoaded ? 0 : 1 }}
                    sx={borderStyling}
                />
            )}
            <Img
                sx={borderStyling}
                src={src}
                alt={portraitImage?.displayName}
                onLoadStart={() => setIsLoaded(false)}
                onLoad={() => setIsLoaded(true)}
                onError={() => {
                    setSrc(AvatarPlaceholder);
                    setIsLoaded(true);
                }}
                style={{
                    opacity: isLoaded ? 1 : 0,
                    objectPosition: portraitImage?.position || "center",
                }}
                data-position={portraitImage?.position}
            />
            {showBorder && border && <Border src={border} />}
        </Root>
    );
}

const Root = styled("div")`
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: inherit;
`;

const Canvas = styled("canvas")`
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    image-rendering: optimizeSpeed;
    border-radius: inherit;
    pointer-events: none;
    transition: opacity 180ms cubic-bezier(0.4, 0, 1, 1);
    filter: brightness(0.95) saturate(0.9);
`;

const Img = styled("img")`
    display: block;
    width: 100%;
    height: 100%;
    border-radius: inherit;
    object-fit: cover;
    object-position: center;
    transition: opacity 260ms cubic-bezier(0, 0, 0.2, 1);
    position: relative;
`;

const Border = styled("img")`
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    border-radius: inherit;
    pointer-events: none;
`;
