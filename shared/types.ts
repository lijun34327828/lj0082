export interface Station {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  totalSlots: number;
  availableCount?: number;
  rentedCount?: number;
  offlineCount?: number;
}

export interface Device {
  id: number;
  stationId: number;
  serialNumber: string;
  status: 'available' | 'rented' | 'offline';
}

export interface Rental {
  id: number;
  deviceId: number;
  stationId: number;
  userId: string;
  startTime: string;
  endTime: string | null;
  status: 'active' | 'returned' | 'bought_out';
  totalFee: number | null;
  stationName?: string;
  deviceSerial?: string;
  currentFee?: number;
  currentHours?: number;
  isBuyoutPending?: boolean;
  isBuyout?: boolean;
  billedHours?: number;
}

export interface PricingRule {
  id: number;
  name: string;
  type: 'standard' | 'holiday';
  hourlyRate: number;
  buyoutPrice: number;
  startDate: string | null;
  endDate: string | null;
  multiplier: number;
}

export interface SimulateRequest {
  hours: number;
  isHoliday: boolean;
  hourlyRate: number;
  buyoutPrice: number;
  multiplier: number;
}

export interface SimulateResponse {
  rentalFee: number;
  buyoutTriggered: boolean;
  finalFee: number;
  breakdown: {
    baseFee: number;
    holidaySurcharge: number;
    totalFee: number;
  };
}

export interface RevenueDailyData {
  date: string;
  revenue: number;
}

export interface RevenueSummary {
  totalOrders: number;
  totalRevenue: number;
  avgDailyRevenue: number;
  buyoutRate: number;
  avgRentHours: number;
}

export interface StationRanking {
  stationName: string;
  orderCount: number;
  revenue: number;
  buyoutCount: number;
  avgHours: number;
}

export interface RevenueReport {
  dailyData: RevenueDailyData[];
  summary: RevenueSummary;
  stationRanking: StationRanking[];
}
