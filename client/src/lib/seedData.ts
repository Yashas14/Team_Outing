/**
 * Seed data — mirrors the real backend seed (server/src/prisma/seed.ts) exactly.
 * Admin password: failsafe@123
 * Employees: no password on first load — they set it themselves on first login.
 */

import type {
  User, RSVP, Poll, Photo, Message, Feedback, EventConfig, ActivityLog,
} from '../types';

// ── Users (matches server/src/prisma/seed.ts exactly) ─────────────────────────
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

  // ── 10 Employees (NO password — set on first login) ────────────────────────
  {
    id: 'usr-emp-1',
    email: 'john.smith@siemens.com',
    name: 'John Smith',
    role: 'EMPLOYEE',
    // no password — triggers setup flow on first login
    createdAt: '2026-01-20T10:00:00.000Z',
  },
  {
    id: 'usr-emp-2',
    email: 'jane.doe@siemens.com',
    name: 'Jane Doe',
    role: 'EMPLOYEE',
    createdAt: '2026-01-20T10:00:00.000Z',
  },
  {
    id: 'usr-emp-3',
    email: 'bob.wilson@siemens.com',
    name: 'Bob Wilson',
    role: 'EMPLOYEE',
    createdAt: '2026-01-21T10:00:00.000Z',
  },
  {
    id: 'usr-emp-4',
    email: 'alice.johnson@siemens.com',
    name: 'Alice Johnson',
    role: 'EMPLOYEE',
    createdAt: '2026-01-22T10:00:00.000Z',
  },
  {
    id: 'usr-emp-5',
    email: 'charlie.brown@siemens.com',
    name: 'Charlie Brown',
    role: 'EMPLOYEE',
    createdAt: '2026-01-23T10:00:00.000Z',
  },
  {
    id: 'usr-emp-6',
    email: 'diana.prince@siemens.com',
    name: 'Diana Prince',
    role: 'EMPLOYEE',
    createdAt: '2026-01-24T10:00:00.000Z',
  },
  {
    id: 'usr-emp-7',
    email: 'evan.davis@siemens.com',
    name: 'Evan Davis',
    role: 'EMPLOYEE',
    createdAt: '2026-01-25T10:00:00.000Z',
  },
  {
    id: 'usr-emp-8',
    email: 'fiona.green@siemens.com',
    name: 'Fiona Green',
    role: 'EMPLOYEE',
    createdAt: '2026-02-01T10:00:00.000Z',
  },
  {
    id: 'usr-emp-9',
    email: 'george.miller@siemens.com',
    name: 'George Miller',
    role: 'EMPLOYEE',
    createdAt: '2026-02-05T10:00:00.000Z',
  },
  {
    id: 'usr-emp-10',
    email: 'hannah.white@siemens.com',
    name: 'Hannah White',
    role: 'EMPLOYEE',
    createdAt: '2026-02-10T10:00:00.000Z',
  },
];

const DEMO_RSVPS: RSVP[] = [
  {
    id: 'rsvp-1', userId: 'usr-emp-1', attending: true,
    createdAt: '2026-03-10T14:30:00.000Z', updatedAt: '2026-03-10T14:30:00.000Z',
    user: { id: 'usr-emp-1', name: 'John Smith', email: 'john.smith@siemens.com' },
  },
  {
    id: 'rsvp-2', userId: 'usr-emp-2', attending: true,
    createdAt: '2026-03-11T09:15:00.000Z', updatedAt: '2026-03-11T09:15:00.000Z',
    user: { id: 'usr-emp-2', name: 'Jane Doe', email: 'jane.doe@siemens.com' },
  },
  {
    id: 'rsvp-3', userId: 'usr-emp-3', attending: true,
    createdAt: '2026-03-12T16:45:00.000Z', updatedAt: '2026-03-12T16:45:00.000Z',
    user: { id: 'usr-emp-3', name: 'Bob Wilson', email: 'bob.wilson@siemens.com' },
  },
  {
    id: 'rsvp-4', userId: 'usr-emp-4', attending: false,
    createdAt: '2026-03-13T11:20:00.000Z', updatedAt: '2026-03-13T11:20:00.000Z',
    user: { id: 'usr-emp-4', name: 'Alice Johnson', email: 'alice.johnson@siemens.com' },
  },
  {
    id: 'rsvp-5', userId: 'usr-emp-5', attending: true,
    createdAt: '2026-03-14T08:00:00.000Z', updatedAt: '2026-03-14T08:00:00.000Z',
    user: { id: 'usr-emp-5', name: 'Charlie Brown', email: 'charlie.brown@siemens.com' },
  },
  {
    id: 'rsvp-6', userId: 'usr-emp-6', attending: true,
    createdAt: '2026-03-15T13:30:00.000Z', updatedAt: '2026-03-15T13:30:00.000Z',
    user: { id: 'usr-emp-6', name: 'Diana Prince', email: 'diana.prince@siemens.com' },
  },
  {
    id: 'rsvp-7', userId: 'usr-emp-7', attending: false,
    createdAt: '2026-03-16T10:00:00.000Z', updatedAt: '2026-03-16T10:00:00.000Z',
    user: { id: 'usr-emp-7', name: 'Evan Davis', email: 'evan.davis@siemens.com' },
  },
];

