import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';
import prisma from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

const ALLOWED_DOMAIN = '@siemens.com';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many login attempts. Please try again later.' },
});

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string(), // allow empty — first-time employees submit blank
});

const setupPasswordSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long'),
});

function isSiemensEmail(email: string): boolean {
  return email.toLowerCase().endsWith(ALLOWED_DOMAIN);
}

function generateTokens(user: { id: string; email: string; role: string; name: string }) {
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '15m' }
  );
  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET || 'refresh-secret',
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
}

// POST /api/auth/login
router.post('/login', loginLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Domain check
    if (!isSiemensEmail(email)) {
      return res.status(403).json({ error: 'Only @siemens.com email addresses are allowed.' });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.status(401).json({ error: 'No account found for this email. Contact your admin.' });
    }

    // First-time login — no password set yet
    if (!user.passwordHash) {
      return res.status(200).json({ requiresPasswordSetup: true });
    }

    // If employee has a password but submitted blank, treat as wrong password
    if (!password) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    const tokens = generateTokens(user);

    await prisma.activityLog.create({
      data: { userId: user.id, action: 'LOGIN', details: `${user.name} logged in` },
    });

    res.json({
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/setup-password  — first-time password creation
router.post('/setup-password', async (req: Request, res: Response) => {
  try {
    const { email, password } = setupPasswordSchema.parse(req.body);

    if (!isSiemensEmail(email)) {
      return res.status(403).json({ error: 'Only @siemens.com email addresses are allowed.' });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.status(401).json({ error: 'No account found for this email.' });
    }

    if (user.passwordHash) {
      // Password already set — this route must not be used to change passwords
      return res.status(400).json({ error: 'Password already set. Please log in normally.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    const tokens = generateTokens(updated);

    await prisma.activityLog.create({
      data: { userId: user.id, action: 'PASSWORD_SET', details: `${user.name} set their password for the first time` },
    });

    res.json({
      ...tokens,
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        avatar: updated.avatar,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Setup password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'refresh-secret'
    ) as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    const tokens = generateTokens(user);
    res.json(tokens);
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// POST /api/auth/logout
router.post('/logout', (_req: Request, res: Response) => {
  res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, name: true, role: true, avatar: true, createdAt: true },
    });
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
