/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA(
      {
        registerType: 'autoUpdate',
        manifest: {
          name: 'Compra y Fiado',
          short_name: 'CompraFiado',
          description: 'Una aplicación para gestionar compras y deudas de fiado.',
          theme_color: '#ffffff',
          background_color: '#ffffff',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: 'pwa-192x192.png', // Asegúrate de crear estos íconos
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
      }
    ),
  ],
  envDir: './', // Directorio donde buscar archivos .env
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts', // Archivo de configuración para las pruebas
    threads: false, // Desactiva los hilos para evitar el timeout
    alias: {
      './firebase': '/src/__mocks__/firebase.ts',
    },
  },
  resolve: {},
})