// Polls match the backend seed exactly
const DEMO_POLLS: (Poll & { votes: Record<string, string> })[] = [
  {
    id: 'poll-1',
    question: 'What activity are you most excited about?',
    isActive: true,
    createdAt: '2026-03-15T10:00:00.000Z',
    userVote: null,
    votes: {
      'usr-emp-1': 'opt-1a',
      'usr-emp-2': 'opt-1c',
      'usr-emp-3': 'opt-1a',
      'usr-emp-5': 'opt-1e',
      'usr-emp-6': 'opt-1b',
    },
    options: [
      { id: 'opt-1a', text: '🏖️ Beach Volleyball',  voteCount: 2 },
      { id: 'opt-1b', text: '🎨 Team Art Workshop',  voteCount: 1 },
      { id: 'opt-1c', text: '🎮 Gaming Tournament',  voteCount: 1 },
      { id: 'opt-1d', text: '🧘 Yoga & Wellness',    voteCount: 0 },
      { id: 'opt-1e', text: '🍳 Cooking Challenge',  voteCount: 1 },
    ],
  },
  {
    id: 'poll-2',
    question: 'What cuisine should we have for lunch?',
    isActive: true,
    createdAt: '2026-03-18T14:00:00.000Z',
    userVote: null,
    votes: {
      'usr-emp-1': 'opt-2a',
      'usr-emp-2': 'opt-2a',
      'usr-emp-3': 'opt-2c',
      'usr-emp-4': 'opt-2b',
    },
    options: [
      { id: 'opt-2a', text: '🍔 BBQ & Grill',   voteCount: 2 },
      { id: 'opt-2b', text: '🍕 Italian',        voteCount: 1 },
      { id: 'opt-2c', text: '🍣 Japanese',       voteCount: 1 },
      { id: 'opt-2d', text: '🌮 Mexican',        voteCount: 0 },
      { id: 'opt-2e', text: '🥗 Healthy/Vegan',  voteCount: 0 },
    ],
  },
];

const DEMO_MESSAGES: Message[] = [
  {
    id: 'msg-1', senderId: 'usr-admin-1',
    content: 'Hey everyone! 🎉 The Team Outing 2026 portal is live! RSVP now and let us know if you\'re joining the fun!',
    isGlobal: true, createdAt: '2026-03-10T09:00:00.000Z',
    sender: { id: 'usr-admin-1', name: 'Ashutosh Choudhary', role: 'ADMIN' },
  },
  {
    id: 'msg-2', senderId: 'usr-emp-1',
    content: 'This is going to be amazing! Already RSVP\'d YES 🙌',
    isGlobal: true, createdAt: '2026-03-10T14:35:00.000Z',
    sender: { id: 'usr-emp-1', name: 'John Smith', role: 'EMPLOYEE' },
  },
  {
    id: 'msg-3', senderId: 'usr-emp-2',
    content: 'Can\'t wait! Is there going to be beach volleyball this year? 🏐',
    isGlobal: true, createdAt: '2026-03-11T09:20:00.000Z',
    sender: { id: 'usr-emp-2', name: 'Jane Doe', role: 'EMPLOYEE' },
  },
  {
    id: 'msg-4', senderId: 'usr-admin-2',
    content: 'Yes! Beach volleyball, cooking challenge, gaming tournament and more! Check out the polls 🗳️',
    isGlobal: true, createdAt: '2026-03-11T10:00:00.000Z',
    sender: { id: 'usr-admin-2', name: 'Yashas D', role: 'ADMIN' },
  },
  {
    id: 'msg-5', senderId: 'usr-emp-5',
    content: 'The venue looks incredible! Sunset Beach Resort is a great pick 🌅',
    isGlobal: true, createdAt: '2026-03-14T08:05:00.000Z',
    sender: { id: 'usr-emp-5', name: 'Charlie Brown', role: 'EMPLOYEE' },
  },
  {
    id: 'msg-6', senderId: 'usr-emp-3',
    content: 'Voted for BBQ & Grill on the food poll — who\'s with me? 🔥',
    isGlobal: true, createdAt: '2026-03-15T11:00:00.000Z',
    sender: { id: 'usr-emp-3', name: 'Bob Wilson', role: 'EMPLOYEE' },
  },
  {
    id: 'msg-7', senderId: 'usr-emp-6',
    content: 'I just voted in both polls! Can\'t decide between beach volleyball and cooking challenge 😄',
    isGlobal: true, createdAt: '2026-03-16T15:30:00.000Z',
    sender: { id: 'usr-emp-6', name: 'Diana Prince', role: 'EMPLOYEE' },
  },
];

