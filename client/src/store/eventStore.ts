import { create } from 'zustand';
import api from '../lib/api';
import type { EventConfig } from '../types';

interface EventState {
  config: EventConfig | null;
  isLoading: boolean;
  fetchConfig: () => Promise<void>;
  updateConfig: (data: Partial<EventConfig>) => Promise<void>;
}

export const useEventStore = create<EventState>((set) => ({
  config: null,
  isLoading: false,

  fetchConfig: async () => {
    try {
      set({ isLoading: true });
      const { data } = await api.get<EventConfig>('/event/config');
      set({ config: data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  updateConfig: async (update) => {
    const { data } = await api.put<EventConfig>('/admin/event-config', update);
    set({ config: data });
  },
}));
