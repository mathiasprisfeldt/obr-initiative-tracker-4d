import { decode, encode } from "blurhash";
import { paletteFromImageElement } from "./palette";

export interface PortraitMetadata {
    blurhash?: string | null;
    palette?: string[];
}

export async function computePortraitMetadataFromUrl(
    url: string,
    abortSignal: AbortSignal,
    options: { blurhash?: boolean; palette?: boolean } = {},
): Promise<PortraitMetadata> {
    const shouldComputeBlurhash = options.blurhash !== false;
    const shouldComputePalette = options.palette !== false;

    try {
        const img = await loadImage(url, abortSignal);
        return {
            blurhash: shouldComputeBlurhash ? computeBlurhashFromImage(img) : undefined,
            palette: shouldComputePalette
                ? await paletteFromImageElement(img).catch(() => [])
                : undefined,
        };
    } catch (_err) {
        return {
            blurhash: shouldComputeBlurhash ? null : undefined,
            palette: shouldComputePalette ? [] : undefined,
        };
    }
}

export function renderBlurhashToCanvas(
    canvas: HTMLCanvasElement | null,
    blurhash: string,
    width: number,
    height: number,
): void {
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;
    const pixels = decode(blurhash, width, height);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const imageData = ctx.createImageData(width, height);
    imageData.data.set(pixels);
    ctx.putImageData(imageData, 0, 0);
}

function loadImage(url: string, abortSignal: AbortSignal): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;

        abortSignal.onabort = () => {
            img.src = ""; // Cancel the image load
            reject();
        };
    });
}

function computeBlurhashFromImage(img: HTMLImageElement): string | null {
    try {
        const { width, height } = fitWithin(
            img.naturalWidth || img.width,
            img.naturalHeight || img.height,
            32,
        );
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;

        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        return encode(imageData.data, width, height, 4, 4);
    } catch (_err) {
        return null;
    }
}

function fitWithin(srcW: number, srcH: number, maxSide: number): { width: number; height: number } {
    if (!srcW || !srcH) return { width: maxSide, height: maxSide };
    const scale = Math.min(maxSide / srcW, maxSide / srcH);
    const width = Math.max(1, Math.round(srcW * scale));
    const height = Math.max(1, Math.round(srcH * scale));
    return { width, height };
}
