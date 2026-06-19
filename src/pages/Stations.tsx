import { useEffect, useState } from 'react';
import { Search, Zap } from 'lucide-react';
import { useStationStore } from '@/stores/stationStore';
import StationCard from '@/components/StationCard';

export default function Stations() {
  const { stations, fetchStations } = useStationStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  const filtered = stations.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-10 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-green/20 bg-brand-green/5 px-4 py-1.5 text-xs text-brand-green">
          <Zap className="h-3.5 w-3.5" />
          随时随地，满电出发
        </div>
        <h1 className="font-display text-3xl font-bold text-white md:text-4xl">
          就近租借充电宝
        </h1>
        <p className="mt-2 text-sm text-white/40">扫描附近点位，一键租借，按时归还</p>
      </div>

      <div className="relative mb-8 mx-auto max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索点位名称或地址..."
          className="w-full rounded-full border border-white/10 bg-brand-card py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-brand-green/40"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="py-20 text-center text-white/30">暂无点位数据</div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((station) => (
            <StationCard key={station.id} station={station} />
          ))}
        </div>
      )}
    </div>
  );
}
