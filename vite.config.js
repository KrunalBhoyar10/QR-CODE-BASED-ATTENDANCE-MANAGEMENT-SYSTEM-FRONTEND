import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  // Load every env file (.env, .env.local, .env.[mode], .env.[mode].local).
  // Empty prefix = load ALL vars (not just VITE_) so config-only keys are visible here.
  // The compiled client bundle still only receives VITE_-prefixed variables.
  const env = loadEnv(mode, __dirname, '');

  // VITE_PROXY_TARGET: where the Vite server forwards /api/* requests.
  // Always http://localhost:5000 — this never leaves this machine.
  const proxyTarget = env.VITE_PROXY_TARGET || 'http://localhost:5000';

  // Enable HTTPS when LAN_IP is present (set in .env.local for mobile testing).
  // basicSsl() injects a self-signed certificate so the phone treats the page
  // as a secure context → camera, BarcodeDetector, and geolocation all work.
  const useSsl = Boolean(env.LAN_IP);

  return {
    root: __dirname,
    plugins: [
      react(),
      ...(useSsl ? [basicSsl()] : []),
    ],
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-dom/client', 'react-router-dom'],
    },
    build: {
      outDir: path.resolve(__dirname, 'dist'),
      emptyOutDir: true,
    },
    server: {
      port: 3000,
      host: true,   // bind 0.0.0.0 — required for phone access
      open: false,
      proxy: {
        // Every request whose path starts with /api is forwarded server-side
        // to the Express backend. Because this runs on the dev machine it always
        // reaches localhost:5000 over HTTP — no mixed-content issue.
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
        // Face photos and other uploaded files served by the backend
        '/uploads': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
