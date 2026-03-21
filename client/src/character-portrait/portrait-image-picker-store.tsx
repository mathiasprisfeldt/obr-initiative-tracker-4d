import OBR from "@owlbear-rodeo/sdk";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { computeBlurhashFromUrl } from "../utils/blurhash";
import { useApi } from "../store/settings-store";
import { isLocalDev } from "../utils/env";
import type { RoomConnection } from "obr-initiative-tracker-4d-backend/api-client";

const PORTRAIT_STATE_KEY = "portrait-image-picker";

export interface PortraitImage {
    displayName: string;
    url: string;
    position?: string;
    blurhash?: string | null;
    borderId?: string | null;
}

export interface PortraitBorder {
    id: string;
    url: string;
}

export interface PortraitImagePickerState {
    imageSourceUrl: string;
    borderSourceUrl?: string;
    images: PortraitImage[];
    borders?: PortraitBorder[];
    defaultBorderId?: string | null;
}

export interface PortraitImagePickerStore {
    state: PortraitImagePickerState;
    isLoading: boolean;

    setImageSourceUrl(url: string): void;
    setBorderSourceUrl(url: string): void;
    setDefaultBorder(id?: string | null): void;
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
    setDefaultBorder: () => {},
    updatePortraitImage: () => {},
});

export function usePortraitImagePickerStore(): PortraitImagePickerStore {
    return useContext(context);
}

export function usePortraitImagePickerState(): PortraitImagePickerState | undefined {
    const store = useContext(context);
    return store.isLoading ? undefined : store.state;
}

export function usePortraitImage(id: string | null | undefined): PortraitImage | null {
    const { state } = useContext(context);
    if (!id) return null;
    return state.images.find((img) => img.displayName === id) ?? null;
}

export function PortraitImagePickerStoreProvider({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(true);
    const [isGM, setIsGM] = useState(false);
    const api = useApi();
    const roomConnectionRef = useRef<RoomConnection | null>(null);
    const skipNextSendRef = useRef(false);

    const [state, setState] = useState<PortraitImagePickerState>({
        imageSourceUrl: isLocalDev ? "https://dnd.mathiasprisfeldt.me/img/" : "",
        borderSourceUrl: isLocalDev ? "https://dnd.mathiasprisfeldt.me/portrait_border/" : "",
        images: [],
    });

    useEffect(() => {
        if (isLoading || !isGM) return;

        if (skipNextSendRef.current) {
            skipNextSendRef.current = false;
            return;
        }

        roomConnectionRef.current?.updateState(PORTRAIT_STATE_KEY, state);
    }, [state]);

    // Manage WebSocket connection lifecycle
    useEffect(() => {
        if (!api) return;

        const connection = api.connectRoom(OBR.room.id, {
            onStateChanged: (key, incomingState) => {
                if (key === PORTRAIT_STATE_KEY) {
                    skipNextSendRef.current = true;
                    setState(incomingState as PortraitImagePickerState);
                    setIsLoading(false);
                }
            },
            onConnected: () => {
                setIsLoading(false);
            },
        });
        roomConnectionRef.current = connection;

        return () => {
            connection.close();
            roomConnectionRef.current = null;
        };
    }, [api]);

    useEffect(() => {
        if (!OBR.isAvailable) {
            setIsGM(true);
            return;
        }

        OBR.onReady(async () => {
            const role = await OBR.player.getRole();
            setIsGM(role === "GM");
        });
    }, []);

    // Download images from source URL when it changes
    useEffect(() => {
        if (isLoading || !isGM) return;

        if (!state.imageSourceUrl) {
            setState((prev) => ({
                ...prev,
                images: [],
            }));
            return;
        }

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
    }, [isLoading, isGM, state.imageSourceUrl]);

    // Update blurhashes for portrait images when new images are added
    useEffect(() => {
        if (!isGM) return;

        const abortController = new AbortController();
        (async () => {
            // Compute blurhashes only for those missing one to avoid heavy CPU/load
            const toCompute = state.images.filter(
                (img) => !img.blurhash || typeof img.blurhash !== "string",
            );

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
    }, [isGM, state.images]);

    useEffect(() => {
        if (isLoading || !isGM) return;

        if (!state.borderSourceUrl) {
            setState((prev) => ({
                ...prev,
                borders: [],
            }));
            return;
        }

        const abortController = new AbortController();

        (async () => {
            const borders = await downloadImageUrlsFromSource(state.borderSourceUrl!);
            const portraitBorders: PortraitBorder[] = borders.map((img) => {
                return {
                    id: img.displayName,
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
    }, [isLoading, isGM, state.borderSourceUrl]);

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

                setDefaultBorder: (id?: string | null) => {
                    setState((prev) => ({
                        ...prev,
                        defaultBorderId: id,
                    }));
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
