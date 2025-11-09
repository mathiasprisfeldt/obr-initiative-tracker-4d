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

export interface PortraitImagePickerState {
    imageSourceUrl: string;
    images: PortraitImage[];
}

export interface PortraitImagePickerStore {
    state: PortraitImagePickerState;
    isLoading: boolean;

    setImageSourceUrl(url: string): void;
    updatePortraitImage(portraitImage: PortraitImage): void;
}

const context = createContext<PortraitImagePickerStore>({
    state: {
        imageSourceUrl: "",
        images: [],
    },
    isLoading: true,

    setImageSourceUrl: () => {},
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
        images: [],
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

    useEffect(() => {
        if (!state.imageSourceUrl) return;

        (async () => {
            const response = await fetch(state.imageSourceUrl);

            const domParser = new DOMParser();
            const document = domParser.parseFromString(await response.text(), "text/html");

            let newImages: PortraitImage[] = [];
            setState((prev) => {
                document.querySelectorAll("a").forEach((img) => {
                    const imageUrl = img.getAttribute("href");

                    if (imageUrl === "/") return; // Skip parent directory link
                    if (imageUrl) {
                        // Only include common image file types
                        if (!/\.(png|jpe?g|webp|gif)$/i.test(imageUrl)) return;

                        const fullUrl = new URL(imageUrl, state.imageSourceUrl);
                        const imageUrlWithoutFileType = imageUrl.replace(/\.\w+$/, "");
                        const displayName = decodeURI(imageUrlWithoutFileType);

                        const existing = prev.images.find((i) => i.displayName === displayName);
                        const href = fullUrl.href;
                        if (newImages.some((i) => i.url === href)) return;

                        newImages.push({
                            ...(existing || {}),
                            displayName,
                            url: href,
                        });
                    }
                });

                return {
                    ...prev,
                    images: newImages,
                };
            });

            // Compute blurhashes only for those missing one to avoid heavy CPU/load
            const toCompute = newImages.filter((img) => !img.blurhash);
            if (toCompute.length > 0) {
                const results = await Promise.allSettled(
                    toCompute.map(async (img) => {
                        const bh = await computeBlurhashFromUrl(img.url);
                        return { url: img.url, blurhash: bh ?? null };
                    }),
                );
                const urlToBlurhash = new Map<string, string | null>();
                results.forEach((res) => {
                    if (res.status === "fulfilled") {
                        urlToBlurhash.set(res.value.url, res.value.blurhash);
                    }
                });
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
    }, [state.imageSourceUrl]);

    return (
        <context.Provider
            value={{
                state,
                isLoading,

                setImageSourceUrl: (url: string) => {
                    setState((prev) => ({ ...prev, imageSourceUrl: url }));
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
