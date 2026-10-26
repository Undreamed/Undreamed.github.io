import { defineConfig } from "vite";

export default defineConfig({
  base: "/ok/",
  build: {
    outDir: "../../dist/ok",
    emptyOutDir: false,
  },
});
