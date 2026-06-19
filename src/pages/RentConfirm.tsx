import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BatteryCharging, DollarSign, Zap } from 'lucide-react';
import type { Station, Device } from '@shared/types';
import { getStation, getDevicesByStation } from '@/utils/api';
import { useRentalStore } from '@/stores/rentalStore';
import { useAdminStore } from '@/stores/adminStore';

export default function RentConfirm() {
  const { stationId } = useParams<{ stationId: string }>();
  const navigate = useNavigate();
  const createRental = useRentalStore((s) => s.createRental);
  const { pricingRules, fetchPricingRules } = useAdminStore();

  const [station, setStation] = useState<Station | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [userId, setUserId] = useState('');
  const [selectedDevice, setSelectedDevice] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const sid = Number(stationId);

  useEffect(() => {
    if (!sid) return;
    getStation(sid).then(setStation).catch(() => navigate('/'));
    getDevicesByStation(sid).then((d) => setDevices(d)).catch(() => {});
    fetchPricingRules();
  }, [sid, navigate, fetchPricingRules]);

  const availableDevices = devices.filter((d) => d.status === 'available');
  const standardRule = pricingRules.find((r) => r.type === 'standard');

  const handleConfirm = async () => {
    if (!selectedDevice || !userId.trim()) {
      setError('请输入用户ID并选择设备');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await createRental({ stationId: sid, deviceId: selectedDevice, userId: userId.trim() });
      navigate('/my-rentals');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '租借失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (!station) return <div className="flex min-h-[60vh] items-center justify-center text-white/30">加载中...</div>;

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-1 text-sm text-white/50 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> 返回
      </button>

      <div className="card-dark rounded-xl border border-white/5 p-5">
        <h2 className="mb-1 text-lg font-semibold text-white">{station.name}</h2>
        <p className="mb-4 text-xs text-white/40">{station.address}</p>

        <div className="mb-5 rounded-lg border border-brand-green/10 bg-brand-green/5 p-3">
          <div className="flex items-center gap-2 text-sm text-brand-green">
            <BatteryCharging className="h-4 w-4" />
            可用设备 {availableDevices.length} 个
          </div>
        </div>

        {availableDevices.length > 0 && (
          <div className="mb-5">
            <p className="mb-2 text-xs text-white/50">选择设备</p>
            <div className="flex flex-wrap gap-2">
              {availableDevices.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDevice(d.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-all ${
                    selectedDevice === d.id
                      ? 'border-brand-green bg-brand-green/10 text-brand-green'
                      : 'border-white/10 text-white/50 hover:border-white/20'
                  }`}
                >
                  {d.serialNumber}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-5 rounded-lg bg-white/5 p-3 text-xs text-white/50">
          <div className="flex items-center gap-1.5 mb-1.5">
            <DollarSign className="h-3.5 w-3.5 text-brand-green" />
            <span className="text-white/70">费率信息</span>
          </div>
          <p>小时费率: ¥{standardRule?.hourlyRate ?? 2.0}/小时</p>
          <p>买断价格: ¥{standardRule?.buyoutPrice ?? 99.0}</p>
        </div>

        <div className="mb-5">
          <p className="mb-2 text-xs text-white/50">用户ID</p>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="请输入用户标识"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-brand-green/40"
          />
        </div>

        {error && <p className="mb-3 text-xs text-brand-orange">{error}</p>}

        <button
          onClick={handleConfirm}
          disabled={submitting || !selectedDevice || !userId.trim()}
          className="glow-green w-full rounded-full bg-gradient-to-r from-brand-green/80 to-brand-green py-3 text-sm font-semibold text-brand-dark transition-all hover:shadow-[0_0_24px_rgba(0,230,138,0.3)] disabled:opacity-40 disabled:hover:shadow-none"
        >
          <Zap className="mr-1 inline h-4 w-4" />
          {submitting ? '提交中...' : '确认租借'}
        </button>
      </div>
    </div>
  );
}
