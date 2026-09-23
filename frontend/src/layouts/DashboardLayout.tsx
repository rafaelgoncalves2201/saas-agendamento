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

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Agendamentos', path: '/appointments', icon: Calendar },
    { label: 'Lista de Espera', path: '/waitlist', icon: Clock },
    { label: 'Avaliações', path: '/reviews', icon: Star },
    { label: 'Serviços', path: '/services', icon: Scissors },
    { label: 'Profissionais', path: '/professionals', icon: UserCheck },
    { label: 'Disponibilidade', path: '/availability', icon: Calendar },
    { label: 'Clientes (CRM)', path: '/clients', icon: Users },
    { label: 'Estoque & Insumos', path: '/products', icon: Package },
    { label: 'Cupons de Desconto', path: '/coupons', icon: Tag },
    { label: 'Minha Assinatura', path: '/subscription', icon: CreditCard },
    { label: 'Personalização', path: '/settings', icon: Settings },
  ];

  const companySlug = companyData?.slug || user?.company?.slug;
  const primaryColor = companyData?.settings?.primaryColor || '#6B3E26';

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#120D0A] text-[#2B1D15] dark:text-[#F8F5EE] flex flex-col md:flex-row transition-colors">
      {/* Mobile Topbar */}
      <div className="md:hidden bg-white dark:bg-[#1F1712] border-b border-[#E2D9CC] dark:border-[#382A21] px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold overflow-hidden shadow-xs"
            style={{ backgroundColor: primaryColor }}
          >
            {companyData?.logoUrl ? (
              <img src={companyData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              (companyData?.name?.charAt(0) || 'I').toUpperCase()
            )}
          </div>
          <span className="font-bold text-[#2B1D15] dark:text-[#FAF7F2] text-sm truncate max-w-[140px]">
            {companyData?.name || 'Inova Agenda'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick theme toggle for mobile */}
          <button
            onClick={() => setTheme(effectiveTheme === 'dark' ? 'light' : 'dark')}
            className="p-2 text-[#796758] dark:text-[#CDB196] hover:text-[#2B1D15] dark:hover:text-white rounded-lg hover:bg-[#FAF8F5] dark:hover:bg-[#251C16] transition-colors"
            title="Alternar Tema Claro/Escuro"
          >
            {effectiveTheme === 'dark' ? <Sun size={19} className="text-amber-400" /> : <Moon size={19} />}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#796758] dark:text-[#CDB196] hover:text-[#2B1D15] dark:hover:text-white rounded-lg"
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
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-[#1A130E] border-r border-[#E2D9CC] dark:border-[#382A21] flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 md:static ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="overflow-y-auto flex-1">
          {/* Logo & Tenant Info */}
          <div className="p-5 border-b border-[#E2D9CC] dark:border-[#382A21] flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm overflow-hidden shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              {companyData?.logoUrl ? (
                <img src={companyData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                companyData?.name ? companyData.name.charAt(0).toUpperCase() : 'I'
              )}
            </div>
            <div className="overflow-hidden">
              <h2 className="font-bold text-[#2B1D15] dark:text-[#F8F5EE] text-sm truncate">
                {companyData?.name || 'Inova Agenda'}
              </h2>
              <span
                className="text-xs font-semibold"
                style={{ color: primaryColor }}
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
                      ? 'bg-[#FAF5ED] dark:bg-[#2B1F14] text-[#6B3E26] dark:text-[#E2CEBC] font-bold border border-[#CDB196]/40 dark:border-[#523A2C]'
                      : 'text-[#796758] dark:text-[#CDB196] hover:bg-[#FAF8F5] dark:hover:bg-[#251C16] hover:text-[#2B1D15] dark:hover:text-white'
                  }`}
                >
                  <Icon
                    size={17}
                    className={isActive ? 'text-[#6B3E26] dark:text-[#E2CEBC]' : 'text-[#796758] dark:text-[#CDB196]'}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Super Admin Area Link */}
            {user?.role === 'SUPER_ADMIN' && (
              <div className="pt-3 mt-3 border-t border-[#E2D9CC] dark:border-[#382A21]">
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
        <div className="p-4 border-t border-[#E2D9CC] dark:border-[#382A21] space-y-3">
          {/* Seletor de Tema */}
          <div>
            <div className="flex items-center justify-between text-[11px] text-[#796758] dark:text-[#CDB196] font-semibold mb-1.5 px-0.5">
              <span>Aparência</span>
              <span className="text-[10px] text-[#6B3E26] dark:text-[#E2CEBC] font-bold">
                {theme === 'system' ? 'Padrão' : theme === 'dark' ? 'Escuro' : 'Claro'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1 bg-[#FAF8F5] dark:bg-[#251C16] p-1 rounded-xl border border-[#E2D9CC] dark:border-[#382A21]">
              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  theme === 'system'
                    ? 'bg-white dark:bg-[#34241B] text-[#6B3E26] dark:text-white shadow-xs'
                    : 'text-[#796758] dark:text-[#CDB196] hover:text-[#2B1D15] dark:hover:text-slate-200'
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
                    ? 'bg-white dark:bg-[#34241B] text-[#6B3E26] dark:text-white shadow-xs'
                    : 'text-[#796758] dark:text-[#CDB196] hover:text-[#2B1D15] dark:hover:text-slate-200'
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
                    ? 'bg-white dark:bg-[#34241B] text-[#6B3E26] dark:text-white shadow-xs'
                    : 'text-[#796758] dark:text-[#CDB196] hover:text-[#2B1D15] dark:hover:text-slate-200'
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
              className="flex items-center justify-between w-full px-3 py-2 text-xs font-bold text-[#6B3E26] dark:text-[#E2CEBC] bg-[#FAF5ED] dark:bg-[#261E18] hover:bg-[#F0EAE1] rounded-xl border border-[#CDB196]/40 dark:border-[#523A2C] transition-colors"
            >
              <span>Ver Página Pública</span>
              <ExternalLink size={13} className="text-[#6B3E26] dark:text-[#E2CEBC]" />
            </a>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-[#E2D9CC] dark:border-[#382A21]">
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-[#2B1D15] dark:text-[#F8F5EE] truncate">{user?.name}</p>
              <p className="text-[11px] text-[#796758] dark:text-[#CDB196] truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sair"
              className="p-1.5 text-[#796758] hover:text-red-600 rounded-lg transition-colors cursor-pointer"
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
