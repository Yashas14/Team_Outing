import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// GET /api/event/config — public event info
router.get('/config', requireAuth, async (_req: AuthRequest, res: Response) => {
  try {
    const config = await prisma.eventConfig.findFirst();
    if (!config) {
      return res.json({
        outingDate: '2026-04-01T09:00:00.000Z',
        venueName: 'TBD',
        venueAddress: 'TBD',
        description: 'Team outing coming soon!',
      });
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
