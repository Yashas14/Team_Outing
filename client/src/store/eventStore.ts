import { create } from 'zustand';
import { getEventConfig, updateEventConfig as updateConfig_ } from '../lib/localDB';
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
    set({ isLoading: true });
    const config = await getEventConfig();
    set({ config, isLoading: false });
  },

  updateConfig: async (update) => {
    const config = await updateConfig_(update);
    set({ config });
  },
}));
