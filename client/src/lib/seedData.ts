/**
 * Seed data — pre-populates localStorage with realistic demo data.
 * Called once when the app first loads (or after a DB reset).
 */

import type {
  User, RSVP, Poll, Photo, Message, Feedback, EventConfig, ActivityLog,
} from '../types';

// ── Demo Users (password for admin is "admin123", employees have no password initially) ──
export const DEMO_USERS: (User & { password?: string })[] = [
  {
    id: 'usr-admin-1',
    email: 'admin@siemens.com',
    name: 'Priya Sharma',
    role: 'ADMIN',
    password: 'admin123',
    createdAt: '2026-01-15T10:00:00.000Z',
  },
  {
    id: 'usr-emp-1',
    email: 'rahul.kumar@siemens.com',
    name: 'Rahul Kumar',
    role: 'EMPLOYEE',
    password: 'password',
    createdAt: '2026-01-20T10:00:00.000Z',
  },
  {
    id: 'usr-emp-2',
    email: 'ananya.patel@siemens.com',
    name: 'Ananya Patel',
    role: 'EMPLOYEE',
    password: 'password',
    createdAt: '2026-01-20T10:00:00.000Z',
  },
  {
    id: 'usr-emp-3',
    email: 'vikram.singh@siemens.com',
    name: 'Vikram Singh',
    role: 'EMPLOYEE',
    password: 'password',
    createdAt: '2026-01-21T10:00:00.000Z',
  },
  {
    id: 'usr-emp-4',
    email: 'neha.gupta@siemens.com',
    name: 'Neha Gupta',
    role: 'EMPLOYEE',
    password: 'password',
    createdAt: '2026-01-22T10:00:00.000Z',
  },
  {
    id: 'usr-emp-5',
    email: 'arjun.mehta@siemens.com',
    name: 'Arjun Mehta',
    role: 'EMPLOYEE',
    password: 'password',
    createdAt: '2026-01-23T10:00:00.000Z',
  },
  {
    id: 'usr-emp-6',
    email: 'divya.nair@siemens.com',
    name: 'Divya Nair',
    role: 'EMPLOYEE',
    password: 'password',
    createdAt: '2026-01-24T10:00:00.000Z',
  },
  {
    id: 'usr-emp-7',
    email: 'karthik.reddy@siemens.com',
    name: 'Karthik Reddy',
    role: 'EMPLOYEE',
    password: 'password',
    createdAt: '2026-01-25T10:00:00.000Z',
  },
  {
    id: 'usr-emp-8',
    email: 'meera.joshi@siemens.com',
    name: 'Meera Joshi',
    role: 'EMPLOYEE',
    createdAt: '2026-02-01T10:00:00.000Z',
  },
  {
    id: 'usr-emp-9',
    email: 'sanjay.verma@siemens.com',
    name: 'Sanjay Verma',
    role: 'EMPLOYEE',
    createdAt: '2026-02-05T10:00:00.000Z',
  },
  {
    id: 'usr-emp-10',
    email: 'pooja.shah@siemens.com',
    name: 'Pooja Shah',
    role: 'EMPLOYEE',
    createdAt: '2026-02-10T10:00:00.000Z',
  },
];

const DEMO_RSVPS: RSVP[] = [
  {
    id: 'rsvp-1', userId: 'usr-emp-1', attending: true,
    createdAt: '2026-03-10T14:30:00.000Z', updatedAt: '2026-03-10T14:30:00.000Z',
    user: { id: 'usr-emp-1', name: 'Rahul Kumar', email: 'rahul.kumar@siemens.com' },
  },
  {
    id: 'rsvp-2', userId: 'usr-emp-2', attending: true,
    createdAt: '2026-03-11T09:15:00.000Z', updatedAt: '2026-03-11T09:15:00.000Z',
    user: { id: 'usr-emp-2', name: 'Ananya Patel', email: 'ananya.patel@siemens.com' },
  },
  {
    id: 'rsvp-3', userId: 'usr-emp-3', attending: true,
    createdAt: '2026-03-12T16:45:00.000Z', updatedAt: '2026-03-12T16:45:00.000Z',
    user: { id: 'usr-emp-3', name: 'Vikram Singh', email: 'vikram.singh@siemens.com' },
  },
  {
    id: 'rsvp-4', userId: 'usr-emp-4', attending: false,
    createdAt: '2026-03-13T11:20:00.000Z', updatedAt: '2026-03-13T11:20:00.000Z',
    user: { id: 'usr-emp-4', name: 'Neha Gupta', email: 'neha.gupta@siemens.com' },
  },
  {
    id: 'rsvp-5', userId: 'usr-emp-5', attending: true,
    createdAt: '2026-03-14T08:00:00.000Z', updatedAt: '2026-03-14T08:00:00.000Z',
    user: { id: 'usr-emp-5', name: 'Arjun Mehta', email: 'arjun.mehta@siemens.com' },
  },
  {
    id: 'rsvp-6', userId: 'usr-emp-6', attending: true,
    createdAt: '2026-03-15T13:30:00.000Z', updatedAt: '2026-03-15T13:30:00.000Z',
    user: { id: 'usr-emp-6', name: 'Divya Nair', email: 'divya.nair@siemens.com' },
  },
  {
    id: 'rsvp-7', userId: 'usr-emp-7', attending: false,
    createdAt: '2026-03-16T10:00:00.000Z', updatedAt: '2026-03-16T10:00:00.000Z',
    user: { id: 'usr-emp-7', name: 'Karthik Reddy', email: 'karthik.reddy@siemens.com' },
  },
];

