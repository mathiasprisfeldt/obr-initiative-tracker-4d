import OBR from "@owlbear-rodeo/sdk";
import { createContext, useContext, useEffect, useState } from "react";

const metadataKey =
  "obr-initiative-tracker-4d-portrait-image-picker-store-metadata";

export interface PortraitImage {
  displayName: string;
  url: string;
}

export interface PortraitImagePickerState {
  imageStoreUrl: string;
  images: PortraitImage[];
}

export interface PortraitImagePickerStore {
  state: PortraitImagePickerState;
  isLoading: boolean;

  setImageStoreUrl(url: string): void;
}

const context = createContext<PortraitImagePickerStore>({
  state: {
    imageStoreUrl: "",
    images: [],
  },
  isLoading: true,

  setImageStoreUrl: () => {},
});

export function usePortraitImagePickerStore(): PortraitImagePickerStore {
  return useContext(context);
}

export function usePortraitImagePickerState():
  | PortraitImagePickerState
  | undefined {
  const [state, setState] = useState<PortraitImagePickerState>();

  useEffect(() => {
    OBR.room.onMetadataChange((metadata) => {
      let portraitImagePickerState = metadata[
        metadataKey
      ] as PortraitImagePickerState;

      setState(portraitImagePickerState);
    });
  }, []);

  return state;
}

export function PortraitImagePickerStoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);

  const [state, setState] = useState<PortraitImagePickerState>({
    imageStoreUrl: "",
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
    if (!state.imageStoreUrl) return;

    (async () => {
      const response = await fetch(state.imageStoreUrl);

      const domParser = new DOMParser();
      const document = domParser.parseFromString(
        await response.text(),
        "text/html"
      );

      let newImages: PortraitImage[] = [];

      document.querySelectorAll("a").forEach((img) => {
        const imageUrl = img.getAttribute("href");

        if (imageUrl === "/") return; // skip parent directory link

        if (imageUrl) {
          const fullUrl = new URL(imageUrl, state.imageStoreUrl);
          const imageUrlWithoutFileType = imageUrl.replace(/\.\w+$/, "");
          const displayName = decodeURI(imageUrlWithoutFileType);

          newImages.push({
            displayName,
            url: fullUrl.toString(),
          });
        }
      });

      setState((prev) => ({
        ...prev,
        images: newImages,
      }));
    })();
  }, [state.imageStoreUrl]);

  return (
    <context.Provider
      value={{
        state,
        isLoading,

        setImageStoreUrl: (url: string) => {
          setState((prev) => ({ ...prev, imageStoreUrl: url }));
        },
      }}
    >
      {children}
    </context.Provider>
  );
}
