import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import {
  BarChart3,
  Building2,
  Layers,
  Users,
  LogOut,
  ShieldCheck,
  Menu,
} from 'lucide-react';
import { Logo } from '../components/brand/Logo';
import { Avatar } from '../components/ui/Avatar';
import { ThemeToggle } from '../components/ThemeToggle';

export const SuperAdminLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Visão Geral & MRR', path: '/admin', icon: BarChart3 },
    { label: 'Empresas do SaaS', path: '/admin/companies', icon: Building2 },
    { label: 'Planos & Preços', path: '/admin/plans', icon: Layers },
    { label: 'Usuários do Sistema', path: '/admin/users', icon: Users },
  ];

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-surface">
      <div className="p-4 border-b border-border flex items-center gap-3">
        <Logo size={24} word="Inovae Admin" />
      </div>

      <div className="px-4 py-2">
        <div className="rounded-xl bg-accent-soft/40 border border-accent/20 p-2.5 flex items-center gap-2.5">
          <ShieldCheck className="h-4 w-4 text-accent shrink-0" />
          <span className="text-xs font-semibold text-accent">Super Administrador</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground-subtle">
          Gestão Global
        </p>
        {navItems.map((item) => {
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
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <Avatar name={user?.name || 'Super Admin'} size="sm" />
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-foreground truncate">{user?.name || 'Admin'}</p>
            <p className="text-[11px] text-foreground-subtle truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 text-foreground-subtle hover:text-danger rounded-lg hover:bg-danger/10 transition cursor-pointer"
          title="Sair do Sistema"
        >
          <LogOut className="h-4 w-4" />
        </button>
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
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 border-r border-border bg-surface animate-fade-in">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-xl sm:px-6">
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="btn-ghost h-9 w-9 p-0 lg:hidden cursor-pointer"
            aria-label="Abrir Menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
