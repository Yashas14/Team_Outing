import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

const feedbackSchema = z.object({
  rating: z.number().min(1).max(5),
  message: z.string().min(10).max(1000),
  category: z.enum(['GENERAL', 'VENUE', 'FOOD', 'ACTIVITIES', 'TEAM', 'SUGGESTIONS']).default('GENERAL'),
  isAnonymous: z.boolean().default(false),
});

// POST /api/feedback — submit
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const data = feedbackSchema.parse(req.body);
    const userId = req.user!.id;

    // Check if user already submitted
    const existing = await prisma.feedback.findFirst({
      where: { userId, isAnonymous: false },
    });

    // Allow one named and one anon, but prevent duplicates
    if (existing && !data.isAnonymous) {
      return res.status(400).json({ error: 'You have already submitted feedback. You can edit it within 24 hours.' });
    }

    const feedback = await prisma.feedback.create({
      data: {
        userId: data.isAnonymous ? null : userId,
        rating: data.rating,
        message: data.message,
        category: data.category,
        isAnonymous: data.isAnonymous,
      },
      include: {
        user: data.isAnonymous ? false : { select: { id: true, name: true, avatar: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'FEEDBACK_SUBMIT',
        details: `${data.isAnonymous ? 'Anonymous' : req.user!.name} submitted feedback (${data.rating}★)`,
      },
    });

    const io = req.app.get('io');
    io?.to('admin').emit('feedback:new', { feedback });

    res.status(201).json(feedback);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/feedback
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const isAdmin = req.user!.role === 'ADMIN';
    const category = req.query.category as string;
    const rating = req.query.rating ? parseInt(req.query.rating as string) : undefined;

    const where: any = {};
    if (category && category !== 'ALL') where.category = category;
    if (rating) where.rating = rating;

    const feedbacks = await prisma.feedback.findMany({
      where,
      include: {
        user: isAdmin
          ? { select: { id: true, name: true, email: true, avatar: true } }
          : { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });

    // For non-admin, hide user info on anonymous feedback
    const formatted = feedbacks.map((f) => ({
      ...f,
      user: f.isAnonymous && !isAdmin ? null : f.user,
      displayName: f.isAnonymous ? 'Anonymous 🎭' : (f.user as any)?.name || 'Unknown',
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/feedback/:id — edit within 24h
router.put('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const feedback = await prisma.feedback.findUnique({ where: { id: req.params.id as string } });
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    if (feedback.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Check 24h window
    const hoursSinceSubmit = (Date.now() - feedback.submittedAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceSubmit > 24) {
      return res.status(400).json({ error: 'Edit window has expired (24 hours)' });
    }

    const data = feedbackSchema.partial().parse(req.body);
    const updated = await prisma.feedback.update({
      where: { id: req.params.id as string },
      data,
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/feedback/:id — admin only
router.delete('/:id', requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    await prisma.feedback.delete({ where: { id: _req.params.id as string } });
    res.json({ message: 'Feedback deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
