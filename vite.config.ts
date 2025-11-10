import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: ["8080-iz11xrpx452p7k5ldh68c-cbfbe634.manusvm.computer"],
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "rollup": "@rollup/wasm-node",
    },
  },
  optimizeDeps: {
    exclude: ["@rollup/wasm-node"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split large chart library into separate chunk
          'recharts-vendor': ['recharts'],
          // Split carousel library
          'carousel-vendor': ['embla-carousel-react'],
          // Split large UI framework components
          'radix-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
          ],
          // Core React libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Supabase and query
          'data-vendor': ['@supabase/supabase-js', '@tanstack/react-query'],
        },
      },
    },
    // Increase chunk size warning limit since we're using code splitting
    chunkSizeWarningLimit: 500,
  },
}));
