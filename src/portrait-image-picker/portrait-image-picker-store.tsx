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

  setImageStoreUrl(url: string): void;
}

const context = createContext<PortraitImagePickerStore>({
  state: {
    imageStoreUrl: "",
    images: [],
  },

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

    OBR.scene.onReadyChange(async () => {
      const metadata = await OBR.scene.getMetadata();
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
      const doc = domParser.parseFromString(await response.text(), "text/html");

      doc.querySelectorAll("a").forEach((img) => {
        const imageUrl = img.getAttribute("href");

        if (imageUrl === "/") return; // skip parent directory link

        if (imageUrl) {
          const fullUrl = new URL(imageUrl, state.imageStoreUrl);
          const imageUrlWithoutFileType = imageUrl.replace(/\.\w+$/, "");
          const displayName = decodeURI(imageUrlWithoutFileType);

          setState((prev) => ({
            ...prev,
            images: [
              ...prev.images,
              {
                displayName: displayName,
                url: fullUrl.toString(),
              },
            ],
          }));
        }
      });
    })();
  }, [state.imageStoreUrl]);

  return (
    <context.Provider
      value={{
        state,

        setImageStoreUrl: (url: string) => {
          setState((prev) => ({ ...prev, imageStoreUrl: url }));
        },
      }}
    >
      {children}
    </context.Provider>
  );
}
