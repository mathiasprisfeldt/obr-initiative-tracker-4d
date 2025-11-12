import OBR from "@owlbear-rodeo/sdk";
import { createContext, useContext, useEffect, useState } from "react";
import { computeBlurhashFromUrl } from "../utils/blurhash";

const metadataKey = "obr-initiative-tracker-4d-portrait-image-picker-store-metadata";

export interface PortraitImage {
    displayName: string;
    url: string;
    position?: string;
    blurhash?: string | null;
}

export interface PortraitBorder {
    url: string;
}

export interface PortraitImagePickerState {
    imageSourceUrl: string;
    borderSourceUrl?: string;
    images: PortraitImage[];
    borders: PortraitBorder[];
}

export interface PortraitImagePickerStore {
    state: PortraitImagePickerState;
    isLoading: boolean;

    setImageSourceUrl(url: string): void;
    setBorderSourceUrl(url: string): void;
    updatePortraitImage(portraitImage: PortraitImage): void;
}

const context = createContext<PortraitImagePickerStore>({
    state: {
        imageSourceUrl: "",
        borderSourceUrl: undefined,
        images: [],
        borders: [],
    },
    isLoading: true,

    setImageSourceUrl: () => {},
    setBorderSourceUrl: () => {},
    updatePortraitImage: () => {},
});

export function usePortraitImagePickerStore(): PortraitImagePickerStore {
    return useContext(context);
}

export function usePortraitImagePickerState(): PortraitImagePickerState | undefined {
    const [state, setState] = useState<PortraitImagePickerState>();

    useEffect(() => {
        OBR.room.onMetadataChange((metadata) => {
            let portraitImagePickerState = metadata[metadataKey] as PortraitImagePickerState;

            setState(portraitImagePickerState);
        });
    }, []);

    return state;
}

export function PortraitImagePickerStoreProvider({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(true);

    const [state, setState] = useState<PortraitImagePickerState>({
        imageSourceUrl: import.meta.env.DEV ? "https://dnd.mathiasprisfeldt.me/img/" : "",
        borderSourceUrl: import.meta.env.DEV
            ? "https://dnd.mathiasprisfeldt.me/portrait_border/"
            : "",
        images: [],
        borders: [],
    });

    useEffect(() => {
        if (isLoading || !OBR.isAvailable) return;

        OBR.room.setMetadata({
            [metadataKey]: state,
        });
    }, [state]);

    useEffect(() => {
        if (!OBR.isAvailable) {
            setIsLoading(false);
            return;
        }

        OBR.onReady(async () => {
            const metadata = await OBR.room.getMetadata();
            const state = metadata[metadataKey] as PortraitImagePickerState;

            if (state) {
                setState(state);
            }

            setIsLoading(false);
        });
    }, []);

    // Download images from source URL when it changes
    useEffect(() => {
        if (!state.imageSourceUrl) return;

        (async () => {
            const images = await downloadImageUrlsFromSource(state.imageSourceUrl);
            setState((prev) => {
                const mergedImages = images.map((img) => {
                    const existing = prev.images.find((i) => i.displayName === img.displayName);
                    return {
                        ...img,
                        ...(existing || {}),
                    };
                });

                return {
                    ...prev,
                    images: mergedImages,
                };
            });
        })();
    }, [state.imageSourceUrl]);

    // Update blurhashes for portrait images when new images are added
    useEffect(() => {
        const abortController = new AbortController();
        (async () => {
            // Compute blurhashes only for those missing one to avoid heavy CPU/load
            const toCompute = state.images.filter((img) => !img.blurhash);

            if (toCompute.length > 0) {
                const results = await Promise.allSettled(
                    toCompute.map(async (img) => {
                        const blurhash = await computeBlurhashFromUrl(
                            img.url,
                            abortController.signal,
                        );
                        return { url: img.url, blurhash: blurhash ?? null };
                    }),
                );
                const urlToBlurhash = new Map<string, string | null>();
                results.forEach((res) => {
                    if (res.status === "fulfilled") {
                        urlToBlurhash.set(res.value.url, res.value.blurhash);
                    }
                });

                if (abortController.signal.aborted) return;

                setState((prev) => ({
                    ...prev,
                    images: prev.images.map((img) =>
                        urlToBlurhash.has(img.url)
                            ? { ...img, blurhash: urlToBlurhash.get(img.url) ?? null }
                            : img,
                    ),
                }));
            }
        })();

        return () => {
            abortController.abort();
        };
    }, [state.images]);

    useEffect(() => {
        if (!state.borderSourceUrl) return;

        const abortController = new AbortController();

        (async () => {
            const borders = await downloadImageUrlsFromSource(state.borderSourceUrl!);
            const portraitBorders: PortraitBorder[] = borders.map((img) => {
                return {
                    url: img.url,
                };
            });

            if (abortController.signal.aborted) return;

            setState((prev) => ({
                ...prev,
                borders: portraitBorders,
            }));
        })();

        return () => {
            abortController.abort();
        };
    }, [state.borderSourceUrl]);

    return (
        <context.Provider
            value={{
                state,
                isLoading,

                setImageSourceUrl: (url: string) => {
                    setState((prev) => ({ ...prev, imageSourceUrl: url }));
                },

                setBorderSourceUrl: (url: string) => {
                    setState((prev) => ({ ...prev, borderSourceUrl: url }));
                },

                updatePortraitImage: (portraitImage: PortraitImage) => {
                    setState((prev) => ({
                        ...prev,
                        images: prev.images.map((img) =>
                            img.displayName === portraitImage.displayName ? portraitImage : img,
                        ),
                    }));
                },
            }}
        >
            {children}
        </context.Provider>
    );
}

interface Image {
    displayName: string;
    url: string;
}

async function downloadImageUrlsFromSource(sourceUrl: string): Promise<Image[]> {
    const response = await fetch(sourceUrl);

    const domParser = new DOMParser();
    const document = domParser.parseFromString(await response.text(), "text/html");

    let images: Image[] = [];
    document.querySelectorAll("a").forEach((img) => {
        const imageUrl = img.getAttribute("href");

        if (imageUrl === "/") return; // Skip parent directory link
        if (imageUrl) {
            // Only include common image file types
            if (!/\.(png|jpe?g|webp|gif)$/i.test(imageUrl)) return;

            const fullUrl = new URL(imageUrl, sourceUrl);
            const imageUrlWithoutFileType = imageUrl.replace(/\.\w+$/, "");
            const displayName = decodeURI(imageUrlWithoutFileType);

            images.push({
                displayName,
                url: fullUrl.href,
            });
        }
    });

    return images;
}
