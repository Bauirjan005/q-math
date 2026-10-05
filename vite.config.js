import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import express from 'express';
import path from 'path';
import apiRouter from './server/apiRouter.js';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'embedded-api-server',
      configureServer(server) {
        const app = express();
        app.use(express.json({ limit: '25mb' }));
        app.use(express.urlencoded({ extended: true, limit: '25mb' }));
        app.use(apiRouter);
        server.middlewares.use('/api', app);
        server.middlewares.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
        console.log('[Q-Math API] Embedded API router successfully mounted on /api and /uploads');
      }
    }
  ],
  server: {
    port: 5173,
    host: true
  }
});
