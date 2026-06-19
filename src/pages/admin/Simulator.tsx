import { useState } from 'react';
import { Play, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { useAdminStore } from '@/stores/adminStore';
import type { SimulateResponse } from '@shared/types';

export default function Simulator() {
  const { simulateResult, simulateBilling, loading } = useAdminStore();
  const [hours, setHours] = useState(2);
  const [isHoliday, setIsHoliday] = useState(false);
  const [hourlyRate, setHourlyRate] = useState(2.0);
  const [buyoutPrice, setBuyoutPrice] = useState(99.0);
  const [multiplier, setMultiplier] = useState(1.0);

  const handleSimulate = () => {
    simulateBilling({ hours, isHoliday, hourlyRate, buyoutPrice, multiplier });
  };

  const result = simulateResult as SimulateResponse | null;

  return (
    <div>
      <h1 className="mb-6 font-display text-xl font-bold text-white">计费模拟</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card-dark rounded-xl border border-white/5 p-5">
          <h3 className="mb-4 text-sm font-medium text-white/70">参数设置</h3>

          <div className="space-y-5">
            <div>
              <div className="mb-2 flex justify-between text-xs text-white/50">
                <span>租借时长</span>
                <span className="font-display text-brand-green">{hours}小时</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="48"
                step="0.5"
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="w-full accent-brand-green"
              />
              <div className="flex justify-between text-xs text-white/20">
                <span>0.5h</span><span>48h</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-white/50">是否节假日</span>
              <button
                onClick={() => setIsHoliday(!isHoliday)}
                className={`rounded-full px-3 py-1 text-xs transition-all ${
                  isHoliday
                    ? 'bg-brand-orange/10 text-brand-orange'
                    : 'bg-white/5 text-white/40'
                }`}
              >
                {isHoliday ? '是' : '否'}
              </button>
            </div>

            <div>
              <label className="mb-1 block text-xs text-white/50">小时费率 (¥)</label>
              <input
                type="number"
                step="0.5"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-green/40"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-white/50">买断价格 (¥)</label>
              <input
                type="number"
                value={buyoutPrice}
                onChange={(e) => setBuyoutPrice(Number(e.target.value))}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-green/40"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-white/50">上浮倍数</label>
              <input
                type="number"
                step="0.1"
                value={multiplier}
                onChange={(e) => setMultiplier(Number(e.target.value))}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-green/40"
              />
            </div>
          </div>

          <button
            onClick={handleSimulate}
            disabled={loading}
            className="glow-green mt-6 flex w-full items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-brand-green/80 to-brand-green py-3 text-sm font-semibold text-brand-dark transition-all hover:shadow-[0_0_24px_rgba(0,230,138,0.3)] disabled:opacity-40"
          >
            <Play className="h-4 w-4" />
            {loading ? '计算中...' : '开始模拟'}
          </button>
        </div>

        <div className="card-dark rounded-xl border border-white/5 p-5">
          <h3 className="mb-4 text-sm font-medium text-white/70">模拟结果</h3>

          {!result ? (
            <div className="flex h-48 items-center justify-center text-white/20">
              设置参数后点击「开始模拟」
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] py-6">
                {result.buyoutTriggered ? (
                  <XCircle className="h-8 w-8 text-brand-orange" />
                ) : (
                  <CheckCircle className="h-8 w-8 text-brand-green" />
                )}
                <div>
                  <p className={`text-sm font-medium ${result.buyoutTriggered ? 'text-brand-orange' : 'text-brand-green'}`}>
                    {result.buyoutTriggered ? '触发买断' : '正常计费'}
                  </p>
                  <p className="text-xs text-white/30">
                    {result.buyoutTriggered ? '费用已达买断价格' : '未触发买断条件'}
                  </p>
                </div>
              </div>

              <div className="space-y-3 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/50">基础费用</span>
                  <span className="font-display text-white/70">¥{result.breakdown.baseFee.toFixed(2)}</span>
                </div>
                {result.breakdown.holidaySurcharge > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/50">节假日附加</span>
                    <span className="font-display text-brand-orange">+¥{result.breakdown.holidaySurcharge.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-white/5 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-sm text-white/70">
                      <DollarSign className="h-4 w-4 text-brand-green" />
                      总费用
                    </span>
                    <span className="font-display text-xl font-bold text-brand-green">
                      ¥{result.finalFee.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-white/20">
                租借费率: ¥{result.rentalFee.toFixed(2)} | 最终费用: ¥{result.finalFee.toFixed(2)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
