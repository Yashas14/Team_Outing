import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// GET /api/polls — get active polls
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const polls = await prisma.poll.findMany({
      where: { isActive: true },
      include: {
        options: {
          include: {
            votes: req.user?.role === 'ADMIN'
              ? { include: { user: { select: { id: true, name: true } } } }
              : true,
          },
        },
        votes: { where: { userId: req.user!.id } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = polls.map((poll) => ({
      id: poll.id,
      question: poll.question,
      isActive: poll.isActive,
      createdAt: poll.createdAt,
      userVote: poll.votes[0]?.optionId || null,
      options: poll.options.map((opt) => ({
        id: opt.id,
        text: opt.text,
        voteCount: opt.votes.length,
        ...(req.user?.role === 'ADMIN'
          ? { voters: opt.votes.map((v: any) => v.user) }
          : {}),
      })),
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/polls/:id/vote — cast vote
router.post('/:id/vote', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { optionId } = z.object({ optionId: z.string() }).parse(req.body);
    const pollId = req.params.id as string;
    const userId = req.user!.id;

    const poll = await prisma.poll.findUnique({ where: { id: pollId } });
    if (!poll || !poll.isActive) {
      return res.status(404).json({ error: 'Poll not found or inactive' });
    }

    const option = await prisma.pollOption.findFirst({
      where: { id: optionId, pollId: pollId },
    });
    if (!option) {
      return res.status(404).json({ error: 'Option not found' });
    }

    // Upsert vote
    const vote = await prisma.pollVote.upsert({
      where: { userId_pollId: { userId, pollId } },
      update: { optionId },
      create: { userId, pollId, optionId },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'POLL_VOTE',
        details: `${req.user!.name} voted on poll: ${poll.question}`,
      },
    });

    // Emit update
    const io = req.app.get('io');
    const results = await getPollResults(pollId);
    io?.emit('poll:vote', { pollId, results });

    res.json(vote);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/polls/:id/results
router.get('/:id/results', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const results = await getPollResults(req.params.id as string);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/polls — admin create poll
router.post('/', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      question: z.string().min(5).max(200),
      options: z.array(z.string().min(1)).min(2).max(10),
    });
    const { question, options } = schema.parse(req.body);

    const poll = await prisma.poll.create({
      data: {
        question,
        options: {
          create: options.map((text) => ({ text })),
        },
      },
      include: { options: true },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: 'POLL_CREATE',
        details: `Admin created poll: ${question}`,
      },
    });

    res.status(201).json(poll);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/polls/:id — admin delete poll
router.delete('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.poll.delete({ where: { id: req.params.id as string } });
    res.json({ message: 'Poll deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function getPollResults(pollId: string) {
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    include: {
      options: {
        include: {
          votes: { include: { user: { select: { name: true } } } },
        },
      },
    },
  });

  if (!poll) return null;

  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes.length, 0);
  return {
    id: poll.id,
    question: poll.question,
    totalVotes,
    options: poll.options.map((opt) => ({
      id: opt.id,
      text: opt.text,
      voteCount: opt.votes.length,
      percentage: totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0,
    })),
  };
}

export default router;
