import { useEffect, useRef, useState, type HTMLAttributes } from "react";
import { css, styled } from "@mui/material";
import { PortraitImage, usePortraitImagePickerState } from "./portrait-image-picker-store";
import AvatarPlaceholder from "assets/avatar-placeholder.png";
import { renderBlurhashToCanvas } from "../utils/blurhash";

export interface Props extends Omit<HTMLAttributes<HTMLDivElement>, "className"> {
    portraitImage?: PortraitImage | null;
    portraitOverlay?: React.ReactNode;
    showBorder: boolean;
    onImageLoad?(target: HTMLImageElement): void;
}

export function PortraitImageWithPlaceholder({
    portraitImage,
    showBorder,
    portraitOverlay,
    onImageLoad,
    ...rest
}: Props) {
    const state = usePortraitImagePickerState();

    const [isLoaded, setIsLoaded] = useState(false);
    const [isBorderLoaded, setIsBorderLoaded] = useState(false);
    const [src, setSrc] = useState(portraitImage?.url || AvatarPlaceholder);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        if (!portraitImage?.blurhash && typeof portraitImage?.blurhash !== "string") return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        renderBlurhashToCanvas(canvas, portraitImage.blurhash, 32, 32);
    }, [portraitImage?.blurhash]);

    useEffect(() => {
        setSrc(portraitImage?.url || AvatarPlaceholder);
    }, [portraitImage?.url]);

    const borderStyling = showBorder
        ? css`
              box-sizing: border-box;
              padding: 12%;
          `
        : undefined;

    const border = state?.borders?.find((border) => border.id === portraitImage?.borderId)?.url;

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
                onLoad={(event) => {
                    setIsLoaded(true);
                    onImageLoad?.(event.currentTarget);
                }}
                onError={() => {
                    setSrc(AvatarPlaceholder);
                    setIsLoaded(true);
                }}
                style={{
                    opacity: isLoaded ? 1 : 0,
                    objectPosition: portraitImage?.position || "center",
                }}
                crossOrigin="anonymous"
                data-position={portraitImage?.position}
            />

            {portraitOverlay}
            {showBorder && border && (
                <Border
                    src={border}
                    onLoad={() => {
                        setIsBorderLoaded(true);
                    }}
                    sx={{ opacity: isLoaded && isBorderLoaded ? 1 : 0 }}
                />
            )}
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
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    image-rendering: optimizeSpeed;
    border-radius: inherit;
    pointer-events: none;
    transition: opacity 180ms cubic-bezier(0.4, 0, 1, 1);
    filter: brightness(0.95) saturate(0.9);
`;

const Img = styled("img")`
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    border-radius: inherit;
    object-fit: cover;
    object-position: center;
    transition: opacity 260ms cubic-bezier(0, 0, 0.2, 1);
`;

const Border = styled("img")`
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    pointer-events: none;
    transition: opacity 260ms cubic-bezier(0, 0, 0.2, 1);
`;
