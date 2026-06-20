import type { Station, Device, Rental, PricingRule, SimulateRequest, SimulateResponse, RevenueReport } from '@shared/types';

const API_BASE = '/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({ success: false, error: 'UNKNOWN_ERROR' })) as ApiResponse<T>;
  if (!res.ok || !data.success) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data.data as T;
}

export async function getStations(): Promise<Station[]> {
  return request<Station[]>('/stations');
}

export async function getStation(id: number): Promise<Station> {
  return request<Station>(`/stations/${id}`);
}

export async function getDevicesByStation(stationId: number): Promise<Device[]> {
  return request<Device[]>(`/devices/station/${stationId}`);
}

export async function getAvailableDevices(stationId: number): Promise<Device[]> {
  return request<Device[]>(`/devices/station/${stationId}/available`);
}

export async function createRental(params: { stationId: number; deviceId: number; userId: string }): Promise<Rental> {
  return request<Rental>('/rentals', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function returnRental(id: number, returnStationId: number): Promise<Rental> {
  return request<Rental>(`/rentals/${id}/return`, {
    method: 'POST',
    body: JSON.stringify({ returnStationId }),
  });
}

export async function getActiveRentals(userId?: string): Promise<Rental[]> {
  const qs = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  return request<Rental[]>(`/rentals/active${qs}`);
}

export async function getRentalHistory(userId?: string): Promise<Rental[]> {
  const qs = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  return request<Rental[]>(`/rentals/history${qs}`);
}

export async function getUnreturnedRentals(hours?: number): Promise<Rental[]> {
  const qs = hours ? `?hours=${hours}` : '';
  return request<Rental[]>(`/rentals/unreturned${qs}`);
}

export async function getCurrentFee(rentalId: number): Promise<{
  rentalId: number;
  currentFee: number;
  isBuyout: boolean;
  hours: number;
  billedHours: number;
  hourlyRate: number;
  multiplier: number;
  buyoutPrice: number;
  buyoutThreshold: number;
}> {
  return request(`/rentals/${rentalId}/current-fee`);
}

export async function getPricingRules(): Promise<PricingRule[]> {
  return request<PricingRule[]>('/pricing/rules');
}

export async function getApplicableRule(date?: string): Promise<PricingRule | null> {
  const qs = date ? `?date=${encodeURIComponent(date)}` : '';
  return request<PricingRule | null>(`/pricing/rules/applicable${qs}`);
}

export async function createPricingRule(rule: Omit<PricingRule, 'id'>): Promise<PricingRule> {
  return request<PricingRule>('/pricing/rules', {
    method: 'POST',
    body: JSON.stringify(rule),
  });
}

export async function updatePricingRule(id: number, rule: Partial<PricingRule>): Promise<PricingRule> {
  return request<PricingRule>(`/pricing/rules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(rule),
  });
}

export async function deletePricingRule(id: number): Promise<void> {
  await request(`/pricing/rules/${id}`, { method: 'DELETE' });
}

export async function simulateBilling(params: SimulateRequest): Promise<SimulateResponse> {
  return request<SimulateResponse>('/pricing/simulate', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function getRevenueReport(
  startDate: string,
  endDate: string,
  granularity: 'day' | 'week' | 'month',
): Promise<RevenueReport> {
  const qs = `?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}&granularity=${granularity}`;
  return request<RevenueReport>(`/admin/revenue${qs}`);
}
