import { useEffect, useRef, useState, type HTMLAttributes } from "react";
import { styled } from "@mui/material";
import { PortraitImage } from "./portrait-image-picker-store";
import AvatarPlaceholder from "assets/avatar-placeholder.png";
import { renderBlurhashToCanvas } from "../utils/blurhash";

export interface Props extends Omit<HTMLAttributes<HTMLDivElement>, "className"> {
    portraitImage?: PortraitImage | null;
}

export function PortraitImageWithPlaceholder({ portraitImage, ...rest }: Props) {
    const url = portraitImage?.url || AvatarPlaceholder;
    const imageUrl = portraitImage?.url ?? null;
    const providedBlurhash = portraitImage?.blurhash ?? null;
    const [isLoaded, setIsLoaded] = useState(false);
    const [blurhash, setBlurhash] = useState<string | null>(providedBlurhash);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);

    useEffect(() => {
        setIsLoaded(false);
        setBlurhash(portraitImage?.blurhash ?? null);
    }, [imageUrl]);

    useEffect(() => {
        setBlurhash(providedBlurhash ?? null);
    }, [providedBlurhash]);

    useEffect(() => {
        if (!blurhash) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        renderBlurhashToCanvas(canvas, blurhash, 32, 32);
    }, [blurhash]);

    return (
        <Root {...rest}>
            {blurhash && (
                <Canvas ref={canvasRef} aria-hidden style={{ opacity: isLoaded ? 0 : 1 }} />
            )}
            <Img
                ref={imgRef}
                src={url}
                alt={portraitImage?.displayName}
                onLoad={() => setIsLoaded(true)}
                onError={() => {
                    if (imgRef.current) {
                        imgRef.current.src = AvatarPlaceholder;
                    }
                    setIsLoaded(true);
                }}
                style={{
                    opacity: isLoaded ? 1 : 0,
                    objectPosition: portraitImage?.position || "center",
                }}
                data-position={portraitImage?.position}
            />
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
