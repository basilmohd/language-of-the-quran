import 'dotenv/config';
import express from 'express';
import { clerkMiddleware } from '@clerk/express';
import v1Router from './routes/v1/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const host = process.env['HOST'] ?? 'localhost';
const port = process.env['PORT'] ? Number(process.env['PORT']) : 3001;

const app = express();

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
