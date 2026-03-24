import { create } from 'zustand';
import api from '../lib/api';
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

export const usePollStore = create<PollState>((set, get) => ({
  polls: [],
  isLoading: false,

  fetchPolls: async () => {
    try {
      set({ isLoading: true });
      const { data } = await api.get<Poll[]>('/polls');
      set({ polls: data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  vote: async (pollId: string, optionId: string) => {
    await api.post(`/polls/${pollId}/vote`, { optionId });
    await get().fetchPolls();
  },

  createPoll: async (question: string, options: string[]) => {
    await api.post('/polls', { question, options });
    await get().fetchPolls();
  },

  deletePoll: async (pollId: string) => {
    await api.delete(`/polls/${pollId}`);
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
