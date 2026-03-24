import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { requireAdmin, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// GET /api/admin/stats
router.get('/stats', requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const [
      totalUsers,
      attending,
      notAttending,
      photoCount,
      feedbackCount,
      messageCount,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'EMPLOYEE' } }),
      prisma.rSVP.count({ where: { attending: true,  user: { role: 'EMPLOYEE' } } }),
      prisma.rSVP.count({ where: { attending: false, user: { role: 'EMPLOYEE' } } }),
      prisma.photo.count(),
      prisma.feedback.count(),
      prisma.message.count(),
    ]);

    res.json({
      totalInvited: totalUsers,
      attending,
      notAttending,
      pending: totalUsers - attending - notAttending,
      attendingPercent: totalUsers > 0 ? Math.round((attending / totalUsers) * 100) : 0,
      notAttendingPercent: totalUsers > 0 ? Math.round((notAttending / totalUsers) * 100) : 0,
      photoCount,
      feedbackCount,
      messageCount,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/users
router.get('/users', requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        rsvp: true,
      },
      orderBy: { name: 'asc' },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/users/invite
router.post('/users/invite', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      name: z.string().min(2),
    });
    const { email, name } = schema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    if (!email.toLowerCase().endsWith('@siemens.com')) {
      return res.status(400).json({ error: 'Only @siemens.com email addresses are allowed.' });
    }

    // No password — employee will set one on first login
    const user = await prisma.user.create({
      data: { email: email.toLowerCase(), name, role: 'EMPLOYEE' },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: 'USER_INVITE',
        details: `Admin invited ${name} (${email})`,
      },
    });

    res.status(201).json({
      id: user.id,
      email: user.email,
      name: user.name,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/event-config
router.put('/event-config', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      outingDate: z.string().optional(),
      venueName: z.string().optional(),
      venueAddress: z.string().optional(),
      description: z.string().optional(),
      bannerUrl: z.string().optional(),
    });
    const data = schema.parse(req.body);

    const config = await prisma.eventConfig.upsert({
      where: { id: 'default-config' },
      update: {
        ...data,
        outingDate: data.outingDate ? new Date(data.outingDate) : undefined,
      },
      create: {
        id: 'default-config',
        outingDate: data.outingDate ? new Date(data.outingDate) : new Date('2026-04-01'),
        venueName: data.venueName,
        venueAddress: data.venueAddress,
        description: data.description,
        bannerUrl: data.bannerUrl,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: 'EVENT_CONFIG_UPDATE',
        details: 'Admin updated event configuration',
      },
    });

    res.json(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/activity-log
router.get('/activity-log', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const logs = await prisma.activityLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/rsvp/export — CSV export
router.get('/rsvp/export', requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const rsvps = await prisma.rSVP.findMany({
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Format: DD MMM YYYY, HH:MM AM/PM
    const fmt = (d: Date) => {
      const day = d.getDate().toString().padStart(2, '0');
      const month = d.toLocaleString('en-US', { month: 'short' });
      const year = d.getFullYear();
      const time = d.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      return `${day} ${month} ${year}, ${time}`;
    };

    let csv = 'Name,Email ID,Vote,Date & Time Voted\n';
    for (const rsvp of rsvps) {
      csv += `"${rsvp.user.name}","${rsvp.user.email}","${rsvp.attending ? 'Yes' : 'No'}","${fmt(rsvp.createdAt)}"\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=rsvp-list.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
