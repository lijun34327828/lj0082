import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit, CheckCircle, XCircle } from 'lucide-react';
import { useAdminStore } from '@/stores/adminStore';
import type { PricingRule } from '@shared/types';

const emptyRule = {
  name: '',
  type: 'standard' as 'standard' | 'holiday',
  hourlyRate: 2.0,
  buyoutPrice: 99.0,
  startDate: null as string | null,
  endDate: null as string | null,
  multiplier: 1.0,
};

export default function PricingRules() {
  const { pricingRules, fetchPricingRules, createPricingRule, updatePricingRule, deletePricingRule } = useAdminStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyRule);

  useEffect(() => {
    fetchPricingRules();
  }, [fetchPricingRules]);

  const resetForm = () => {
    setForm(emptyRule);
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (rule: PricingRule) => {
    setEditingId(rule.id);
    setForm({
      name: rule.name,
      type: rule.type,
      hourlyRate: rule.hourlyRate,
      buyoutPrice: rule.buyoutPrice,
      startDate: rule.startDate,
      endDate: rule.endDate,
      multiplier: rule.multiplier,
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (editingId) {
      await updatePricingRule(editingId, form);
    } else {
      await createPricingRule(form);
    }
    resetForm();
  };

  const handleDelete = async (id: number) => {
    await deletePricingRule(id);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-white">计费规则</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-1.5 rounded-full bg-brand-green/10 px-4 py-2 text-xs font-medium text-brand-green transition-colors hover:bg-brand-green/20"
        >
          <Plus className="h-3.5 w-3.5" /> 新增规则
        </button>
      </div>

      {showForm && (
        <div className="card-dark mb-6 rounded-xl border border-white/5 p-5">
          <h3 className="mb-4 text-sm font-medium text-white">{editingId ? '编辑规则' : '新增规则'}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-white/40">规则名称</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-green/40"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/40">类型</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as 'standard' | 'holiday' })}
                className="w-full rounded-lg border border-white/10 bg-brand-card px-3 py-2 text-sm text-white outline-none focus:border-brand-green/40"
              >
                <option value="standard">标准</option>
                <option value="holiday">节假日</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/40">小时费率 (¥)</label>
              <input
                type="number"
                step="0.5"
                value={form.hourlyRate}
                onChange={(e) => setForm({ ...form, hourlyRate: Number(e.target.value) })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-green/40"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/40">买断价格 (¥)</label>
              <input
                type="number"
                value={form.buyoutPrice}
                onChange={(e) => setForm({ ...form, buyoutPrice: Number(e.target.value) })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-green/40"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/40">开始日期</label>
              <input
                type="date"
                value={form.startDate ?? ''}
                onChange={(e) => setForm({ ...form, startDate: e.target.value || null })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-green/40"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/40">结束日期</label>
              <input
                type="date"
                value={form.endDate ?? ''}
                onChange={(e) => setForm({ ...form, endDate: e.target.value || null })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-green/40"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/40">上浮倍数</label>
              <input
                type="number"
                step="0.1"
                value={form.multiplier}
                onChange={(e) => setForm({ ...form, multiplier: Number(e.target.value) })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-green/40"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleSubmit}
              className="flex items-center gap-1 rounded-full bg-brand-green px-4 py-2 text-xs font-medium text-brand-dark transition-all hover:shadow-[0_0_12px_rgba(0,230,138,0.2)]"
            >
              <CheckCircle className="h-3.5 w-3.5" /> 保存
            </button>
            <button
              onClick={resetForm}
              className="flex items-center gap-1 rounded-full border border-white/10 px-4 py-2 text-xs text-white/60 transition-colors hover:text-white"
            >
              <XCircle className="h-3.5 w-3.5" /> 取消
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {pricingRules.map((rule) => (
          <div
            key={rule.id}
            className={`card-dark rounded-xl border p-4 transition-all ${
              rule.type === 'holiday' ? 'border-brand-orange/20' : 'border-white/5'
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs ${
                  rule.type === 'holiday'
                    ? 'bg-brand-orange/10 text-brand-orange'
                    : 'bg-brand-green/10 text-brand-green'
                }`}>
                  {rule.type === 'holiday' ? '节假日' : '标准'}
                </span>
                <span className="text-sm font-medium text-white">{rule.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => handleEdit(rule)} className="rounded-lg p-1.5 text-white/30 transition-colors hover:bg-white/5 hover:text-white">
                  <Edit className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => handleDelete(rule.id)} className="rounded-lg p-1.5 text-white/30 transition-colors hover:bg-red-500/10 hover:text-red-400">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs text-white/50">
              <div>
                <p className="text-white/30">费率</p>
                <p className="font-display text-brand-green">¥{rule.hourlyRate}/h</p>
              </div>
              <div>
                <p className="text-white/30">买断价</p>
                <p className="font-display text-brand-orange">¥{rule.buyoutPrice}</p>
              </div>
              <div>
                <p className="text-white/30">倍数</p>
                <p className="font-display text-white/70">×{rule.multiplier}</p>
              </div>
            </div>
            {rule.startDate && rule.endDate && (
              <p className="mt-2 text-xs text-white/30">{rule.startDate} ~ {rule.endDate}</p>
            )}
          </div>
        ))}
        {pricingRules.length === 0 && (
          <div className="col-span-2 py-12 text-center text-white/20">暂无计费规则</div>
        )}
      </div>
    </div>
  );
}
