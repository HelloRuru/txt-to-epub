import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  outDir: 'dist',
  // Cloudflare Pages Functions 在 functions/ 目錄，Astro 不管它
  // public/ 會自動複製到 dist/
});