const DEMO_POLLS: (Poll & { votes: Record<string, string> })[] = [
  {
    id: 'poll-1',
    question: '🍕 What should we have for lunch?',
    isActive: true,
    createdAt: '2026-03-15T10:00:00.000Z',
    userVote: null,
    votes: {
      'usr-emp-1': 'opt-1a',
      'usr-emp-2': 'opt-1b',
      'usr-emp-3': 'opt-1a',
      'usr-emp-5': 'opt-1c',
      'usr-emp-6': 'opt-1a',
    },
    options: [
      { id: 'opt-1a', text: 'BBQ & Grill 🔥', voteCount: 3 },
      { id: 'opt-1b', text: 'Buffet Spread 🍱', voteCount: 1 },
      { id: 'opt-1c', text: 'Pizza Party 🍕', voteCount: 1 },
      { id: 'opt-1d', text: 'Street Food Festival 🌮', voteCount: 0 },
    ],
  },
  {
    id: 'poll-2',
    question: '🎮 Best team activity?',
    isActive: true,
    createdAt: '2026-03-18T14:00:00.000Z',
    userVote: null,
    votes: {
      'usr-emp-1': 'opt-2b',
      'usr-emp-2': 'opt-2a',
      'usr-emp-3': 'opt-2c',
      'usr-emp-4': 'opt-2b',
    },
    options: [
      { id: 'opt-2a', text: 'Beach Volleyball 🏐', voteCount: 1 },
      { id: 'opt-2b', text: 'Treasure Hunt 🗺️', voteCount: 2 },
      { id: 'opt-2c', text: 'Kayaking 🛶', voteCount: 1 },
      { id: 'opt-2d', text: 'Cricket Match 🏏', voteCount: 0 },
    ],
  },
];

const DEMO_MESSAGES: Message[] = [
  {
    id: 'msg-1', senderId: 'usr-admin-1', content: 'Hey everyone! 🎉 The Team Outing 2026 portal is live! RSVP now and let us know if you\'re joining the fun!',
    isGlobal: true, createdAt: '2026-03-10T09:00:00.000Z',
    sender: { id: 'usr-admin-1', name: 'Priya Sharma', role: 'ADMIN' },
  },
  {
    id: 'msg-2', senderId: 'usr-emp-1', content: 'This is going to be amazing! Already RSVP\'d YES 🙌',
    isGlobal: true, createdAt: '2026-03-10T14:35:00.000Z',
    sender: { id: 'usr-emp-1', name: 'Rahul Kumar', role: 'EMPLOYEE' },
  },
  {
    id: 'msg-3', senderId: 'usr-emp-2', content: 'Can\'t wait! Is there going to be beach volleyball this year? 🏐',
    isGlobal: true, createdAt: '2026-03-11T09:20:00.000Z',
    sender: { id: 'usr-emp-2', name: 'Ananya Patel', role: 'EMPLOYEE' },
  },
  {
    id: 'msg-4', senderId: 'usr-admin-1', content: 'Yes! Beach volleyball, kayaking, treasure hunt and more! Check out the polls to vote for your favorites 🗳️',
    isGlobal: true, createdAt: '2026-03-11T10:00:00.000Z',
    sender: { id: 'usr-admin-1', name: 'Priya Sharma', role: 'ADMIN' },
  },
  {
    id: 'msg-5', senderId: 'usr-emp-5', content: 'The venue looks incredible! Sunset Beach Resort is a great pick 🌅',
    isGlobal: true, createdAt: '2026-03-14T08:05:00.000Z',
    sender: { id: 'usr-emp-5', name: 'Arjun Mehta', role: 'EMPLOYEE' },
  },
  {
    id: 'msg-6', senderId: 'usr-emp-3', content: 'Who\'s bringing the cricket bat? 🏏😂',
    isGlobal: true, createdAt: '2026-03-15T11:00:00.000Z',
    sender: { id: 'usr-emp-3', name: 'Vikram Singh', role: 'EMPLOYEE' },
  },
  {
    id: 'msg-7', senderId: 'usr-emp-6', content: 'I just voted in both polls! Let\'s go BBQ! 🔥🔥',
    isGlobal: true, createdAt: '2026-03-16T15:30:00.000Z',
    sender: { id: 'usr-emp-6', name: 'Divya Nair', role: 'EMPLOYEE' },
  },
];

