/**
 * LocalDB — A localStorage-powered database layer that replaces the backend.
 * All data is persisted in the browser's localStorage.
 * On first load, seed data is automatically populated.
 */

import { seedDatabase } from './seedData';
import type {
  User, RSVP, RSVPCounts, Poll, Photo,
  Message, Feedback, EventConfig, AdminStats, ActivityLog, Leaderboard,
} from '../types';

// Bump this version whenever seed data changes to force a re-seed
const DB_VERSION = '4';

// ── Storage Keys ──────────────────────────────────────────────────────────────
const KEYS = {
  INITIALIZED: 'db_initialized',
  VERSION: 'db_version',
  USERS: 'db_users',
  RSVPS: 'db_rsvps',
  POLLS: 'db_polls',
  PHOTOS: 'db_photos',
  MESSAGES: 'db_messages',
  FEEDBACKS: 'db_feedbacks',
  EVENT_CONFIG: 'db_event_config',
  ACTIVITY_LOG: 'db_activity_log',
} as const;

// ── Generic helpers ───────────────────────────────────────────────────────────
function getItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function uuid(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// ── Initialize DB ─────────────────────────────────────────────────────────────
export function initDB(): void {
  const currentVersion = localStorage.getItem(KEYS.VERSION);
  if (!localStorage.getItem(KEYS.INITIALIZED) || currentVersion !== DB_VERSION) {
    // Clear all old DB keys before re-seeding
    Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
    seedDatabase();
    localStorage.setItem(KEYS.INITIALIZED, 'true');
    localStorage.setItem(KEYS.VERSION, DB_VERSION);
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export function authenticateUser(email: string, password: string): { user: User; requiresPasswordSetup: boolean } | null {
  const users = getItem<(User & { password?: string })[]>(KEYS.USERS, []);
  const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!found) return null;

  // No password set (employee first login) → always trigger setup flow
  // Matches backend: if (!user.passwordHash) return { requiresPasswordSetup: true }
  if (!found.password) {
    return { user: sanitizeUser(found), requiresPasswordSetup: true };
  }

  // Has password but submitted blank → wrong password
  // Matches backend: if (!password) return 401
  if (!password) return null;

  // Plain string comparison (replaces bcrypt.compare on server)
  if (found.password !== password) return null;

  return { user: sanitizeUser(found), requiresPasswordSetup: false };
}

export function setupPassword(email: string, password: string): User | null {
  const users = getItem<(User & { password?: string })[]>(KEYS.USERS, []);
  const idx = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
  if (idx === -1) return null;

  // Matches backend: if password already set, reject
  if (users[idx].password) {
    throw new Error('Password already set. Please log in normally.');
  }

  users[idx].password = password;
  setItem(KEYS.USERS, users);
  return sanitizeUser(users[idx]);
}

export function getUserById(id: string): User | null {
  const users = getItem<(User & { password?: string })[]>(KEYS.USERS, []);
  const found = users.find((u) => u.id === id);
  return found ? sanitizeUser(found) : null;
}

function sanitizeUser(u: User & { password?: string }): User {
  const { password, ...rest } = u as any;
  return rest;
}

export function inviteUser(email: string, name: string): User {
  const users = getItem<(User & { password?: string })[]>(KEYS.USERS, []);
  const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) throw new Error('User already exists');

  const newUser: User & { password?: string } = {
    id: uuid(),
    email: email.toLowerCase(),
    name,
    role: 'EMPLOYEE',
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  setItem(KEYS.USERS, users);
  addActivityLog(undefined, 'USER_INVITED', `${name} (${email}) was invited`);
  return sanitizeUser(newUser);
}

// ── RSVP ──────────────────────────────────────────────────────────────────────
export function getMyRsvp(userId: string): RSVP | null {
  const rsvps = getItem<RSVP[]>(KEYS.RSVPS, []);
  return rsvps.find((r) => r.userId === userId) || null;
}

export function submitRsvp(userId: string, attending: boolean): RSVP {
  const rsvps = getItem<RSVP[]>(KEYS.RSVPS, []);
  const existing = rsvps.find((r) => r.userId === userId);
  const user = getUserById(userId);

  if (existing) {
    existing.attending = attending;
    existing.updatedAt = new Date().toISOString();
    setItem(KEYS.RSVPS, rsvps);
    addActivityLog(userId, 'RSVP_UPDATED', `${user?.name || 'User'} changed RSVP to ${attending ? 'Yes' : 'No'}`);
    return existing;
  }

  const rsvp: RSVP = {
    id: uuid(),
    userId,
    attending,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    user: user ? { id: user.id, name: user.name, email: user.email } : undefined,
  };
  rsvps.push(rsvp);
  setItem(KEYS.RSVPS, rsvps);
  addActivityLog(userId, 'RSVP_SUBMITTED', `${user?.name || 'User'} RSVP'd ${attending ? 'Yes' : 'No'}`);
  return rsvp;
}

export function getRsvpCounts(): RSVPCounts {
  const rsvps = getItem<RSVP[]>(KEYS.RSVPS, []);
  const users = getItem<User[]>(KEYS.USERS, []);
  const employees = users.filter((u) => u.role === 'EMPLOYEE');
  const attending = rsvps.filter((r) => r.attending).length;
  const notAttending = rsvps.filter((r) => !r.attending).length;
  const total = employees.length;
  return {
    attending,
    notAttending,
    total,
    pending: total - attending - notAttending,
  };
}

export function getAllRsvps(): RSVP[] {
  const rsvps = getItem<RSVP[]>(KEYS.RSVPS, []);
  const users = getItem<User[]>(KEYS.USERS, []);

  return rsvps.map((r) => {
    const user = users.find((u) => u.id === r.userId);
    return {
      ...r,
      user: user ? { id: user.id, name: user.name, email: user.email } : r.user,
    };
  });
}

// ── Polls ─────────────────────────────────────────────────────────────────────
export function getPolls(userId: string): Poll[] {
  const polls = getItem<(Poll & { votes?: Record<string, string> })[]>(KEYS.POLLS, []);
  return polls
    .filter((p) => p.isActive)
    .map((p) => ({
      ...p,
      userVote: p.votes?.[userId] || null,
      options: p.options.map((o) => ({
        ...o,
        percentage: p.options.reduce((s, x) => s + x.voteCount, 0) > 0
          ? Math.round((o.voteCount / p.options.reduce((s, x) => s + x.voteCount, 0)) * 100)
          : 0,
      })),
    }));
}

export function votePoll(pollId: string, optionId: string, userId: string): void {
  const polls = getItem<(Poll & { votes?: Record<string, string> })[]>(KEYS.POLLS, []);
  const poll = polls.find((p) => p.id === pollId);
  if (!poll) throw new Error('Poll not found');

  if (!poll.votes) poll.votes = {};
  const previousVote = poll.votes[userId];

  // If user already voted for same option, do nothing
  if (previousVote === optionId) return;

  // Remove previous vote count
  if (previousVote) {
    const prevOpt = poll.options.find((o) => o.id === previousVote);
    if (prevOpt) prevOpt.voteCount = Math.max(0, prevOpt.voteCount - 1);
  }

  // Add new vote
  const opt = poll.options.find((o) => o.id === optionId);
  if (!opt) throw new Error('Option not found');
  opt.voteCount += 1;
  poll.votes[userId] = optionId;

  setItem(KEYS.POLLS, polls);
}

export function createPoll(question: string, options: string[]): Poll {
  const polls = getItem<(Poll & { votes?: Record<string, string> })[]>(KEYS.POLLS, []);
  const newPoll: Poll & { votes: Record<string, string> } = {
    id: uuid(),
    question,
    isActive: true,
    createdAt: new Date().toISOString(),
    userVote: null,
    votes: {},
    options: options.map((text) => ({
      id: uuid(),
      text,
      voteCount: 0,
      percentage: 0,
    })),
  };
  polls.push(newPoll);
  setItem(KEYS.POLLS, polls);
  addActivityLog(undefined, 'POLL_CREATED', `New poll: "${question}"`);
  return newPoll;
}

export function deletePoll(pollId: string): void {
  const polls = getItem<any[]>(KEYS.POLLS, []);
  setItem(KEYS.POLLS, polls.filter((p) => p.id !== pollId));
}

// ── Photos ────────────────────────────────────────────────────────────────────
export function getPhotos(limit = 1000): { photos: Photo[] } {
  const photos = getItem<Photo[]>(KEYS.PHOTOS, []);
  return {
    photos: photos.slice(0, limit).sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    ),
  };
}

export async function uploadPhotos(
  files: File[],
  caption: string,
  userId: string
): Promise<void> {
  const photos = getItem<Photo[]>(KEYS.PHOTOS, []);
  const user = getUserById(userId);

  for (const file of files) {
    const dataUrl = await readFileAsDataURL(file);
    // Create a thumbnail (smaller version)
    const thumbnail = await createThumbnail(dataUrl, 400);

    const photo: Photo = {
      id: uuid(),
      url: dataUrl,
      thumbnailUrl: thumbnail,
      caption: caption || undefined,
      likes: 0,
      likedBy: [],
      uploadedAt: new Date().toISOString(),
      uploaderId: userId,
      uploader: user
        ? { id: user.id, name: user.name, avatar: user.avatar }
        : { id: userId, name: 'Unknown' },
    };
    photos.unshift(photo);
  }

  setItem(KEYS.PHOTOS, photos);
  addActivityLog(userId, 'PHOTO_UPLOADED', `${user?.name || 'User'} uploaded ${files.length} photo(s)`);
}

export function togglePhotoLike(photoId: string, userId: string): void {
  const photos = getItem<Photo[]>(KEYS.PHOTOS, []);
  const photo = photos.find((p) => p.id === photoId);
  if (!photo) return;

  if (!photo.likedBy) photo.likedBy = [];
  const idx = photo.likedBy.indexOf(userId);
  if (idx === -1) {
    photo.likedBy.push(userId);
    photo.likes += 1;
  } else {
    photo.likedBy.splice(idx, 1);
    photo.likes = Math.max(0, photo.likes - 1);
  }
  setItem(KEYS.PHOTOS, photos);
}

export function deletePhoto(photoId: string): void {
  const photos = getItem<Photo[]>(KEYS.PHOTOS, []);
  setItem(KEYS.PHOTOS, photos.filter((p) => p.id !== photoId));
}

export function getLeaderboard(): Leaderboard {
  const photos = getItem<Photo[]>(KEYS.PHOTOS, []);
  const users = getItem<User[]>(KEYS.USERS, []);

  // Most uploads
  const uploadCounts = new Map<string, number>();
  photos.forEach((p) => {
    uploadCounts.set(p.uploaderId, (uploadCounts.get(p.uploaderId) || 0) + 1);
  });

  const mostUploads = Array.from(uploadCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([uid, count]) => {
      const u = users.find((x) => x.id === uid);
      return { user: { id: uid, name: u?.name || 'Unknown', avatar: u?.avatar }, count };
    });

  // Most liked
  const mostLiked = [...photos].sort((a, b) => b.likes - a.likes).slice(0, 5);

  return { mostUploads, mostLiked };
}

// ── Messages ──────────────────────────────────────────────────────────────────
export function getMessages(): { messages: Message[] } {
  const messages = getItem<Message[]>(KEYS.MESSAGES, []);
  return { messages };
}

export function sendMessage(content: string, userId: string, isGlobal = true): Message {
  const messages = getItem<Message[]>(KEYS.MESSAGES, []);
  const user = getUserById(userId);
  const users = getItem<(User & { password?: string })[]>(KEYS.USERS, []);
  const fullUser = users.find((u) => u.id === userId);

  const msg: Message = {
    id: uuid(),
    senderId: userId,
    content,
    isGlobal,
    createdAt: new Date().toISOString(),
    sender: {
      id: userId,
      name: user?.name || 'Unknown',
      avatar: user?.avatar,
      role: fullUser?.role || 'EMPLOYEE',
    },
  };
  messages.push(msg);
  setItem(KEYS.MESSAGES, messages);
  return msg;
}

// ── Feedback ──────────────────────────────────────────────────────────────────
export function submitFeedback(
  data: { rating: number; message: string; category: string; isAnonymous: boolean },
  userId: string
): Feedback {
  const feedbacks = getItem<Feedback[]>(KEYS.FEEDBACKS, []);
  const user = getUserById(userId);

  const feedback: Feedback = {
    id: uuid(),
    userId: data.isAnonymous ? undefined : userId,
    isAnonymous: data.isAnonymous,
    rating: data.rating,
    message: data.message,
    category: data.category as any,
    submittedAt: new Date().toISOString(),
    user: data.isAnonymous ? undefined : user ? { id: user.id, name: user.name, avatar: user.avatar, email: user.email } : undefined,
    displayName: data.isAnonymous ? 'Anonymous' : user?.name || 'Unknown',
  };
  feedbacks.push(feedback);
  setItem(KEYS.FEEDBACKS, feedbacks);
  addActivityLog(data.isAnonymous ? undefined : userId, 'FEEDBACK_SUBMITTED', `${feedback.displayName} submitted feedback`);
  return feedback;
}

export function getFeedbacks(): Feedback[] {
  return getItem<Feedback[]>(KEYS.FEEDBACKS, []).sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );
}

