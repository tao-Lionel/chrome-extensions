import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname);

  console.log(env.VITE_MODE);
  return {
    plugins: [vue()],
    build: {
      watch: env.VITE_MODE === "development" ? {} : null,
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
    css: {
      preprocessorOptions: {
        sass: {
          implementation: require("sass"), // This line must in sass option
        },
      },
    },
  };
});
