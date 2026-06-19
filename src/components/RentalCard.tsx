import { Clock, DollarSign, BatteryCharging } from 'lucide-react';
import type { Rental } from '@shared/types';

interface RentalCardProps {
  rental: Rental;
  currentFee?: number;
  onReturn?: (rentalId: number) => void;
}

function formatDuration(startTime: string): string {
  const start = new Date(startTime);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const hours = Math.floor(diffMs / 3600000);
  const mins = Math.floor((diffMs % 3600000) / 60000);
  if (hours > 0) return `${hours}小时${mins}分钟`;
  return `${mins}分钟`;
}

function formatTime(time: string): string {
  return new Date(time).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function RentalCard({ rental, currentFee, onReturn }: RentalCardProps) {
  const isActive = rental.status === 'active';
  const isBoughtOut = rental.status === 'bought_out';
  const fee = currentFee ?? rental.currentFee ?? rental.totalFee ?? 0;

  return (
    <div className={`card-dark rounded-xl border p-5 transition-all ${
      isActive ? 'border-brand-green/20' : isBoughtOut ? 'border-brand-orange/20' : 'border-white/5'
    }`}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BatteryCharging className={`h-5 w-5 ${isActive ? 'text-brand-green' : 'text-brand-orange'}`} />
          <span className="text-sm font-medium text-white">{rental.deviceSerial ?? `设备#${rental.deviceId}`}</span>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
          isActive
            ? 'bg-brand-green/10 text-brand-green'
            : isBoughtOut
              ? 'bg-brand-orange/10 text-brand-orange'
              : 'bg-white/10 text-white/60'
        }`}>
          {isActive ? '使用中' : isBoughtOut ? '已买断' : '已归还'}
        </span>
      </div>

      <div className="mb-3 space-y-1.5 text-xs text-white/50">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          <span>开始: {formatTime(rental.startTime)}</span>
          {isActive && <span className="ml-2 text-white/70">已使用 {formatDuration(rental.startTime)}</span>}
        </div>
        <div className="text-white/40">{rental.stationName ?? `点位#${rental.stationId}`}</div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <DollarSign className="h-4 w-4 text-brand-green" />
          <span className="font-display text-lg font-bold text-brand-green">
            ¥{fee.toFixed(2)}
          </span>
        </div>
        {isActive && onReturn && (
          <button
            onClick={() => onReturn(rental.id)}
            className="rounded-full border border-brand-green/30 bg-brand-green/10 px-4 py-1.5 text-xs font-medium text-brand-green transition-all hover:bg-brand-green/20 hover:shadow-[0_0_12px_rgba(0,230,138,0.15)]"
          >
            归还
          </button>
        )}
      </div>
    </div>
  );
}
