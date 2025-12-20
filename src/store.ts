import { create } from 'zustand';
import { NetworkEvent } from './types';

interface AppState {
  events: NetworkEvent[];
  selectedEventIds: Set<string>;
  filter: 'all' | 'query' | 'mutation' | 'subscription' | 'persisted';
  searchQuery: string;

  addEvent: (event: NetworkEvent) => void;
  clearEvents: () => void;
  selectEvent: (id: string, multi: boolean) => void;
  selectMultiple: (ids: string[]) => void;
  toggleSelection: (id: string) => void;
  setFilter: (filter: AppState['filter']) => void;
  setSearchQuery: (query: string) => void;
}

export const useStore = create<AppState>((set) => ({
  events: [],
  selectedEventIds: new Set(),
  filter: 'all',
  searchQuery: '',

  addEvent: (event) => set((state) => ({ 
    events: [...state.events, event] 
  })),

  clearEvents: () => set({ 
    events: [], 
    selectedEventIds: new Set() 
  }),

  selectEvent: (id, multi) => set((state) => {
    const newSet = new Set(multi ? state.selectedEventIds : []);
    newSet.add(id);
    return { selectedEventIds: newSet };
  }),

  selectMultiple: (ids) => set((state) => {
    const newSet = new Set(state.selectedEventIds);
    ids.forEach(id => newSet.add(id));
    return { selectedEventIds: newSet };
  }),

  toggleSelection: (id) => set((state) => {
    const newSet = new Set(state.selectedEventIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    return { selectedEventIds: newSet };
  }),

  setFilter: (filter) => set({ filter }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));