const DEMO_FEEDBACKS: Feedback[] = [
  {
    id: 'fb-1', userId: 'usr-emp-1', isAnonymous: false, rating: 5,
    message: 'Love the planning so far! The venue choice is perfect and the portal experience is top notch. Keep it up!',
    category: 'GENERAL', submittedAt: '2026-03-12T10:00:00.000Z',
    displayName: 'John Smith',
    user: { id: 'usr-emp-1', name: 'John Smith', email: 'john.smith@siemens.com' },
  },
  {
    id: 'fb-2', isAnonymous: true, rating: 4,
    message: 'Please make sure there are vegetarian and vegan options clearly labeled at all food stations.',
    category: 'FOOD', submittedAt: '2026-03-14T16:00:00.000Z',
    displayName: 'Anonymous',
  },
  {
    id: 'fb-3', userId: 'usr-emp-5', isAnonymous: false, rating: 5,
    message: 'Suggestion: Can we have a bonfire in the evening? That would be a perfect way to end the day!',
    category: 'SUGGESTIONS', submittedAt: '2026-03-16T09:00:00.000Z',
    displayName: 'Charlie Brown',
    user: { id: 'usr-emp-5', name: 'Charlie Brown', email: 'charlie.brown@siemens.com' },
  },
];

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

const DEMO_ACTIVITY_LOG: ActivityLog[] = [
  {
    id: 'act-1', userId: 'usr-admin-1', action: 'EVENT_CREATED',
    details: 'Ashutosh Choudhary created the Team Outing 2026 event',
    createdAt: '2026-03-10T08:00:00.000Z',
    user: { id: 'usr-admin-1', name: 'Ashutosh Choudhary' },
  },
  {
    id: 'act-2', userId: 'usr-emp-1', action: 'RSVP_SUBMITTED',
    details: 'John Smith RSVP\'d Yes',
    createdAt: '2026-03-10T14:30:00.000Z',
    user: { id: 'usr-emp-1', name: 'John Smith' },
  },
  {
    id: 'act-3', userId: 'usr-emp-2', action: 'RSVP_SUBMITTED',
    details: 'Jane Doe RSVP\'d Yes',
    createdAt: '2026-03-11T09:15:00.000Z',
    user: { id: 'usr-emp-2', name: 'Jane Doe' },
  },
  {
    id: 'act-4', userId: 'usr-admin-2', action: 'POLL_CREATED',
    details: 'New poll: "What activity are you most excited about?"',
    createdAt: '2026-03-15T10:00:00.000Z',
    user: { id: 'usr-admin-2', name: 'Yashas D' },
  },
  {
    id: 'act-5', userId: 'usr-emp-3', action: 'RSVP_SUBMITTED',
    details: 'Bob Wilson RSVP\'d Yes',
    createdAt: '2026-03-12T16:45:00.000Z',
    user: { id: 'usr-emp-3', name: 'Bob Wilson' },
  },
  {
    id: 'act-6', userId: 'usr-emp-1', action: 'FEEDBACK_SUBMITTED',
    details: 'John Smith submitted feedback',
    createdAt: '2026-03-12T10:00:00.000Z',
    user: { id: 'usr-emp-1', name: 'John Smith' },
  },
];

// ── Seed function ─────────────────────────────────────────────────────────────
export function seedDatabase(): void {
  localStorage.setItem('db_users', JSON.stringify(DEMO_USERS));
  localStorage.setItem('db_rsvps', JSON.stringify(DEMO_RSVPS));
  localStorage.setItem('db_polls', JSON.stringify(DEMO_POLLS));
  localStorage.setItem('db_photos', JSON.stringify([])); // No demo photos (would be too large for localStorage)
  localStorage.setItem('db_messages', JSON.stringify(DEMO_MESSAGES));
  localStorage.setItem('db_feedbacks', JSON.stringify(DEMO_FEEDBACKS));
  localStorage.setItem('db_event_config', JSON.stringify(DEMO_EVENT_CONFIG));
  localStorage.setItem('db_activity_log', JSON.stringify(DEMO_ACTIVITY_LOG));
}
