import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import calculateRoutes from './routes/calculateRoutes.js';
import historyRoutes from './routes/historyRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & utility middleware
app.use(
  helmet({
    hsts: false, // Disabled HSTS to allow HTTP connections on public IP without SSL forcing
  })
);
app.use(
  cors({
    origin: process.env.CLIENT_URL || true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Parental Legacy & Life Factors Calculator API',
    uptime: process.uptime()
  });
});

// Mount modular API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/calculate', calculateRoutes);
app.use('/api/v1/history', historyRoutes);

// Serve static client bundle in production if available
import path from 'path';

const publicPath = path.join(__dirname, '../public');

app.use(express.static(publicPath));

// SPA fallback for non-API GET requests
app.get('*', (req: Request, res: Response, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(publicPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) next();
  });
});

// Fallback 404 handler for unmatched routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `The requested endpoint ${req.method} ${req.url} was not found.`
    }
  });
});

// Centralized error handler
app.use(errorHandler);

// Bootstrap server after connecting to MongoDB
async function startServer() {
  try {
    await connectDB();
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`🚀 Parental Legacy API server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
