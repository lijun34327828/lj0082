import { create } from 'zustand';
import type { PricingRule, Rental, SimulateRequest, SimulateResponse } from '@shared/types';
import {
  getPricingRules,
  createPricingRule as apiCreateRule,
  updatePricingRule as apiUpdateRule,
  deletePricingRule as apiDeleteRule,
  getUnreturnedRentals,
  simulateBilling as apiSimulate,
} from '@/utils/api';

interface AdminState {
  pricingRules: PricingRule[];
  unreturnedRentals: Rental[];
  simulateResult: SimulateResponse | null;
  loading: boolean;
  fetchPricingRules: () => Promise<void>;
  createPricingRule: (rule: Omit<PricingRule, 'id'>) => Promise<void>;
  updatePricingRule: (id: number, rule: Partial<PricingRule>) => Promise<void>;
  deletePricingRule: (id: number) => Promise<void>;
  fetchUnreturnedRentals: () => Promise<void>;
  simulateBilling: (params: SimulateRequest) => Promise<void>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  pricingRules: [],
  unreturnedRentals: [],
  simulateResult: null,
  loading: false,

  fetchPricingRules: async () => {
    set({ loading: true });
    try {
      const rules = await getPricingRules();
      set({ pricingRules: rules, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  createPricingRule: async (rule) => {
    await apiCreateRule(rule);
    await get().fetchPricingRules();
  },

  updatePricingRule: async (id, rule) => {
    await apiUpdateRule(id, rule);
    await get().fetchPricingRules();
  },

  deletePricingRule: async (id) => {
    await apiDeleteRule(id);
    await get().fetchPricingRules();
  },

  fetchUnreturnedRentals: async () => {
    set({ loading: true });
    try {
      const rentals = await getUnreturnedRentals();
      set({ unreturnedRentals: rentals, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  simulateBilling: async (params) => {
    set({ loading: true });
    try {
      const result = await apiSimulate(params);
      set({ simulateResult: result, loading: false });
    } catch {
      set({ loading: false });
    }
  },
}));
