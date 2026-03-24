import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

const messageSchema = z.object({
  content: z.string().min(1).max(2000),
  isGlobal: z.boolean().default(true),
});

// GET /api/messages — get global messages
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { isGlobal: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: { select: { id: true, name: true, avatar: true, role: true } },
        },
      }),
      prisma.message.count({ where: { isGlobal: true } }),
    ]);

    res.json({ messages: messages.reverse(), total, page, limit });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/messages — send message
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { content, isGlobal } = messageSchema.parse(req.body);

    const message = await prisma.message.create({
      data: {
        senderId: req.user!.id,
        content,
        isGlobal,
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true, role: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: 'MESSAGE_SEND',
        details: `${req.user!.name} sent a ${isGlobal ? 'global' : 'direct'} message`,
      },
    });

    const io = req.app.get('io');
    io?.emit('message:new', { message });

    res.status(201).json(message);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/messages/:id — admin only
router.delete('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.message.delete({ where: { id: req.params.id as string } });
    res.json({ message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
