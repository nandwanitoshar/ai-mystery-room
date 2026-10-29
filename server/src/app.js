import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import caseRoutes from './routes/caseRoutes.js';

// Ensure .env is always loaded from server/.env regardless of current working directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const app = express();

// Parse configured client origins (supports comma-separated list, trims trailing slashes)
const configuredOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((url) => url.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const defaultAllowedOrigins = [
  ...configuredOrigins,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

const isAllowedOrigin = (origin) => {
  // Allow requests with no origin (such as mobile apps, curl, server-to-server)
  if (!origin) return true;

  const cleanOrigin = origin.replace(/\/+$/, '');

  // Exact match against configured or localhost origins
  if (defaultAllowedOrigins.includes(cleanOrigin) || defaultAllowedOrigins.includes('*')) {
    return true;
  }

  // Allow Vercel production and preview subdomains (*.vercel.app)
  if (/^https:\/\/[a-z0-9_-]+\.vercel\.app$/i.test(cleanOrigin)) {
    return true;
  }

  return false;
};

// Configure CORS to support production frontend, Vercel previews, and local loopbacks
app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  })
);

// Body parsing middleware with safe size limit
app.use(express.json({ limit: '100kb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;

  res.status(200).json({
    status: 'ok',
    message: 'AI Mystery Room backend is running',
    database: isDbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Mount Case Routes
app.use('/api/cases', caseRoutes);

// 404 Handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('[App Error] Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});

export default app;
