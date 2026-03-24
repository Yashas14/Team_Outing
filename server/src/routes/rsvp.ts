import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

const rsvpSchema = z.object({
  attending: z.boolean(),
});

// POST /api/rsvp — submit RSVP
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { attending } = rsvpSchema.parse(req.body);
    const userId = req.user!.id;

    const existing = await prisma.rSVP.findUnique({ where: { userId } });
    if (existing) {
      return res.status(400).json({ error: 'You have already submitted an RSVP. Use PUT to update.' });
    }

    const rsvp = await prisma.rSVP.create({
      data: { userId, attending },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'RSVP_SUBMIT',
        details: `${req.user!.name} RSVP'd ${attending ? 'YES' : 'NO'}`,
      },
    });

    // Emit real-time update
    const io = req.app.get('io');
    const counts = await getRsvpCounts();
    io?.emit('rsvp:updated', counts);

    res.status(201).json(rsvp);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/rsvp — update RSVP
router.put('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { attending } = rsvpSchema.parse(req.body);
    const userId = req.user!.id;

    // Check if within change window (72 hours before event)
    const eventConfig = await prisma.eventConfig.findFirst();
    if (eventConfig) {
      const deadline = new Date(eventConfig.outingDate);
      deadline.setDate(deadline.getDate() - 3);
      if (new Date() > deadline) {
        return res.status(400).json({ error: 'RSVP changes are no longer allowed (less than 72 hours before event)' });
      }
    }

    const rsvp = await prisma.rSVP.update({
      where: { userId },
      data: { attending },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'RSVP_UPDATE',
        details: `${req.user!.name} changed RSVP to ${attending ? 'YES' : 'NO'}`,
      },
    });

    const io = req.app.get('io');
    const counts = await getRsvpCounts();
    io?.emit('rsvp:updated', counts);

    res.json(rsvp);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/rsvp/mine — get own RSVP
router.get('/mine', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const rsvp = await prisma.rSVP.findUnique({
      where: { userId: req.user!.id },
    });
    res.json(rsvp);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/rsvp/all — admin only
router.get('/all', requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const rsvps = await prisma.rSVP.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(rsvps);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/rsvp/counts — public counts
router.get('/counts', requireAuth, async (_req: AuthRequest, res: Response) => {
  try {
    const counts = await getRsvpCounts();
    res.json(counts);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function getRsvpCounts() {
  const [attending, notAttending, total] = await Promise.all([
    prisma.rSVP.count({ where: { attending: true } }),
    prisma.rSVP.count({ where: { attending: false } }),
    prisma.user.count({ where: { role: 'EMPLOYEE' } }),
  ]);
  return { attending, notAttending, total, pending: total - attending - notAttending };
}

export default router;
