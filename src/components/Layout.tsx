import { Link, Outlet, useLocation } from 'react-router-dom';
import { Battery, Shield } from 'lucide-react';

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-brand-dark text-white">
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-brand-dark/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-brand-green">
            <Battery className="h-6 w-6" />
            ⚡ ChargeGo
          </Link>
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className={`flex items-center gap-1.5 text-sm transition-colors ${
                !location.pathname.startsWith('/admin') ? 'text-brand-green' : 'text-white/60 hover:text-white'
              }`}
            >
              <Battery className="h-4 w-4" />
              顾客端
            </Link>
            <Link
              to="/admin"
              className={`flex items-center gap-1.5 text-sm transition-colors ${
                location.pathname.startsWith('/admin') ? 'text-brand-green' : 'text-white/60 hover:text-white'
              }`}
            >
              <Shield className="h-4 w-4" />
              运维后台
            </Link>
          </div>
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
