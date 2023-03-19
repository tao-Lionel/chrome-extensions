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
        contentScript: "src/contentScript/index.ts",
        popup: "src/popup/index.ts",
      },
      output: {
        assetFileNames: "[name].[ext]",
        entryFileNames: "[name]/index.js",
        extend: true,
        format: "es",
        // inlineDynamicImports: false,
      },
    },
  },
});
