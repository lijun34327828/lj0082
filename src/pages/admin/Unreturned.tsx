import { useEffect, useRef } from 'react';
import { AlertTriangle, Clock, DollarSign } from 'lucide-react';
import { useAdminStore } from '@/stores/adminStore';
import type { Rental } from '@shared/types';

function formatDuration(startTime: string): string {
  const start = new Date(startTime);
  const diffMs = Date.now() - start.getTime();
  const hours = Math.floor(diffMs / 3600000);
  const mins = Math.floor((diffMs % 3600000) / 60000);
  if (hours > 24) return `${Math.floor(hours / 24)}天${hours % 24}小时`;
  if (hours > 0) return `${hours}小时${mins}分钟`;
  return `${mins}分钟`;
}

function formatTime(time: string): string {
  return new Date(time).toLocaleString('zh-CN', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

export default function Unreturned() {
  const { unreturnedRentals, fetchUnreturnedRentals } = useAdminStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchUnreturnedRentals();
    intervalRef.current = setInterval(fetchUnreturnedRentals, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchUnreturnedRentals]);

  return (
    <div>
      <h1 className="mb-2 font-display text-xl font-bold text-white">未归还清单</h1>
      <p className="mb-6 flex items-center gap-1.5 text-xs text-brand-orange">
        <AlertTriangle className="h-3.5 w-3.5" />
        超过24小时未归还的设备
      </p>

      <div className="overflow-x-auto rounded-xl border border-white/5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-left text-xs text-white/40">
              <th className="px-4 py-3">订单ID</th>
              <th className="px-4 py-3">用户</th>
              <th className="px-4 py-3">设备编号</th>
              <th className="px-4 py-3">租借点位</th>
              <th className="px-4 py-3">开始时间</th>
              <th className="px-4 py-3">时长</th>
              <th className="px-4 py-3">当前费用</th>
              <th className="px-4 py-3">状态</th>
            </tr>
          </thead>
          <tbody>
            {unreturnedRentals.map((r: Rental) => {
              const isBoughtOut = r.status === 'bought_out';
              return (
                <tr
                  key={r.id}
                  className={`border-b border-white/5 ${isBoughtOut ? 'bg-brand-orange/5' : ''}`}
                >
                  <td className="px-4 py-3 font-mono text-xs text-white/70">#{r.id}</td>
                  <td className="px-4 py-3 text-xs">{r.userId}</td>
                  <td className="px-4 py-3 font-mono text-xs">{r.deviceSerial ?? r.deviceId}</td>
                  <td className="px-4 py-3 text-xs">{r.stationName ?? r.stationId}</td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap">{formatTime(r.startTime)}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-white/40" />
                      {formatDuration(r.startTime)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 font-display text-brand-green text-xs">
                      <DollarSign className="h-3 w-3" />
                      ¥{(r.currentFee ?? r.totalFee ?? 0).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                      isBoughtOut
                        ? 'bg-brand-orange/10 text-brand-orange'
                        : 'bg-brand-green/10 text-brand-green'
                    }`}>
                      {isBoughtOut ? '已买断' : '未归还'}
                    </span>
                  </td>
                </tr>
              );
            })}
            {unreturnedRentals.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-white/20">暂无未归还设备</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
