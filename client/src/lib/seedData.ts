/**
 * Seed data — mirrors the real backend seed (server/src/prisma/seed.ts) exactly.
 * Admin password: failsafe@123
 * Employees: no password on first load — they set it themselves on first login.
 */

import bcrypt from 'bcryptjs';
import type {
  User, RSVP, Poll, Photo, Message, Feedback, EventConfig, ActivityLog,
} from '../types';

// ── Users — only real admin accounts; employees are added via invite ──────────
export const DEMO_USERS: (User & { password?: string })[] = [
  // ── 3 Admins (password: failsafe@123) ──────────────────────────────────────
  {
    id: 'usr-admin-1',
    email: 'ashutosh.choudhary@siemens.com',
    name: 'Ashutosh Choudhary',
    role: 'ADMIN',
    password: 'failsafe@123',
    createdAt: '2026-01-15T10:00:00.000Z',
  },
  {
    id: 'usr-admin-2',
    email: 'd.yashas@siemens.com',
    name: 'Yashas D',
    role: 'ADMIN',
    password: 'failsafe@123',
    createdAt: '2026-01-15T10:00:00.000Z',
  },
  {
    id: 'usr-admin-3',
    email: 'nagarjuna.kn@siemens.com',
    name: 'Nagarjuna KN',
    role: 'ADMIN',
    password: 'failsafe@123',
    createdAt: '2026-01-15T10:00:00.000Z',
  },
];

const DEMO_RSVPS: RSVP[] = [];

// Polls — questions kept, all votes reset to 0
const DEMO_POLLS: (Poll & { votes: Record<string, string> })[] = [
  {
    id: 'poll-1',
    question: 'What activity are you most excited about?',
    isActive: true,
    createdAt: '2026-03-15T10:00:00.000Z',
    userVote: null,
    votes: {},
    options: [
      { id: 'opt-1a', text: '🏖️ Beach Volleyball',  voteCount: 0 },
      { id: 'opt-1b', text: '🎨 Team Art Workshop',  voteCount: 0 },
      { id: 'opt-1c', text: '🎮 Gaming Tournament',  voteCount: 0 },
      { id: 'opt-1d', text: '🧘 Yoga & Wellness',    voteCount: 0 },
      { id: 'opt-1e', text: '🍳 Cooking Challenge',  voteCount: 0 },
    ],
  },
  {
    id: 'poll-2',
    question: 'What cuisine should we have for lunch?',
    isActive: true,
    createdAt: '2026-03-18T14:00:00.000Z',
    userVote: null,
    votes: {},
    options: [
      { id: 'opt-2a', text: '🍔 BBQ & Grill',   voteCount: 0 },
      { id: 'opt-2b', text: '🍕 Italian',        voteCount: 0 },
      { id: 'opt-2c', text: '🍣 Japanese',       voteCount: 0 },
      { id: 'opt-2d', text: '🌮 Mexican',        voteCount: 0 },
      { id: 'opt-2e', text: '🥗 Healthy/Vegan',  voteCount: 0 },
    ],
  },
];

const DEMO_MESSAGES: Message[] = [];

const DEMO_FEEDBACKS: Feedback[] = [];

// Event config matches server/src/prisma/seed.ts exactly
const DEMO_EVENT_CONFIG: EventConfig = {
  id: 'default-config',
  outingDate: '2026-04-01T09:00:00.000Z',
  venueName: 'Sunset Beach Resort',
  venueAddress: '123 Ocean Drive, Crystal Bay, CA 90210',
  description:
    'Join us for an amazing day of fun, food, and team bonding! ' +
    'Beach games, BBQ lunch, team challenges, and sunset dinner await. ' +
    'This is going to be the best team outing yet! 🎉🌴',
  bannerUrl: undefined,
};

const DEMO_ACTIVITY_LOG: ActivityLog[] = [];

// ── Seed function ─────────────────────────────────────────────────────────────
export function seedDatabase(): void {
  // Hash any pre-set passwords (admin accounts) before persisting
  const usersToStore = DEMO_USERS.map((u) => ({
    ...u,
    password: u.password ? bcrypt.hashSync(u.password, 10) : undefined,
  }));
  localStorage.setItem('db_users', JSON.stringify(usersToStore));
  localStorage.setItem('db_rsvps', JSON.stringify(DEMO_RSVPS));
  localStorage.setItem('db_polls', JSON.stringify(DEMO_POLLS));
  localStorage.setItem('db_photos', JSON.stringify([])); // No demo photos (would be too large for localStorage)
  localStorage.setItem('db_messages', JSON.stringify(DEMO_MESSAGES));
  localStorage.setItem('db_feedbacks', JSON.stringify(DEMO_FEEDBACKS));
  localStorage.setItem('db_event_config', JSON.stringify(DEMO_EVENT_CONFIG));
  localStorage.setItem('db_activity_log', JSON.stringify(DEMO_ACTIVITY_LOG));
}
