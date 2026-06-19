import { useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { BatteryCharging, Clock, DollarSign } from 'lucide-react';
import { useRentalStore } from '@/stores/rentalStore';
import RentalCard from '@/components/RentalCard';
import type { Rental } from '@shared/types';

function formatTime(time: string): string {
  return new Date(time).toLocaleString('zh-CN');
}

export default function MyRentals() {
  const { activeRentals, rentalHistory, currentFees, fetchActiveRentals, fetchRentalHistory, returnRental } = useRentalStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadAll = useCallback(() => {
    fetchActiveRentals();
    fetchRentalHistory();
  }, [fetchActiveRentals, fetchRentalHistory]);

  useEffect(() => {
    loadAll();
    intervalRef.current = setInterval(fetchActiveRentals, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadAll, fetchActiveRentals]);

  const handleReturn = async (rentalId: number) => {
    try {
      const rental = activeRentals.find((r) => r.id === rentalId);
      await returnRental(rentalId, rental?.stationId ?? 1);
    } catch { /* handled */ }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-white">我的租借</h1>
        <Link
          to="/"
          className="rounded-full border border-white/10 px-4 py-1.5 text-xs text-white/60 transition-colors hover:border-white/20 hover:text-white"
        >
          租借充电宝
        </Link>
      </div>

      {activeRentals.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-medium text-brand-green">
            <BatteryCharging className="h-4 w-4" />
            进行中 ({activeRentals.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {activeRentals.map((r) => (
              <RentalCard
                key={r.id}
                rental={r}
                currentFee={currentFees[r.id]?.currentFee}
                onReturn={handleReturn}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 flex items-center gap-2 text-sm font-medium text-white/60">
          <Clock className="h-4 w-4" />
          历史记录
        </h2>
        {rentalHistory.length === 0 ? (
          <div className="py-12 text-center text-white/20">暂无历史记录</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left text-xs text-white/40">
                  <th className="px-4 py-3">设备</th>
                  <th className="px-4 py-3">点位</th>
                  <th className="px-4 py-3">开始时间</th>
                  <th className="px-4 py-3">结束时间</th>
                  <th className="px-4 py-3">状态</th>
                  <th className="px-4 py-3">费用</th>
                </tr>
              </thead>
              <tbody>
                {rentalHistory.map((r: Rental) => (
                  <tr key={r.id} className="border-b border-white/5 text-white/70">
                    <td className="px-4 py-3 font-mono text-xs">{r.deviceSerial ?? r.deviceId}</td>
                    <td className="px-4 py-3 text-xs">{r.stationName ?? r.stationId}</td>
                    <td className="px-4 py-3 text-xs">{formatTime(r.startTime)}</td>
                    <td className="px-4 py-3 text-xs">{r.endTime ? formatTime(r.endTime) : '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${
                        r.status === 'returned'
                          ? 'bg-white/5 text-white/50'
                          : 'bg-brand-orange/10 text-brand-orange'
                      }`}>
                        {r.status === 'returned' ? '已归还' : '已买断'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 font-display text-brand-green">
                        <DollarSign className="h-3 w-3" />
                        ¥{(r.totalFee ?? 0).toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
