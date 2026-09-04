import { extractPalette } from "@jimmyclchu/image-palette";

const PALETTE_SAMPLE_SIZE = 64;

export async function paletteFromImageElement(image: HTMLImageElement): Promise<string[]> {
    const canvas = document.createElement("canvas");
    const { width, height } = fitWithin(
        image.naturalWidth || image.width,
        image.naturalHeight || image.height,
        PALETTE_SAMPLE_SIZE,
    );
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return Promise.resolve([]);

    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    return (
        await extractPalette<"hex">(canvas, {
            colorCount: 5,
            filters: {
                minDistance: 0, // Colors must be 15% different
                excludeDark: 0.2, // No very dark colors
                excludeLight: 0.8, // No very light colors
            },
            includeMetadata: false,
        })
    ).map((color) => (typeof color === "string" ? color : color.color));
}

function fitWithin(srcW: number, srcH: number, maxSide: number): { width: number; height: number } {
    if (!srcW || !srcH) return { width: maxSide, height: maxSide };
    const scale = Math.min(maxSide / srcW, maxSide / srcH);
    return {
        width: Math.max(1, Math.round(srcW * scale)),
        height: Math.max(1, Math.round(srcH * scale)),
    };
}
