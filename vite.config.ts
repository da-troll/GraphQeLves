import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        // The main panel UI
        main: resolve(__dirname, 'index.html'),
        // The invisible devtools loader
        devtools: resolve(__dirname, 'devtools.html'),
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
});