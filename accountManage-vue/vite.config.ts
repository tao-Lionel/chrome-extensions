import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    watch: {},
    cssCodeSplit: false,
    sourcemap: false,
    outDir: "dist",
    rollupOptions: {
      input: {
        popup: "src/popup/main.ts",
      },
      output: {
        entryFileNames: "[name]/main.js",
        extend: true,
        format: "iife",
      },
    },
  },
});
