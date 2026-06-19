import { Link, Outlet, useLocation } from 'react-router-dom';
import { MapPin, AlertTriangle, Settings, Play, Zap } from 'lucide-react';

const navItems = [
  { to: '/admin', label: '点位总览', icon: MapPin, exact: true },
  { to: '/admin/unreturned', label: '未归还清单', icon: AlertTriangle },
  { to: '/admin/pricing', label: '计费规则', icon: Settings },
  { to: '/admin/simulator', label: '计费模拟', icon: Play },
];

export default function AdminLayout() {
  const location = useLocation();

  const isActive = (item: (typeof navItems)[0]) =>
    item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to);

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <aside className="w-56 shrink-0 border-r border-white/10 bg-brand-card/50">
        <div className="p-4">
          <div className="mb-4 flex items-center gap-2 font-display text-sm text-brand-green">
            <Zap className="h-4 w-4" />
            运维管理
          </div>
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-all ${
                    active
                      ? 'bg-brand-green/10 text-brand-green'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
      <div className="flex-1 overflow-auto p-6">
        <Outlet />
      </div>
    </div>
  );
}
