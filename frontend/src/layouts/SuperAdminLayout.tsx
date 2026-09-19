import React from 'react';
  import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
  import { useAuthStore } from '../store/useAuthStore';
  import {
    BarChart3,
    Building2,
    Layers,
    ArrowLeft,
    LogOut,
    ShieldAlert,
  } from 'lucide-react';

  export const SuperAdminLayout: React.FC = () => {
    const { user, logout } = useAuthStore();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
      logout();
      navigate('/login');
    };

    const navItems = [
      { label: 'Visão Geral & MRR', path: '/admin', icon: BarChart3 },
      { label: 'Empresas do SaaS', path: '/admin/companies', icon: Building2 },
      { label: 'Planos & Preços', path: '/admin/plans', icon: Layers },
    ];

    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between p-4">
          <div>
            <div className="flex items-center gap-3 p-3 border-b border-slate-800 mb-4">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h1 className="font-bold text-sm text-white">Super Admin</h1>
                <p className="text-xs text-slate-400">Gestão Global SaaS</p>
              </div>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="pt-4 border-t border-slate-800 space-y-2">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ArrowLeft size={16} />
              Voltar ao Painel da Empresa
            </Link>

            <div className="flex items-center justify-between pt-2 px-2">
              <div>
                <p className="text-xs font-medium text-slate-200">{user?.name}</p>
                <p className="text-[11px] text-slate-400">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-red-400"
                title="Sair"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto bg-slate-900">
          <Outlet />
        </main>
      </div>
    );
  };