const DEMO_FEEDBACKS: Feedback[] = [
  {
    id: 'fb-1', userId: 'usr-emp-1', isAnonymous: false, rating: 5,
    message: 'Love the planning so far! The venue choice is perfect and the whole portal experience is top notch. Keep it up!',
    category: 'GENERAL', submittedAt: '2026-03-12T10:00:00.000Z',
    displayName: 'Rahul Kumar',
    user: { id: 'usr-emp-1', name: 'Rahul Kumar', email: 'rahul.kumar@siemens.com' },
  },
  {
    id: 'fb-2', isAnonymous: true, rating: 4,
    message: 'It would be great if we could have vegetarian and vegan options clearly labeled at the food stations.',
    category: 'FOOD', submittedAt: '2026-03-14T16:00:00.000Z',
    displayName: 'Anonymous',
  },
  {
    id: 'fb-3', userId: 'usr-emp-5', isAnonymous: false, rating: 5,
    message: 'Suggestion: Can we have a bonfire in the evening? That would be such a great way to end the day!',
    category: 'SUGGESTIONS', submittedAt: '2026-03-16T09:00:00.000Z',
    displayName: 'Arjun Mehta',
    user: { id: 'usr-emp-5', name: 'Arjun Mehta', email: 'arjun.mehta@siemens.com' },
  },
];

const DEMO_EVENT_CONFIG: EventConfig = {
  id: 'evt-1',
  outingDate: '2026-04-01T09:00:00.000Z',
  venueName: 'Sunset Beach Resort',
  venueAddress: '123 Ocean Drive, Goa, India',
  description:
    'Join us for an unforgettable day of adventure, relaxation, and team bonding at the beautiful Sunset Beach Resort! 🌴\n\nActivities include beach games, kayaking, treasure hunts, team challenges, and an epic BBQ dinner under the stars. Don\'t forget your sunscreen! ☀️',
  bannerUrl: undefined,
};

const DEMO_ACTIVITY_LOG: ActivityLog[] = [
  {
    id: 'act-1', userId: 'usr-admin-1', action: 'EVENT_CREATED',
    details: 'Priya Sharma created the Team Outing 2026 event',
    createdAt: '2026-03-10T08:00:00.000Z',
    user: { id: 'usr-admin-1', name: 'Priya Sharma' },
  },
  {
    id: 'act-2', userId: 'usr-emp-1', action: 'RSVP_SUBMITTED',
    details: 'Rahul Kumar RSVP\'d Yes',
    createdAt: '2026-03-10T14:30:00.000Z',
    user: { id: 'usr-emp-1', name: 'Rahul Kumar' },
  },
  {
    id: 'act-3', userId: 'usr-emp-2', action: 'RSVP_SUBMITTED',
    details: 'Ananya Patel RSVP\'d Yes',
    createdAt: '2026-03-11T09:15:00.000Z',
    user: { id: 'usr-emp-2', name: 'Ananya Patel' },
  },
  {
    id: 'act-4', userId: 'usr-admin-1', action: 'POLL_CREATED',
    details: 'New poll: "What should we have for lunch?"',
    createdAt: '2026-03-15T10:00:00.000Z',
    user: { id: 'usr-admin-1', name: 'Priya Sharma' },
  },
  {
    id: 'act-5', userId: 'usr-emp-3', action: 'RSVP_SUBMITTED',
    details: 'Vikram Singh RSVP\'d Yes',
    createdAt: '2026-03-12T16:45:00.000Z',
    user: { id: 'usr-emp-3', name: 'Vikram Singh' },
  },
  {
    id: 'act-6', userId: 'usr-emp-1', action: 'FEEDBACK_SUBMITTED',
    details: 'Rahul Kumar submitted feedback',
    createdAt: '2026-03-12T10:00:00.000Z',
    user: { id: 'usr-emp-1', name: 'Rahul Kumar' },
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
