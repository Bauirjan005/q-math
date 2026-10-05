import express from 'express';
import cors from 'cors';
import path from 'path';
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

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
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
