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
    manifest: true, // Generate manifest.json for bundle analysis
    rollupOptions: {
      output: {
        manualChunks: {
          // Split large chart library into separate chunk (lazy loaded via Methods.tsx)
          // IMPORTANT: Vendor chunks must include '-vendor' in the name to be exempt from the 300 KB budget.
          // See scripts/bundle-report.mjs for budget enforcement logic.
          'recharts-vendor': ['recharts'],
          // Split carousel library
          'carousel-vendor': ['embla-carousel-react'],
          // Split large UI framework components (most commonly used in the app)
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
    // Chunk size warning limit matches CI budget: 300 KB for non-vendor chunks
    // Vendor chunks (with '-vendor' suffix) are exempt from this limit
    chunkSizeWarningLimit: 300,
  },
}));
