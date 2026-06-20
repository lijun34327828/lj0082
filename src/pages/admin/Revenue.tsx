import { useEffect, useState, useMemo, useCallback } from 'react';
import { TrendingUp, ShoppingCart, DollarSign, BarChart3, Percent, Clock } from 'lucide-react';
import { getRevenueReport } from '@/utils/api';
import type { RevenueReport } from '@shared/types';

type Granularity = 'day' | 'week' | 'month';

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getDefaultDates(): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 29);
  return { startDate: formatDate(start), endDate: formatDate(end) };
}

const CHART_W = 800;
const CHART_H = 320;
const PAD_L = 60;
const PAD_R = 20;
const PAD_T = 20;
const PAD_B = 50;
const INNER_W = CHART_W - PAD_L - PAD_R;
const INNER_H = CHART_H - PAD_T - PAD_B;

function RevenueChart({ data }: { data: Array<{ date: string; revenue: number }> }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[320px] items-center justify-center text-white/20">
        暂无数据
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  const yMax = Math.ceil(maxRevenue / 10) * 10 || 10;
  const yTicks = 5;

  const xStep = data.length > 1 ? INNER_W / (data.length - 1) : INNER_W;

  const points = data.map((d, i) => ({
    x: PAD_L + (data.length > 1 ? i * xStep : INNER_W / 2),
    y: PAD_T + INNER_H - (d.revenue / yMax) * INNER_H,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x},${PAD_T + INNER_H} L${points[0].x},${PAD_T + INNER_H} Z`;

  const xLabelInterval = Math.max(1, Math.ceil(data.length / 10));

  return (
    <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00e68a" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#00e68a" stopOpacity="0" />
        </linearGradient>
      </defs>

      {Array.from({ length: yTicks + 1 }).map((_, i) => {
        const val = (yMax / yTicks) * i;
        const y = PAD_T + INNER_H - (val / yMax) * INNER_H;
        return (
          <g key={`y-${i}`}>
            <line x1={PAD_L} y1={y} x2={PAD_L + INNER_W} y2={y} stroke="rgba(255,255,255,0.06)" />
            <text x={PAD_L - 8} y={y + 4} textAnchor="end" fill="rgba(255,255,255,0.35)" fontSize="11">
              {Math.round(val)}
            </text>
          </g>
        );
      })}

      <line x1={PAD_L} y1={PAD_T + INNER_H} x2={PAD_L + INNER_W} y2={PAD_T + INNER_H} stroke="rgba(255,255,255,0.15)" />

      <path d={areaPath} fill="url(#areaGrad)" />
      <path d={linePath} fill="none" stroke="#00e68a" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#00e68a" />
      ))}

      {data.map((d, i) => {
        if (i % xLabelInterval !== 0 && i !== data.length - 1) return null;
        const x = points[i].x;
        return (
          <text
            key={`xl-${i}`}
            x={x}
            y={PAD_T + INNER_H + 20}
            textAnchor="middle"
            fill="rgba(255,255,255,0.35)"
            fontSize="10"
          >
            {d.date.slice(5)}
          </text>
        );
      })}

      <text x={PAD_L - 8} y={PAD_T - 6} textAnchor="end" fill="rgba(255,255,255,0.25)" fontSize="10">
        元
      </text>
    </svg>
  );
}

type SortField = 'revenue' | 'orderCount';
type SortDir = 'asc' | 'desc';

export default function Revenue() {
  const { startDate: defStart, endDate: defEnd } = useMemo(() => getDefaultDates(), []);
  const [startDate, setStartDate] = useState(defStart);
  const [endDate, setEndDate] = useState(defEnd);
  const [granularity, setGranularity] = useState<Granularity>('day');
  const [report, setReport] = useState<RevenueReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState<SortField>('revenue');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRevenueReport(startDate, endDate, granularity);
      setReport(data);
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, granularity]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const sortedRanking = useMemo(() => {
    if (!report) return [];
    const arr = [...report.stationRanking];
    arr.sort((a, b) => {
      const diff = sortField === 'revenue' ? a.revenue - b.revenue : a.orderCount - b.orderCount;
      return sortDir === 'asc' ? diff : -diff;
    });
    return arr;
  }, [report, sortField, sortDir]);

  const summary = report?.summary;
  const summaryCards = [
    { label: '总订单数', value: summary ? String(summary.totalOrders) : '0', icon: ShoppingCart, color: 'text-blue-400' },
    { label: '总营收', value: summary ? `¥${summary.totalRevenue.toFixed(2)}` : '¥0.00', icon: DollarSign, color: 'text-brand-green' },
    { label: '日均营收', value: summary ? `¥${summary.avgDailyRevenue.toFixed(2)}` : '¥0.00', icon: TrendingUp, color: 'text-brand-orange' },
    { label: '买断订单占比', value: summary ? `${summary.buyoutRate.toFixed(1)}%` : '-', icon: Percent, color: 'text-purple-400' },
    { label: '平均租借时长', value: summary ? `${summary.avgRentHours.toFixed(1)}h` : '-', icon: Clock, color: 'text-yellow-400' },
  ];

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="ml-1 inline-block opacity-30">⇅</span>;
    return <span className="ml-1 inline-block">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div>
      <h1 className="mb-6 font-display text-xl font-bold text-white">营收报表</h1>

      <div className="card-dark mb-6 flex flex-wrap items-end gap-4 rounded-xl border border-white/5 p-4">
        <div>
          <label className="mb-1 block text-xs text-white/40">开始日期</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-green/40"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/40">结束日期</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-green/40"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/40">粒度</label>
          <div className="flex rounded-lg border border-white/10 bg-white/5">
            {(['day', 'week', 'month'] as Granularity[]).map((g) => (
              <button
                key={g}
                onClick={() => setGranularity(g)}
                className={`px-3 py-2 text-xs transition-colors ${
                  granularity === g
                    ? 'bg-brand-green/10 text-brand-green'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {g === 'day' ? '按天' : g === 'week' ? '按周' : '按月'}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 rounded-full bg-brand-green/10 px-4 py-2 text-xs font-medium text-brand-green transition-colors hover:bg-brand-green/20"
        >
          <BarChart3 className="h-3.5 w-3.5" /> 查询
        </button>
      </div>

      <div className="card-dark mb-6 rounded-xl border border-white/5 p-5">
        <h3 className="mb-3 text-sm font-medium text-white/70">营收趋势</h3>
        {loading ? (
          <div className="flex h-[320px] items-center justify-center text-white/20">加载中...</div>
        ) : (
          <RevenueChart data={report?.dailyData ?? []} />
        )}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="card-dark rounded-xl border border-white/5 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-white/40">{card.label}</span>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <p className={`font-display text-2xl font-bold ${card.color}`}>{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-left text-xs text-white/40">
              <th className="px-4 py-3">站点名称</th>
              <th className="cursor-pointer px-4 py-3 select-none" onClick={() => handleSort('orderCount')}>
                订单数<SortIcon field="orderCount" />
              </th>
              <th className="cursor-pointer px-4 py-3 select-none" onClick={() => handleSort('revenue')}>
                营收金额<SortIcon field="revenue" />
              </th>
              <th className="px-4 py-3">买断次数</th>
              <th className="px-4 py-3">平均时长</th>
            </tr>
          </thead>
          <tbody>
            {sortedRanking.map((row, idx) => (
              <tr key={idx} className="border-b border-white/5 text-white/70">
                <td className="px-4 py-3 font-medium text-white">{row.stationName}</td>
                <td className="px-4 py-3">{row.orderCount}</td>
                <td className="px-4 py-3">
                  <span className="font-display text-brand-green">¥{row.revenue.toFixed(2)}</span>
                </td>
                <td className="px-4 py-3">{row.buyoutCount}</td>
                <td className="px-4 py-3">{row.avgHours.toFixed(1)}h</td>
              </tr>
            ))}
            {sortedRanking.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-white/20">
                  {loading ? '加载中...' : '暂无数据'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
