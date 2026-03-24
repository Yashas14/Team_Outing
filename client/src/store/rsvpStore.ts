import { create } from 'zustand';
import api from '../lib/api';
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

export const useRsvpStore = create<RSVPState>((set) => ({
  myRsvp: null,
  counts: null,
  allRsvps: [],
  isLoading: false,

  fetchMyRsvp: async () => {
    try {
      const { data } = await api.get('/rsvp/mine');
      set({ myRsvp: data });
    } catch {
      set({ myRsvp: null });
    }
  },

  fetchCounts: async () => {
    try {
      const { data } = await api.get<RSVPCounts>('/rsvp/counts');
      set({ counts: data });
    } catch {}
  },

  fetchAllRsvps: async () => {
    try {
      set({ isLoading: true });
      const { data } = await api.get<RSVP[]>('/rsvp/all');
      set({ allRsvps: data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  submitRsvp: async (attending: boolean) => {
    const { data } = await api.post<RSVP>('/rsvp', { attending });
    set({ myRsvp: data });
  },

  updateRsvp: async (attending: boolean) => {
    const { data } = await api.put<RSVP>('/rsvp', { attending });
    set({ myRsvp: data });
  },

  setCounts: (counts) => set({ counts }),
}));
