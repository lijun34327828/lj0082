import { Clock, DollarSign, BatteryCharging, AlertTriangle } from 'lucide-react';
import type { Rental } from '@shared/types';

interface RentalCardProps {
  rental: Rental;
  currentFee?: number;
  isBuyout?: boolean;
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

export default function RentalCard({ rental, currentFee, isBuyout, onReturn }: RentalCardProps) {
  const isActive = rental.status === 'active';
  const isBoughtOut = rental.status === 'bought_out';
  const fee = currentFee ?? rental.currentFee ?? rental.totalFee ?? 0;

  return (
    <div className={`card-dark rounded-xl border p-5 transition-all ${
      isBoughtOut ? 'border-brand-orange/20' : isBuyout ? 'border-brand-orange/30' : isActive ? 'border-brand-green/20' : 'border-white/5'
    }`}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BatteryCharging className={`h-5 w-5 ${isBoughtOut || isBuyout ? 'text-brand-orange' : 'text-brand-green'}`} />
          <span className="text-sm font-medium text-white">{rental.deviceSerial ?? `设备#${rental.deviceId}`}</span>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
          isBoughtOut
            ? 'bg-brand-orange/10 text-brand-orange'
            : isBuyout
              ? 'bg-brand-orange/10 text-brand-orange'
              : isActive
                ? 'bg-brand-green/10 text-brand-green'
                : 'bg-white/10 text-white/60'
        }`}>
          {isBoughtOut ? '已买断' : isBuyout ? '待买断' : isActive ? '使用中' : '已归还'}
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

      {isBuyout && isActive && (
        <div className="mb-3 flex items-center gap-1.5 rounded-lg bg-brand-orange/10 px-3 py-2 text-xs text-brand-orange">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>已超24小时，归还时将按买断结算</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <DollarSign className={`h-4 w-4 ${isBoughtOut || isBuyout ? 'text-brand-orange' : 'text-brand-green'}`} />
          <span className={`font-display text-lg font-bold ${isBoughtOut || isBuyout ? 'text-brand-orange' : 'text-brand-green'}`}>
            ¥{fee.toFixed(2)}
          </span>
        </div>
        {isActive && onReturn && (
          <button
            onClick={() => onReturn(rental.id)}
            className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-all ${
              isBuyout
                ? 'border-brand-orange/30 bg-brand-orange/10 text-brand-orange hover:bg-brand-orange/20 hover:shadow-[0_0_12px_rgba(255,159,67,0.15)]'
                : 'border-brand-green/30 bg-brand-green/10 text-brand-green hover:bg-brand-green/20 hover:shadow-[0_0_12px_rgba(0,230,138,0.15)]'
            }`}
          >
            {isBuyout ? '买断结算' : '归还'}
          </button>
        )}
      </div>
    </div>
  );
}
