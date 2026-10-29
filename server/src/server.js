import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  let isDbConnected = false;

  console.log('[Server] Attempting MongoDB connection before starting server...');
  try {
    await connectDB();
    isDbConnected = true;
  } catch (error) {
    console.error('[Server Error] MongoDB connection failed before server start.');
    console.error(`[Server Error] Reason: ${error.message}`);
    console.error('[Server Notice] Server will continue running, but database features will be unavailable until credentials/network access are resolved.');
  }

  const server = app.listen(PORT, () => {
    console.log(`[Server] AI Mystery Room Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`[Server] Database status: ${isDbConnected ? 'CONNECTED' : 'DISCONNECTED'}`);
  });

  return server;
}

startServer();

export default app;
