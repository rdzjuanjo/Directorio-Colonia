// vite.config.js — Configuración Vite del panel admin: puerto 5173, proxy de /api, /uploads e /icons al backend en :3000
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
      '/uploads': 'http://localhost:3000',
      '/icons': 'http://localhost:3000',
    },
  },
});