// ── Event Config ──────────────────────────────────────────────────────────────
export function getEventConfig(): EventConfig {
  return getItem<EventConfig>(KEYS.EVENT_CONFIG, {
    id: 'evt-1',
    outingDate: '2026-04-01T09:00:00.000Z',
    venueName: 'Sunset Beach Resort',
    venueAddress: '123 Ocean Drive, Goa, India',
    description: 'Join us for a day of adventure, relaxation, and team bonding at the beautiful Sunset Beach Resort! Activities include beach games, kayaking, team challenges, and an epic BBQ dinner.',
  });
}

export function updateEventConfig(update: Partial<EventConfig>): EventConfig {
  const config = getEventConfig();
  const updated = { ...config, ...update };
  setItem(KEYS.EVENT_CONFIG, updated);
  return updated;
}

// ── Admin Stats ───────────────────────────────────────────────────────────────
export function getAdminStats(): AdminStats {
  const users = getItem<User[]>(KEYS.USERS, []);
  const employees = users.filter((u) => u.role === 'EMPLOYEE');
  const rsvps = getItem<RSVP[]>(KEYS.RSVPS, []);
  const photos = getItem<Photo[]>(KEYS.PHOTOS, []);
  const feedbacks = getItem<Feedback[]>(KEYS.FEEDBACKS, []);
  const messages = getItem<Message[]>(KEYS.MESSAGES, []);

  const attending = rsvps.filter((r) => r.attending).length;
  const notAttending = rsvps.filter((r) => !r.attending).length;
  const total = employees.length;

  return {
    totalInvited: total,
    attending,
    notAttending,
    pending: total - attending - notAttending,
    attendingPercent: total > 0 ? Math.round((attending / total) * 100) : 0,
    notAttendingPercent: total > 0 ? Math.round((notAttending / total) * 100) : 0,
    photoCount: photos.length,
    feedbackCount: feedbacks.length,
    messageCount: messages.length,
  };
}

// ── Activity Log ──────────────────────────────────────────────────────────────
export function getActivityLog(): ActivityLog[] {
  return getItem<ActivityLog[]>(KEYS.ACTIVITY_LOG, []).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

function addActivityLog(userId: string | undefined, action: string, details: string): void {
  const logs = getItem<ActivityLog[]>(KEYS.ACTIVITY_LOG, []);
  const user = userId ? getUserById(userId) : undefined;
  logs.push({
    id: uuid(),
    userId,
    action,
    details,
    createdAt: new Date().toISOString(),
    user: user ? { id: user.id, name: user.name, avatar: user.avatar } : undefined,
  });
  setItem(KEYS.ACTIVITY_LOG, logs);
}

// ── File Helpers ──────────────────────────────────────────────────────────────
function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function createThumbnail(dataUrl: string, maxSize: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      if (width > height) {
        if (width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// ── Reset (dev helper) ────────────────────────────────────────────────────────
export function resetDB(): void {
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
  initDB();
}
