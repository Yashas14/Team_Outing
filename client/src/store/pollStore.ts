import { create } from 'zustand';
import * as db from '../lib/localDB';
import type { Poll, PollResults } from '../types';

interface PollState {
  polls: Poll[];
  isLoading: boolean;
  fetchPolls: () => Promise<void>;
  vote: (pollId: string, optionId: string) => Promise<void>;
  createPoll: (question: string, options: string[]) => Promise<void>;
  deletePoll: (pollId: string) => Promise<void>;
  updatePollResults: (pollId: string, results: PollResults) => void;
}

function getCurrentUserId(): string {
  try {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored).id : '';
  } catch {
    return '';
  }
}

export const usePollStore = create<PollState>((set, get) => ({
  polls: [],
  isLoading: false,

  fetchPolls: async () => {
    set({ isLoading: true });
    const userId = getCurrentUserId();
    const polls = db.getPolls(userId);
    set({ polls, isLoading: false });
  },

  vote: async (pollId: string, optionId: string) => {
    const userId = getCurrentUserId();
    db.votePoll(pollId, optionId, userId);
    await get().fetchPolls();
  },

  createPoll: async (question: string, options: string[]) => {
    db.createPoll(question, options);
    await get().fetchPolls();
  },

  deletePoll: async (pollId: string) => {
    db.deletePoll(pollId);
    set({ polls: get().polls.filter((p) => p.id !== pollId) });
  },

  updatePollResults: (pollId, results) => {
    set({
      polls: get().polls.map((p) =>
        p.id === pollId
          ? {
              ...p,
              options: results.options.map((o) => ({
                ...o,
                voteCount: o.voteCount,
                percentage: o.percentage,
              })),
            }
          : p
      ),
    });
  },
}));
