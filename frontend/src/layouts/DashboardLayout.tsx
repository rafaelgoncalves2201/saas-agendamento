import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../services/api';
import {
  LayoutDashboard,
  Calendar,
  Clock,
  Scissors,
  UserCheck,
  Users,
  ShoppingBag,
  Package,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
  Tag,
  Sun,
  Moon,
  Monitor,
  Star,
} from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { theme, setTheme, effectiveTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [companyData, setCompanyData] = useState<any>(null);

  useEffect(() => {
    if (user?.company) {
      setCompanyData(user.company);
    }
    api.get('/companies/my-company')
      .then((res) => {
        setCompanyData(res.data);
      })
      .catch(() => {});
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const planSlug = (companyData?.subscription?.plan?.slug || '').toLowerCase();
  const isBasicPlan = planSlug === 'basic' || planSlug === 'starter';
  const hasInventory = !isBasicPlan;

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Agendamentos', path: '/appointments', icon: Calendar },
    { label: 'Lista de Espera', path: '/waitlist', icon: Clock },
    { label: 'Avaliações', path: '/reviews', icon: Star },
    { label: 'Serviços', path: '/services', icon: Scissors },
    { label: 'Profissionais', path: '/professionals', icon: UserCheck },
    { label: 'Disponibilidade', path: '/availability', icon: Calendar },
    { label: 'Clientes (CRM)', path: '/clients', icon: Users },
    ...(hasInventory ? [{ label: 'Estoque & Insumos', path: '/products', icon: Package }] : []),
    { label: 'Cupons de Desconto', path: '/coupons', icon: Tag },
    { label: 'Minha Assinatura', path: '/subscription', icon: CreditCard },
    { label: 'Personalização', path: '/settings', icon: Settings },
  ];

  const companySlug = companyData?.slug || user?.company?.slug;
  const primaryColor = companyData?.settings?.primaryColor || '#E6D4B0';

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-slate-950 text-stone-900 dark:text-stone-100 flex flex-col md:flex-row transition-colors">
      {/* Mobile Topbar */}
      <div className="md:hidden bg-white dark:bg-slate-900 border-b border-[#EAE1D2] dark:border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-900 font-bold overflow-hidden shadow-xs"
            style={{ backgroundColor: primaryColor }}
          >
            {companyData?.logoUrl ? (
              <img src={companyData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              (companyData?.name?.charAt(0) || 'I').toUpperCase()
            )}
          </div>
          <span className="font-bold text-stone-900 dark:text-white text-sm truncate max-w-[140px]">
            {companyData?.name || 'Inovae Agenda'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick theme toggle for mobile */}
          <button
            onClick={() => setTheme(effectiveTheme === 'dark' ? 'light' : 'dark')}
            className="p-2 text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white rounded-lg hover:bg-[#FAF8F5] dark:hover:bg-slate-800 transition-colors"
            title="Alternar Tema Claro/Escuro"
          >
            {effectiveTheme === 'dark' ? <Sun size={19} className="text-amber-400" /> : <Moon size={19} />}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white rounded-lg"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-[#EAE1D2] dark:border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 md:static ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="overflow-y-auto flex-1">
          {/* Logo & Tenant Info */}
          <div className="p-5 border-b border-[#EAE1D2] dark:border-slate-800 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-stone-900 font-bold text-lg shadow-sm overflow-hidden shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              {companyData?.logoUrl ? (
                <img src={companyData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                companyData?.name ? companyData.name.charAt(0).toUpperCase() : 'I'
              )}
            </div>
            <div className="overflow-hidden">
              <h2 className="font-bold text-stone-900 dark:text-white text-sm truncate">
                {companyData?.name || 'Inovae Agenda'}
              </h2>
              <span
                className="text-xs font-semibold"
                style={{ color: primaryColor === '#E6D4B0' ? '#9E7E45' : primaryColor }}
              >
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
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#E6D4B0]/25 dark:bg-[#E6D4B0]/15 text-stone-900 dark:text-[#E6D4B0] font-bold border border-[#E6D4B0]/50'
                      : 'text-stone-500 dark:text-slate-400 hover:bg-[#FAF8F5] dark:hover:bg-slate-800 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <Icon
                    size={17}
                    className={isActive ? 'text-stone-900 dark:text-[#E6D4B0]' : 'text-stone-500 dark:text-slate-400'}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Super Admin Area Link */}
            {user?.role === 'SUPER_ADMIN' && (
              <div className="pt-3 mt-3 border-t border-[#EAE1D2] dark:border-slate-800">
                <Link
                  to="/admin"
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
                >
                  <ShieldCheck size={18} />
                  Super Admin
                </Link>
              </div>
            )}
          </nav>
        </div>

        {/* Footer info & Public link */}
        <div className="p-4 border-t border-[#EAE1D2] dark:border-slate-800 space-y-3">
          {/* Seletor de Tema */}
          <div>
            <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-slate-400 font-semibold mb-1.5 px-0.5">
              <span>Aparência</span>
              <span className="text-[10px] text-stone-800 dark:text-[#E6D4B0] font-bold">
                {theme === 'system' ? 'Padrão' : theme === 'dark' ? 'Escuro' : 'Claro'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1 bg-[#FAF8F5] dark:bg-slate-800/60 p-1 rounded-xl border border-[#EAE1D2] dark:border-slate-800">
              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  theme === 'system'
                    ? 'bg-[#E6D4B0] text-stone-900 shadow-xs font-bold'
                    : 'text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-slate-200'
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
                    ? 'bg-[#E6D4B0] text-stone-900 shadow-xs font-bold'
                    : 'text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-slate-200'
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
                    ? 'bg-[#E6D4B0] text-stone-900 shadow-xs font-bold'
                    : 'text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-slate-200'
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
              className="flex items-center justify-between w-full px-3 py-2 text-xs font-bold text-stone-900 dark:text-stone-100 bg-[#FAF8F5] dark:bg-slate-800 hover:bg-[#E6D4B0]/30 rounded-xl border border-[#EAE1D2] dark:border-slate-700 transition-colors"
            >
              <span>Ver Página Pública</span>
              <ExternalLink size={13} className="text-stone-900 dark:text-[#E6D4B0]" />
            </a>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-[#EAE1D2] dark:border-slate-800">
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-stone-900 dark:text-white truncate">{user?.name}</p>
              <p className="text-[11px] text-stone-500 dark:text-slate-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sair"
              className="p-1.5 text-stone-500 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
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
