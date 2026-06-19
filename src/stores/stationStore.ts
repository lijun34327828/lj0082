import { create } from 'zustand';
import type { Station } from '@shared/types';
import { getStations, getStation } from '@/utils/api';

interface StationState {
  stations: Station[];
  selectedStation: Station | null;
  loading: boolean;
  fetchStations: () => Promise<void>;
  selectStation: (id: number) => Promise<void>;
}

export const useStationStore = create<StationState>((set) => ({
  stations: [],
  selectedStation: null,
  loading: false,

  fetchStations: async () => {
    set({ loading: true });
    try {
      const stations = await getStations();
      set({ stations, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  selectStation: async (id: number) => {
    set({ loading: true });
    try {
      const station = await getStation(id);
      set({ selectedStation: station, loading: false });
    } catch {
      set({ loading: false });
    }
  },
}));
