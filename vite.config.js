import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/obr-initiative-tracker-4d/",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        popover: resolve(__dirname, "popover.html"),
        background: resolve(__dirname, "background.html"),
      },
    },
  },
});
