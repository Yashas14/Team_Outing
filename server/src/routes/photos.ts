import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';
import { v2 as cloudinary } from 'cloudinary';
import archiver from 'archiver';

const router = Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper: parse likedByJson safely
function parseLikedBy(json: string | null | undefined): string[] {
  try { return JSON.parse(json || '[]'); } catch { return []; }
}

// Helper: serialize likedBy array to JSON string
function serializeLikedBy(arr: string[]): string {
  return JSON.stringify(arr);
}

// Helper: format photo for API response (add likedBy array from JSON)
function formatPhoto(photo: any) {
  return { ...photo, likedBy: parseLikedBy(photo.likedByJson) };
}

// GET /api/photos — paginated list
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [photos, total] = await Promise.all([
      prisma.photo.findMany({
        skip,
        take: limit,
        orderBy: { uploadedAt: 'desc' },
        include: {
          uploader: { select: { id: true, name: true, avatar: true } },
        },
      }),
      prisma.photo.count(),
    ]);

    res.json({
      photos: photos.map(formatPhoto),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/photos/upload — upload photos
router.post('/upload', requireAuth, upload.array('photos', 20), async (req: AuthRequest, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const caption = req.body.caption || '';
    const uploadedPhotos = [];

    for (const file of files) {
      let url: string;
      let thumbnailUrl: string;

      // If Cloudinary is configured, upload there
      if (process.env.CLOUDINARY_CLOUD_NAME) {
        const result = await new Promise<any>((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                folder: 'team-outing',
                resource_type: 'image',
                transformation: [{ quality: 'auto', fetch_format: 'auto' }],
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            )
            .end(file.buffer);
        });

        url = result.secure_url;
        thumbnailUrl = cloudinary.url(result.public_id, {
          width: 300,
          height: 300,
          crop: 'fill',
          quality: 'auto',
        });
      } else {
        // Fallback: store as base64 data URL for development
        const base64 = file.buffer.toString('base64');
        url = `data:${file.mimetype};base64,${base64}`;
        thumbnailUrl = url;
      }

      const photo = await prisma.photo.create({
        data: {
          uploaderId: req.user!.id,
          url,
          thumbnailUrl,
          caption,
          likedByJson: '[]',
        },
        include: {
          uploader: { select: { id: true, name: true, avatar: true } },
        },
      });

      uploadedPhotos.push(formatPhoto(photo));
    }

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: 'PHOTO_UPLOAD',
        details: `${req.user!.name} uploaded ${files.length} photo(s)`,
      },
    });

    const io = req.app.get('io');
    uploadedPhotos.forEach((photo) => io?.emit('photo:uploaded', { photo }));

    res.status(201).json(uploadedPhotos);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload photos' });
  }
});

// DELETE /api/photos/:id
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const photo = await prisma.photo.findUnique({ where: { id: req.params.id as string } });
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // Only admin or photo owner can delete
    if (req.user!.role !== 'ADMIN' && photo.uploaderId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized to delete this photo' });
    }

    await prisma.photo.delete({ where: { id: req.params.id as string } });

    res.json({ message: 'Photo deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/photos/:id/like — toggle like
router.post('/:id/like', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const photo = await prisma.photo.findUnique({ where: { id: req.params.id as string } });
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const userId = req.user!.id;
    const likedBy = parseLikedBy(photo.likedByJson);
    const alreadyLiked = likedBy.includes(userId);

    const updated = await prisma.photo.update({
      where: { id: req.params.id as string },
      data: {
        likes: alreadyLiked ? photo.likes - 1 : photo.likes + 1,
        likedByJson: serializeLikedBy(
          alreadyLiked
            ? likedBy.filter((id) => id !== userId)
            : [...likedBy, userId]
        ),
      },
    });

    res.json({ likes: updated.likes, liked: !alreadyLiked });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/photos/download-all — ZIP download
router.get('/download-all', requireAuth, async (_req: AuthRequest, res: Response) => {
  try {
    const photos = await prisma.photo.findMany({ select: { url: true, caption: true, id: true } });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=team-outing-photos.zip');

    const archive = archiver('zip', { zlib: { level: 5 } });
    archive.pipe(res);

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      if (photo.url.startsWith('http')) {
        const response = await fetch(photo.url);
        const buffer = Buffer.from(await response.arrayBuffer());
        archive.append(buffer, { name: `photo_${i + 1}.jpg` });
      }
    }

    await archive.finalize();
  } catch (error) {
    console.error('ZIP error:', error);
    res.status(500).json({ error: 'Failed to create ZIP' });
  }
});

// GET /api/photos/leaderboard
router.get('/leaderboard', requireAuth, async (_req: AuthRequest, res: Response) => {
  try {
    // Most photos uploaded
    const uploaders = await prisma.photo.groupBy({
      by: ['uploaderId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    const uploaderIds = uploaders.map((u) => u.uploaderId);
    const users = await prisma.user.findMany({
      where: { id: { in: uploaderIds } },
      select: { id: true, name: true, avatar: true },
    });

    const mostUploads = uploaders.map((u) => ({
      user: users.find((usr) => usr.id === u.uploaderId),
      count: u._count.id,
    }));

    // Most liked photos
    const mostLiked = (await prisma.photo.findMany({
      orderBy: { likes: 'desc' },
      take: 5,
      include: { uploader: { select: { id: true, name: true, avatar: true } } },
    })).map(formatPhoto);

    res.json({ mostUploads, mostLiked });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
