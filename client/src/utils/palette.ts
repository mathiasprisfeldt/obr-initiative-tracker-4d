import { extractPalette } from "@jimmyclchu/image-palette";

export async function paletteFromImageElement(image: HTMLImageElement): Promise<string[]> {
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;

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
