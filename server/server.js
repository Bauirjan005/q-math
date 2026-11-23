import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

// Auto-load .env variables if present
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...rest] = trimmed.split('=');
        if (key && rest.length > 0) {
          process.env[key.trim()] = rest.join('=').trim().replace(/^["']|["']$/g, '');
        }
      }
    });
    console.log('[Q-Math Backend] Loaded environment variables from .env');
  } catch (e) {
    console.warn('[Q-Math Backend] Could not read .env file:', e.message);
  }
}

import apiRouter from './apiRouter.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Serve API routes
app.use('/api', apiRouter);

// Serve static assets in production
const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));

// Fallback to index.html for SPA client-side routing
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) res.status(200).send('Q-Math API server is running on port ' + PORT);
  });
});

app.listen(PORT, () => {
  console.log(`[Q-Math Backend] Server listening at http://localhost:${PORT}`);
});

export default app;
