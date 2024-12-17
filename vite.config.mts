import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  build: {
    outDir: '../quotes',
    emptyOutDir: true,
  },
  publicDir: '../public',
});