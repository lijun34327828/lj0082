import { useNavigate } from 'react-router-dom';
import { BatteryCharging, MapPin } from 'lucide-react';
import type { Station } from '@shared/types';

interface StationCardProps {
  station: Station;
}

export default function StationCard({ station }: StationCardProps) {
  const navigate = useNavigate();
  const available = station.availableCount ?? 0;
  const total = station.totalSlots;
  const percent = total > 0 ? (available / total) * 100 : 0;
  const hasAvailable = available > 0;

  return (
    <div
      className={`card-dark group relative overflow-hidden rounded-xl border transition-all duration-300 ${
        hasAvailable
          ? 'border-white/5 hover:border-brand-green/40 hover:shadow-[0_0_24px_rgba(0,230,138,0.1)]'
          : 'border-white/5 opacity-60'
      }`}
    >
      {hasAvailable && (
        <div className="pulse-glow absolute -right-8 -top-8 h-24 w-24 rounded-full bg-brand-green/5" />
      )}
      <div className="p-5">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">{station.name}</h3>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-white/50">
              <MapPin className="h-3 w-3" />
              {station.address}
            </p>
          </div>
          <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
            hasAvailable ? 'bg-brand-green/10 text-brand-green' : 'bg-white/5 text-white/40'
          }`}>
            <BatteryCharging className="h-3.5 w-3.5" />
            {available}/{total}
          </div>
        </div>

        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-green/60 to-brand-green transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-white/40">
          <span>可用 {available} · 已借 {station.rentedCount ?? 0} · 离线 {station.offlineCount ?? 0}</span>
        </div>

        <button
          onClick={() => hasAvailable && navigate(`/rent/${station.id}`)}
          disabled={!hasAvailable}
          className={`mt-4 w-full rounded-full py-2 text-sm font-medium transition-all ${
            hasAvailable
              ? 'bg-gradient-to-r from-brand-green/80 to-brand-green text-brand-dark hover:shadow-[0_0_16px_rgba(0,230,138,0.3)]'
              : 'cursor-not-allowed bg-white/5 text-white/30'
          }`}
        >
          {hasAvailable ? '租借' : '暂无可用'}
        </button>
      </div>
    </div>
  );
}
