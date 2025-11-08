import OBR from "@owlbear-rodeo/sdk";
import { createContext, useContext, useEffect, useState } from "react";

const metadataKey = "obr-initiative-tracker-4d-portrait-image-picker-store-metadata";

export interface PortraitImage {
    displayName: string;
    url: string;
    position?: string;
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
        imageSourceUrl: "",
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

            setState((prev) => {
                let newImages: PortraitImage[] = [];

                document.querySelectorAll("a").forEach((img) => {
                    const imageUrl = img.getAttribute("href");

                    if (imageUrl === "/") return; // skip parent directory link

                    if (imageUrl) {
                        const fullUrl = new URL(imageUrl, state.imageSourceUrl);
                        const imageUrlWithoutFileType = imageUrl.replace(/\.\w+$/, "");
                        const displayName = decodeURI(imageUrlWithoutFileType);

                        newImages.push({
                            ...(prev.images.find((i) => i.displayName === displayName) || {}),
                            displayName,
                            url: fullUrl.href,
                        });
                    }
                });

                return {
                    ...prev,
                    images: newImages,
                };
            });
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
