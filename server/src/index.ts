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
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: false,
  },
});

// Make io accessible in routes
app.set('io', io);

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: '*',
  credentials: false,
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

// One-time seed endpoint — protected by secret key
app.get('/api/seed', async (req, res) => {
  const secret = req.query.secret;
  if (secret !== (process.env.SEED_SECRET || 'seed-team-outing-2026')) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const { main } = await import('./prisma/seed');
    await main();
    res.json({ success: true, message: 'Database seeded successfully!' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
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

const PORT = parseInt(process.env.PORT || '3001', 10);
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`📡 Socket.IO ready`);
});

export { app, io };
