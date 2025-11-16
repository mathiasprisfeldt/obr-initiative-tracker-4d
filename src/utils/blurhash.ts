import { extractPalette, HexColor } from "@jimmyclchu/image-palette";
import { decode, encode } from "blurhash";

export interface Blurhash {
    hash: string;
    palette: HexColor[];
}

export async function computeBlurhashFromUrl(
    url: string,
    abortSignal: AbortSignal,
): Promise<Blurhash | null> {
    try {
        const img = await loadImage(url, abortSignal);
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
        const imageBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve));

        return {
            hash: encode(imageData.data, width, height, 4, 4),
            palette: (
                await extractPalette<"hex">(imageBlob, {
                    colorCount: 5,
                })
            ).map((color) => (typeof color === "string" ? color : color.color)),
        };
    } catch (_err) {
        return null;
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

function fitWithin(srcW: number, srcH: number, maxSide: number): { width: number; height: number } {
    if (!srcW || !srcH) return { width: maxSide, height: maxSide };
    const scale = Math.min(maxSide / srcW, maxSide / srcH);
    const width = Math.max(1, Math.round(srcW * scale));
    const height = Math.max(1, Math.round(srcH * scale));
    return { width, height };
}
