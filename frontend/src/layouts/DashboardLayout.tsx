import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';
import {
  LayoutDashboard,
  Calendar,
  Clock,
  Scissors,
  UserCheck,
  Users,
  Package,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Globe,
  ShieldCheck,
  Tag,
  Star,
  Search,
  Bell,
  ChevronDown,
} from 'lucide-react';
import { Logo } from '../components/brand/Logo';
import { Avatar } from '../components/ui/Avatar';
import { ThemeToggle } from '../components/ThemeToggle';
import { Modal } from '../components/ui/Modal';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [companyData, setCompanyData] = useState<any>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (user?.company) {
      setCompanyData(user.company);
    }
    api.get('/companies/my-company')
      .then((res) => {
        setCompanyData(res.data);
      })
      .catch(() => {});

    // Carregar notificações recentes se houver endpoint
    api.get('/notifications')
      .then((res) => {
        if (Array.isArray(res.data)) {
          setNotifications(res.data);
        }
      })
      .catch(() => {
        // Fallback para notificações de sistema
        setNotifications([
          {
            id: '1',
            title: 'Sistema Conectado',
            message: 'Seu painel Inovae Agenda está pronto e operacional.',
            read: false,
            createdAt: new Date().toISOString(),
          },
        ]);
      });
  }, [user]);

  // Tecla de atalho ⌘K ou Ctrl+K para busca rápida
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const planSlug = (companyData?.subscription?.plan?.slug || '').toLowerCase();
  const isBasicPlan = planSlug === 'basic' || planSlug === 'starter';
  const hasInventory = !isBasicPlan;
  const companySlug = companyData?.slug || user?.company?.slug;
  const planName = companyData?.subscription?.plan?.name || 'Profissional';

  // Grupos de navegação no padrão Alvore
  const navGroups = [
    {
      group: 'Geral',
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Agendamentos', path: '/appointments', icon: Calendar },
        { label: 'Lista de Espera', path: '/waitlist', icon: Clock },
        { label: 'Avaliações', path: '/reviews', icon: Star },
      ],
    },
    {
      group: 'Atendimento & Equipe',
      items: [
        { label: 'Serviços', path: '/services', icon: Scissors },
        { label: 'Profissionais', path: '/professionals', icon: UserCheck },
        { label: 'Disponibilidade', path: '/availability', icon: Calendar },
        { label: 'Clientes (CRM)', path: '/clients', icon: Users },
      ],
    },
    {
      group: 'Gestão & Vendas',
      items: [
        ...(hasInventory ? [{ label: 'Estoque & Insumos', path: '/products', icon: Package }] : []),
        { label: 'Cupons de Desconto', path: '/coupons', icon: Tag },
        { label: 'Minha Assinatura', path: '/subscription', icon: CreditCard },
      ],
    },
    {
      group: 'Configuração',
      items: [
        { label: 'Personalização', path: '/settings', icon: Settings },
      ],
    },
  ];

  const allNavItems = navGroups.flatMap((g) => g.items);
  const filteredNavItems = allNavItems.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  const markAllNotifsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-surface">
      {/* Brand & Company Info */}
      <div className="p-4 border-b border-border flex items-center gap-3">
        {companyData?.logoUrl ? (
          <img
            src={companyData.logoUrl}
            alt={companyData.name}
            className="w-10 h-10 rounded-xl object-cover ring-1 ring-border shadow-xs shrink-0"
          />
        ) : (
          <Avatar
            name={companyData?.name || 'Inovae Agenda'}
            size="md"
            className="rounded-xl shadow-xs shrink-0"
          />
        )}
        <div className="overflow-hidden min-w-0">
          <h2 className="font-bold text-foreground text-sm truncate leading-snug">
            {companyData?.name || 'Inovae Agenda'}
          </h2>
          <span className="text-xs font-semibold text-accent block truncate">
            Plano {planName}
          </span>
        </div>
      </div>

      {/* Grouped Navigation */}
      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-3">
        {navGroups.map((group) => (
          <div key={group.group}>
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground-subtle">
              {group.group}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                      isActive
                        ? 'bg-accent text-accent-foreground shadow-soft font-semibold'
                        : 'text-foreground-muted hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Super Admin Area Link se aplicável */}
        {user?.role === 'SUPER_ADMIN' && (
          <div className="pt-2 border-t border-border">
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-warning bg-warning/10 hover:bg-warning/20 transition"
            >
              <ShieldCheck className="h-[18px] w-[18px]" />
              <span>Super Admin</span>
            </Link>
          </div>
        )}
      </nav>

      {/* Footer Info & Public Site Link */}
      <div className="border-t border-border p-3 space-y-2">
        {companySlug && (
          <a
            href={`/agenda/${companySlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="chip w-full justify-center hover:bg-muted py-2 transition text-foreground-muted hover:text-foreground"
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Ver site público</span>
          </a>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-surface lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 border-r border-border bg-surface animate-fade-in">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl sm:px-6">
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="btn-ghost h-9 w-9 p-0 lg:hidden cursor-pointer"
            aria-label="Abrir Menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Quick Search Trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex h-9 flex-1 items-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm text-foreground-subtle transition hover:border-accent/40 sm:max-w-xs cursor-pointer"
          >
            <Search className="h-4 w-4" />
            <span className="truncate">Buscar...</span>
            <kbd className="ml-auto hidden rounded border border-border px-1.5 text-[10px] sm:inline font-mono">
              ⌘K
            </kbd>
          </button>

          {/* Right Header Actions */}
          <div className="ml-auto flex items-center gap-2">
            {/* Theme Toggle Alvore */}
            <ThemeToggle />

            {/* Notifications Popover */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotifOpen((v) => !v);
                  if (!notifOpen) markAllNotifsRead();
                }}
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-foreground-muted transition hover:text-foreground hover:shadow-soft cursor-pointer"
                aria-label="Notificações"
              >
                <Bell className="h-[18px] w-[18px]" />
                {unreadNotifsCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white shadow-xs">
                    {unreadNotifsCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setNotifOpen(false)}
                  />
                  <div className="absolute right-0 top-11 z-20 w-80 overflow-hidden rounded-2xl border border-border bg-surface shadow-elevated animate-scale-in">
                    <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-surface-2/40">
                      <p className="text-sm font-semibold text-foreground">Notificações</p>
                      {unreadNotifsCount > 0 && (
                        <button
                          onClick={markAllNotifsRead}
                          className="text-[11px] text-accent font-semibold hover:underline cursor-pointer"
                        >
                          Marcar lidas
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-border">
                      {notifications.length === 0 ? (
                        <p className="px-4 py-8 text-center text-sm text-foreground-subtle">
                          Nenhuma notificação no momento.
                        </p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`flex gap-3 px-4 py-3 transition hover:bg-muted/50 ${
                              !n.read ? 'bg-accent-soft/30' : ''
                            }`}
                          >
                            <span
                              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                                n.read ? 'bg-foreground-subtle/40' : 'bg-accent'
                              }`}
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {n.title}
                              </p>
                              <p className="text-xs text-foreground-muted line-clamp-2">
                                {n.message}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Menu Popover */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-2 rounded-xl border border-border bg-surface py-1.5 pl-1.5 pr-2.5 transition hover:bg-muted cursor-pointer"
              >
                <Avatar name={user?.name || 'Administrador'} size="sm" />
                <span className="hidden text-left sm:block">
                  <span className="block text-xs font-semibold leading-tight text-foreground truncate max-w-[120px]">
                    {user?.name || 'Administrador'}
                  </span>
                  <span className="block text-[10px] capitalize text-foreground-subtle">
                    {user?.role?.replace('_', ' ').toLowerCase() || 'Gestor'}
                  </span>
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-foreground-subtle" />
              </button>

              {profileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setProfileOpen(false)}
                  />
                  <div className="absolute right-0 top-12 z-20 w-56 overflow-hidden rounded-2xl border border-border bg-surface shadow-elevated animate-scale-in">
                    <div className="border-b border-border px-4 py-3 bg-surface-2/30">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {user?.name}
                      </p>
                      <p className="text-xs text-foreground-subtle truncate">
                        {user?.email}
                      </p>
                    </div>
                    <div className="p-1.5 space-y-0.5">
                      <Link
                        to="/settings"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground-muted transition hover:bg-muted hover:text-foreground"
                      >
                        <Settings className="h-4 w-4" />
                        <span>Configurações</span>
                      </Link>
                      {companySlug && (
                        <a
                          href={`/agenda/${companySlug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground-muted transition hover:bg-muted hover:text-foreground"
                        >
                          <Globe className="h-4 w-4" />
                          <span>Meu site</span>
                        </a>
                      )}
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-danger transition hover:bg-danger/10 cursor-pointer"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sair</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Command Search Modal (⌘K) */}
      <Modal
        open={searchOpen}
        onClose={() => {
          setSearchOpen(false);
          setSearchQuery('');
        }}
        title="Busca Rápida de Módulos"
        size="md"
      >
        <input
          autoFocus
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Digite para buscar página ou função..."
          className="input mb-3"
        />
        <div className="space-y-1">
          {filteredNavItems.map((n) => {
            const Icon = n.icon;
            return (
              <button
                key={n.path}
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery('');
                  navigate(n.path);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-foreground-muted transition hover:bg-muted hover:text-foreground cursor-pointer"
              >
                <Icon className="h-4 w-4 text-accent shrink-0" />
                <span className="font-medium text-foreground">{n.label}</span>
              </button>
            );
          })}
          {filteredNavItems.length === 0 && (
            <p className="px-3 py-4 text-center text-sm text-foreground-subtle">
              Nenhum módulo encontrado com "{searchQuery}".
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
};
