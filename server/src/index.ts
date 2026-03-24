import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { rateLimit } from 'express-rate-limit';

import authRoutes from './routes/auth';
import rsvpRoutes from './routes/rsvp';
import pollRoutes from './routes/polls';
import photoRoutes from './routes/photos';
import feedbackRoutes from './routes/feedback';
import messageRoutes from './routes/messages';
import adminRoutes from './routes/admin';
import eventRoutes from './routes/event';
import { setupSocketHandlers } from './sockets';

dotenv.config();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? process.env.CLIENT_URL
      : ['http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io accessible in routes
app.set('io', io);

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.CLIENT_URL
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rsvp', rsvpRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/event', eventRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.IO
setupSocketHandlers(io);

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Socket.IO ready`);
});

export { app, io };
