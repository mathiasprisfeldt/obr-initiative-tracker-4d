import OBR from "@owlbear-rodeo/sdk";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { computePortraitMetadataFromUrl } from "../utils/blurhash";
import { isLocalDev } from "../utils/env";
import { useRoomConnection } from "../hooks/use-room-connection";
import { useApi } from "../store/settings-store";

const PORTRAIT_STATE_KEY = "portrait-image-picker";
const ENVIRONMENT_KEY = import.meta.env.MODE;
const PORTRAIT_OWNER_METADATA_KEY = `obr-initiative-tracker-4d/portrait-owner:${ENVIRONMENT_KEY}`;

export interface PortraitImage {
    displayName: string;
    url: string;
    position?: string;
    blurhash?: string | null;
    palette?: string[];
    borderId?: string | null;
    particleColors?: string[];
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
    replaceState(state: PortraitImagePickerState): void;
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
    replaceState: () => {},
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
    const [portraitRoomId, setPortraitRoomId] = useState("");
    const [hasReceivedRoomState, setHasReceivedRoomState] = useState(false);
    const roomStateRef = useRef<PortraitImagePickerState | undefined>(undefined);
    const stateRef = useRef<PortraitImagePickerState>(null!);
    const hasPendingImportRef = useRef(false);
    const api = useApi();

    const [state, setState] = useState<PortraitImagePickerState>({
        imageSourceUrl: isLocalDev ? "https://dnd.mathiasprisfeldt.me/img/" : "",
        borderSourceUrl: isLocalDev ? "https://dnd.mathiasprisfeldt.me/portrait_border/" : "",
        images: [],
    });

    stateRef.current = state;

    const room = useRoomConnection<PortraitImagePickerState>({
        key: PORTRAIT_STATE_KEY,
        roomId: portraitRoomId,
        onInitialState: (serverState) => {
            roomStateRef.current = serverState;
            setHasReceivedRoomState(true);
        },
        onStateChanged: (incomingState) => {
            // The GM owns portrait configuration. Other clients consume the
            // copy broadcast to the room by the GM.
            if (!isGM) setState(incomingState);
        },
    });

    useEffect(() => {
        if (isLoading || !isGM) return;

        room.updateState(state);
    }, [isLoading, isGM, state]);

    useEffect(() => {
        if (isLocalDev) {
            // Local GM and player pages run in separate browser contexts, so the
            // in-memory metadata mock cannot coordinate them. Both connect to
            // this fixed backend scope instead.
            OBR.player.getRole().then((role) => setIsGM(role === "GM"));
            setPortraitRoomId(`user:dev-gm:${ENVIRONMENT_KEY}`);
            return;
        }

        if (!OBR.isAvailable) {
            setIsGM(true);
            setPortraitRoomId(`user:dev-gm:${ENVIRONMENT_KEY}`);
            return;
        }

        OBR.onReady(async () => {
            const role = await OBR.player.getRole();
            const playerIsGM = role === "GM";
            setIsGM(playerIsGM);

            if (playerIsGM) {
                const ownerId = `user:${await OBR.player.getId()}:${ENVIRONMENT_KEY}`;
                await OBR.room.setMetadata({ [PORTRAIT_OWNER_METADATA_KEY]: ownerId });
                setPortraitRoomId(ownerId);
            } else {
                const applyOwner = (metadata: Record<string, unknown>) => {
                    const ownerId = metadata[PORTRAIT_OWNER_METADATA_KEY];
                    if (typeof ownerId === "string") setPortraitRoomId(ownerId);
                };
                applyOwner(await OBR.room.getMetadata());
                OBR.room.onMetadataChange(applyOwner);
            }
        });
    }, []);

    useEffect(() => {
        if (!hasReceivedRoomState) return;

        if (hasPendingImportRef.current && isGM && api) {
            room.updateState(stateRef.current);
            hasPendingImportRef.current = false;
            setIsLoading(false);
            return;
        }

        if (roomStateRef.current) {
            setState(roomStateRef.current);
            setIsLoading(false);
            return;
        }

        if (isGM && api) {
            // TODO(backwards-compat): Remove this legacy room-state lookup once existing GMs
            // have migrated to the user-scoped backend state. New installs can initialize
            // stateRef.current directly and publish it through room.updateState.
            api.getRoomState<PortraitImagePickerState>(OBR.room.id, PORTRAIT_STATE_KEY)
                .then((legacyState) => {
                    const initialState = legacyState ?? stateRef.current;
                    setState(initialState);
                    room.updateState(initialState);
                    setIsLoading(false);
                });
        }
    }, [api, hasReceivedRoomState, isGM]);

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

    // Derive and persist display metadata in the background so the Portraits
    // tab can read it immediately without recomputing it per thumbnail.
    useEffect(() => {
        if (!isGM) return;

        const abortController = new AbortController();
        (async () => {
            // Only process metadata that is absent. `null` and an empty palette
            // mean a previous attempt completed but the source could not provide it.
            const toCompute = state.images.filter(
                (img) => img.blurhash === undefined || img.palette === undefined,
            );
            if (toCompute.length === 0) return;

            const metadataByUrl = new Map(
                await mapWithConcurrency(toCompute, 2, async (img) => [
                    img.url,
                    await computePortraitMetadataFromUrl(img.url, abortController.signal, {
                        blurhash: img.blurhash === undefined,
                        palette: img.palette === undefined,
                    }),
                ]),
            );
            if (abortController.signal.aborted) return;

            setState((prev) => ({
                ...prev,
                images: prev.images.map((img) => {
                    const metadata = metadataByUrl.get(img.url);
                    if (!metadata) return img;
                    return {
                        ...img,
                        ...(img.blurhash === undefined && metadata.blurhash !== undefined
                            ? { blurhash: metadata.blurhash }
                            : {}),
                        ...(img.palette === undefined && metadata.palette !== undefined
                            ? { palette: metadata.palette }
                            : {}),
                    };
                }),
            }));
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

                replaceState: (nextState: PortraitImagePickerState) => {
                    hasPendingImportRef.current = true;
                    setState(nextState);
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

async function mapWithConcurrency<T, R>(
    items: T[],
    concurrency: number,
    mapper: (item: T) => Promise<R>,
): Promise<R[]> {
    const results: R[] = [];
    let nextIndex = 0;

    await Promise.all(
        Array.from({ length: Math.min(concurrency, items.length) }, async () => {
            while (nextIndex < items.length) {
                const item = items[nextIndex++];
                results.push(await mapper(item));
            }
        }),
    );
    return results;
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
