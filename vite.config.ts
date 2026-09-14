import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Credenza',
        short_name: 'Credenza',
        description: 'Kitchen inventory & recipe manager',
        theme_color: '#1976d2',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [],
      },
    }),
  ],
});
