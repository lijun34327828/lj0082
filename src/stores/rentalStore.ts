import { create } from 'zustand';
import type { Rental } from '@shared/types';
import {
  getActiveRentals,
  getRentalHistory,
  createRental as apiCreateRental,
  returnRental as apiReturnRental,
  getCurrentFee as apiGetCurrentFee,
} from '@/utils/api';

interface CurrentFeeInfo {
  currentFee: number;
  isBuyout: boolean;
  hours: number;
  billedHours: number;
}

interface RentalState {
  activeRentals: Rental[];
  rentalHistory: Rental[];
  currentFees: Record<number, CurrentFeeInfo>;
  loading: boolean;
  fetchActiveRentals: () => Promise<void>;
  fetchRentalHistory: () => Promise<void>;
  refreshCurrentFees: () => Promise<void>;
  createRental: (params: { stationId: number; deviceId: number; userId: string }) => Promise<Rental>;
  returnRental: (rentalId: number, returnStationId: number) => Promise<void>;
}

export const useRentalStore = create<RentalState>((set, get) => ({
  activeRentals: [],
  rentalHistory: [],
  currentFees: {},
  loading: false,

  fetchActiveRentals: async () => {
    set({ loading: true });
    try {
      const rentals = await getActiveRentals();
      set({ activeRentals: rentals, loading: false });
      await get().refreshCurrentFees();
    } catch {
      set({ loading: false });
    }
  },

  fetchRentalHistory: async () => {
    set({ loading: true });
    try {
      const rentals = await getRentalHistory();
      set({ rentalHistory: rentals, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  refreshCurrentFees: async () => {
    const activeRentals = get().activeRentals;
    if (activeRentals.length === 0) return;

    try {
      const newFees: Record<number, CurrentFeeInfo> = {};
      for (const rental of activeRentals) {
        try {
          const fee = await apiGetCurrentFee(rental.id);
          newFees[rental.id] = {
            currentFee: fee.currentFee,
            isBuyout: fee.isBuyout,
            hours: fee.hours,
            billedHours: fee.billedHours,
          };
        } catch {
          // skip individual failures
        }
      }
      set((state) => ({ currentFees: { ...state.currentFees, ...newFees } }));

      set((state) => ({
        activeRentals: state.activeRentals.map((r) => {
          const feeInfo = newFees[r.id];
          return feeInfo ? { ...r, currentFee: feeInfo.currentFee } : r;
        }),
      }));
    } catch {
      // ignore
    }
  },

  createRental: async (params) => {
    const rental = await apiCreateRental(params);
    set((state) => ({ activeRentals: [rental, ...state.activeRentals] }));
    return rental;
  },

  returnRental: async (rentalId, returnStationId) => {
    await apiReturnRental(rentalId, returnStationId);
    set((state) => ({
      activeRentals: state.activeRentals.filter((r) => r.id !== rentalId),
    }));
    const newFees = { ...get().currentFees };
    delete newFees[rentalId];
    set({ currentFees: newFees });
    await get().fetchRentalHistory();
  },
}));
