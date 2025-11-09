// Performance optimization configuration for Vite

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';
import viteImagemin from 'vite-plugin-imagemin';
import { splitVendorChunkPlugin } from 'vite';
import path from 'path';

export const performancePlugins = [
  // React SWC plugin (already fast, but configure for production)
  react({
    jsxImportSource: '@emotion/react',
    babel: {
      plugins: ['@emotion/babel-plugin'],
    },
  }),

  // Code splitting for vendors
  splitVendorChunkPlugin(),

  // Image optimization
  viteImagemin({
    gifsicle: {
      optimizationLevel: 7,
      interlaced: false,
    },
    optipng: {
      optimizationLevel: 7,
    },
    mozjpeg: {
      quality: 80,
      progressive: true,
    },
    pngquant: {
      quality: [0.8, 0.9],
      speed: 4,
    },
    svgo: {
      plugins: [
        {
          name: 'removeViewBox',
        },
        {
          name: 'removeEmptyAttrs',
          active: false,
        },
      ],
    },
  }),

  // PWA capabilities for caching
  VitePWA({
    registerType: 'autoUpdate',
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/hshddfrqpyjenatftqpv\.supabase\.co\/storage\/v1\/object\/public\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'supabase-storage',
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        {
          urlPattern: /^https:\/\/hshddfrqpyjenatftqpv\.supabase\.co\/rest\/v1\/.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'supabase-api',
            networkTimeoutSeconds: 10,
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 5, // 5 minutes
            },
          },
        },
      ],
    },
    includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
    manifest: {
      name: 'Civic Data Platform',
      short_name: 'CivicData',
      description: 'Anonymous teacher experience measurement platform',
      theme_color: '#0a0f1c',
      background_color: '#0a0f1c',
      display: 'standalone',
      orientation: 'portrait',
      icons: [
        {
          src: 'pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: 'pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    },
  }),

  // Bundle analyzer (only in analyze mode)
  process.env.ANALYZE === 'true' &&
    visualizer({
      filename: './dist/stats.html',
      title: 'Civic Data Platform Bundle Analysis',
      gzipSize: true,
      brotliSize: true,
    }),
].filter(Boolean);

// Code splitting configuration
export const manualChunks = {
  // React and core libraries
  react: ['react', 'react-dom', 'react-router-dom'],
  
  // UI libraries
  ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-slot'],
  
  // Charts and visualization
  charts: ['recharts'],
  
  // Form handling
  forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
  
  // Supabase
  supabase: ['@supabase/supabase-js'],
  
  // Query client
  query: ['@tanstack/react-query'],
};

// CDN configuration checklist
export const cdnChecklist = {
  // Static assets
  staticAssets: {
    enable: true,
    cacheControl: 'public, max-age=31536000, immutable', // 1 year
    fileTypes: ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2'],
  },
  
  // API responses
  apiResponses: {
    enable: true,
    cacheControl: 'public, max-age=300, s-maxage=300', // 5 minutes
    paths: ['/api/aggregate', '/api/trends'],
  },
  
  // Images
  images: {
    enable: true,
    cacheControl: 'public, max-age=86400', // 24 hours
    formats: ['avif', 'webp', 'jpeg', 'png'],
  },
  
  // Fonts
  fonts: {
    enable: true,
    cacheControl: 'public, max-age=31536000, immutable', // 1 year
  },
};

// Performance budgets
export const performanceBudgets = {
  // JavaScript
  javascript: {
    maxSize: '500kb',
    maxGzippedSize: '150kb',
    maxInitialChunks: 5,
  },
  
  // CSS
  css: {
    maxSize: '100kb',
    maxGzippedSize: '20kb',
  },
  
  // Images
  images: {
    maxSize: '1mb',
    maxTotalSize: '5mb',
  },
  
  // Fonts
  fonts: {
    maxSize: '100kb',
  },
};

// Critical CSS inlining
export const criticalCSS = `
  /* Critical CSS for above-the-fold content */
  body {
    margin: 0;
    padding: 0;
    font-family: 'Inter', system-ui, sans-serif;
    background: hsl(217, 33%, 2%);
    color: hsl(210, 40%, 98%);
  }
  
  .loading-skeleton {
    background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
  }
  
  @keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

// Lazy loading configuration
export const lazyLoadingConfig = {
  // Images
  images: {
    placeholder: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PC9zdmc+',
    threshold: 0.1,
    rootMargin: '50px',
  },
  
  // Components
  components: {
    // Pages that should be lazy loaded
    lazyPages: [
      'StoryWall',
      'ModerationDashboard', 
      'PersonalDashboard',
      'SignStudio',
      'Press',
      'Voices'
    ],
    
    // Components that should be lazy loaded
    lazyComponents: [
      'VideoGrid',
      'VideoUploadModal',
      'StoryCarousel',
      'ReferralDashboard'
    ],
  },
};

// Preload critical resources
export const preloadResources = [
  {
    href: '/src/index.css',
    as: 'style',
  },
  {
    href: '/fonts/Inter.var.woff2',
    as: 'font',
    type: 'font/woff2',
    crossorigin: true,
  },
];

// DNS prefetch and preconnect
export const dnsPrefetch = [
  'https://hshddfrqpyjenatftqpv.supabase.co',
  'https://api.ipify.org',
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
];

export default defineConfig({
  plugins: performancePlugins,
  
  build: {
    // Code splitting
    rollupOptions: {
      output: {
        manualChunks: manualChunks,
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          let type = 'assets';
          
          if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i.test(assetInfo.name || '')) {
            type = 'media';
          } else if (/\.(png|jpe?g|gif|svg|ico|webp)(\?.*)?$/i.test(assetInfo.name || '')) {
            type = 'img';
          } else if (/\.(woff2?|eot|ttf|otf)(\?.*)?$/i.test(assetInfo.name || '')) {
            type = 'fonts';
          }
          
          return `${type}/[name]-[hash].[ext]`;
        },
      },
    },
    
    // Size warnings
    chunkSizeWarningLimit: 1000,
    
    // Minification
    minify: 'esbuild',
    esbuildOptions: {
      target: 'es2020',
    },
    
    // CSS code splitting
    cssCodeSplit: true,
    
    // Asset size limits
    assetsInlineLimit: 4096, // 4kb
  },
  
  // Server configuration for development
  server: {
    port: 8080,
    strictPort: true,
    headers: {
      'Cache-Control': 'no-store',
    },
  },
  
  // Preview server
  preview: {
    port: 4173,
    strictPort: true,
    headers: {
      'Cache-Control': 'public, max-age=3600',
    },
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js',
      'recharts',
    ],
    exclude: [
      // Exclude heavy dependencies from pre-bundling
    ],
  },
});