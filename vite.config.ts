import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), // Fast Refresh (HMR) is enabled by default
  ],
  server: {
    port: 3000,
    host: true, // Allow external connections
    strictPort: false, // Try the next available port if 3000 is taken
    open: false, // Don't auto-open browser
    hmr: {
      // Enable Hot Module Replacement
      overlay: true, // Show errors in the browser overlay
    },
    watch: {
      // Watch for file changes
      usePolling: false, // Use native file system events (faster)
      interval: 100, // Only used if usePolling is true
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true, // Enable WebSocket proxying for HMR
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true, // Enable source maps for better debugging
  },
});

