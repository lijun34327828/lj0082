import { useEffect } from 'react';
import { MapPin, Battery, BatteryCharging, XCircle, Zap } from 'lucide-react';
import { useStationStore } from '@/stores/stationStore';

export default function Overview() {
  const { stations, fetchStations } = useStationStore();

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  const totalStations = stations.length;
  const totalDevices = stations.reduce((a, s) => a + s.totalSlots, 0);
  const totalAvailable = stations.reduce((a, s) => a + (s.availableCount ?? 0), 0);
  const totalRented = stations.reduce((a, s) => a + (s.rentedCount ?? 0), 0);
  const totalOffline = stations.reduce((a, s) => a + (s.offlineCount ?? 0), 0);

  const stats = [
    { label: '点位总数', value: totalStations, icon: MapPin, color: 'text-brand-green' },
    { label: '设备总数', value: totalDevices, icon: Zap, color: 'text-blue-400' },
    { label: '可用数量', value: totalAvailable, icon: BatteryCharging, color: 'text-brand-green' },
    { label: '已借出', value: totalRented, icon: Battery, color: 'text-yellow-400' },
    { label: '离线', value: totalOffline, icon: XCircle, color: 'text-brand-orange' },
  ];

  return (
    <div>
      <h1 className="mb-6 font-display text-xl font-bold text-white">点位总览</h1>

      <div className="mb-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card-dark rounded-xl border border-white/5 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-white/40">{s.label}</span>
                <Icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <p className={`font-display text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-left text-xs text-white/40">
              <th className="px-4 py-3">点位名称</th>
              <th className="px-4 py-3">地址</th>
              <th className="px-4 py-3">总槽位</th>
              <th className="px-4 py-3">可用</th>
              <th className="px-4 py-3">已借出</th>
              <th className="px-4 py-3">离线</th>
            </tr>
          </thead>
          <tbody>
            {stations.map((s) => (
              <tr key={s.id} className="border-b border-white/5 text-white/70">
                <td className="px-4 py-3 font-medium text-white">{s.name}</td>
                <td className="px-4 py-3 text-xs">{s.address}</td>
                <td className="px-4 py-3">{s.totalSlots}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-brand-green/10 px-2 py-0.5 text-xs text-brand-green">
                    {s.availableCount ?? 0}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-yellow-400/10 px-2 py-0.5 text-xs text-yellow-400">
                    {s.rentedCount ?? 0}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-brand-orange/10 px-2 py-0.5 text-xs text-brand-orange">
                    {s.offlineCount ?? 0}
                  </span>
                </td>
              </tr>
            ))}
            {stations.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-white/20">暂无数据</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
