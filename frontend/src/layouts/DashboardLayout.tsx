import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';
import {
  Calendar,
  Clock,
  Users,
  Scissors,
  ShoppingBag,
  CreditCard,
  Settings,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
  ExternalLink,
  Menu,
  X,
  UserCheck,
  Tag,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { theme, effectiveTheme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [companyData, setCompanyData] = useState<any>(null);

  useEffect(() => {
    if (user?.company) {
      setCompanyData(user.company);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Agendamentos', path: '/appointments', icon: Calendar },
    { label: 'Serviços', path: '/services', icon: Scissors },
    { label: 'Profissionais', path: '/professionals', icon: UserCheck },
    { label: 'Disponibilidade', path: '/availability', icon: Clock },
    { label: 'Clientes (CRM)', path: '/clients', icon: Users },
    { label: 'Produtos', path: '/products', icon: ShoppingBag },
    { label: 'Cupons de Desconto', path: '/coupons', icon: Tag },
    { label: 'Minha Assinatura', path: '/subscription', icon: CreditCard },
    { label: 'Personalização', path: '/settings', icon: Settings },
  ];

  const companySlug = companyData?.slug || user?.company?.slug;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row transition-colors">
      {/* Mobile Topbar */}
      <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
            S
          </div>
          <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate max-w-[140px]">
            {companyData?.name || 'SaaS Agendamento'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick theme toggle for mobile */}
          <button
            onClick={() => setTheme(effectiveTheme === 'dark' ? 'light' : 'dark')}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Alternar Tema Claro/Escuro"
          >
            {effectiveTheme === 'dark' ? <Sun size={19} className="text-amber-400" /> : <Moon size={19} />}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-30 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 md:static ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="overflow-y-auto flex-1">
          {/* Logo & Tenant Info */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-200 dark:shadow-none">
              {companyData?.name ? companyData.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="overflow-hidden">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">
                {companyData?.name || 'Meu Negócio'}
              </h2>
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                Plano {companyData?.subscription?.plan?.name || 'Starter'}
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'} />
                  {item.label}
                </Link>
              );
            })}

            {/* Super Admin Area Link */}
            {user?.role === 'SUPER_ADMIN' && (
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
                <Link
                  to="/admin"
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
                >
                  <ShieldCheck size={18} />
                  Super Admin
                </Link>
              </div>
            )}
          </nav>
        </div>

        {/* Footer info & Public link */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          {/* Seletor de Tema (Dispositivo / Claro / Escuro) */}
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold mb-1.5 px-0.5">
              <span>Aparência</span>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400">
                {theme === 'system' ? 'Padrão do Dispositivo' : theme === 'dark' ? 'Modo Escuro' : 'Modo Claro'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  theme === 'system'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Padrão do Dispositivo"
              >
                <Monitor size={13} />
                <span className="text-[11px]">Auto</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Modo Claro"
              >
                <Sun size={13} />
                <span className="text-[11px]">Claro</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Modo Escuro"
              >
                <Moon size={13} />
                <span className="text-[11px]">Escuro</span>
              </button>
            </div>
          </div>

          {companySlug && (
            <a
              href={`/empresa/${companySlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <span>Ver Página Pública</span>
              <ExternalLink size={14} className="text-slate-400 dark:text-slate-500" />
            </a>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">{user?.name}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sair"
              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-md transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

