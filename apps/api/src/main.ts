import { config as loadDotenv } from 'dotenv';
// NX runs from workspace root; try both locations so local dev and direct runs both work
loadDotenv({ path: 'apps/api/.env' });
loadDotenv();
import express from 'express';
import { clerkMiddleware } from '@clerk/express';
import v1Router from './routes/v1/index.js';
import { errorHandler } from './middleware/errorHandler.js';

// Prevent unhandled async rejections from crashing the process in Node 18+
process.on('unhandledRejection', (reason) => {
  console.error('[UnhandledRejection]', reason);
});


const host = process.env['HOST'] ?? '0.0.0.0';
const port = process.env['PORT'] ? Number(process.env['PORT']) : 3001;

// Allowed origins: web app in dev and any configured prod origin
const ALLOWED_ORIGINS = new Set([
  'http://localhost:5173',
  ...(process.env['CORS_ORIGIN'] ? [process.env['CORS_ORIGIN']] : []),
]);

const app = express();

// CORS — allow the web app to call the API
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

// Raw body needed for Clerk webhook signature verification
app.use('/api/v1/auth/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(clerkMiddleware());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1', v1Router);

app.use(errorHandler);

app.listen(port, host, () => {
  console.log(`[ ready ] http://${host}:${port}`);
});
