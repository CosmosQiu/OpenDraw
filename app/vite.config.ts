import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    react(
      { tsDecorators: true },
    ),
  ],
  server: {
    proxy: {
      "/302-api": {
        target: "https://api.302.ai",
        changeOrigin: true,
        secure: false,
        proxyTimeout: 120000,
        timeout: 120000,
        rewrite: (path) => path.replace(/^\/302-api/, ""),
      },
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
});
