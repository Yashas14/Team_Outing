import { create } from 'zustand';
import * as db from '../lib/localDB';
import type { RSVP, RSVPCounts } from '../types';

interface RSVPState {
  myRsvp: RSVP | null;
  counts: RSVPCounts | null;
  allRsvps: RSVP[];
  isLoading: boolean;
  fetchMyRsvp: () => Promise<void>;
  fetchCounts: () => Promise<void>;
  fetchAllRsvps: () => Promise<void>;
  submitRsvp: (attending: boolean) => Promise<void>;
  updateRsvp: (attending: boolean) => Promise<void>;
  setCounts: (counts: RSVPCounts) => void;
}

function getCurrentUserId(): string {
  try {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored).id : '';
  } catch {
    return '';
  }
}

export const useRsvpStore = create<RSVPState>((set) => ({
  myRsvp: null,
  counts: null,
  allRsvps: [],
  isLoading: false,

  fetchMyRsvp: async () => {
    const userId = getCurrentUserId();
    if (!userId) return;
    const rsvp = db.getMyRsvp(userId);
    set({ myRsvp: rsvp });
  },

  fetchCounts: async () => {
    const counts = db.getRsvpCounts();
    set({ counts });
  },

  fetchAllRsvps: async () => {
    set({ isLoading: true });
    const allRsvps = db.getAllRsvps();
    set({ allRsvps, isLoading: false });
  },

  submitRsvp: async (attending: boolean) => {
    const userId = getCurrentUserId();
    const rsvp = db.submitRsvp(userId, attending);
    const counts = db.getRsvpCounts();
    set({ myRsvp: rsvp, counts });
  },

  updateRsvp: async (attending: boolean) => {
    const userId = getCurrentUserId();
    const rsvp = db.submitRsvp(userId, attending);
    const counts = db.getRsvpCounts();
    set({ myRsvp: rsvp, counts });
  },

  setCounts: (counts) => set({ counts }),
}));
