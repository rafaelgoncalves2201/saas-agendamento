import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import {
  Calendar,
  Clock,
  Users,
  TrendingUp,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Sparkles,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const CompanyDashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard'),
      api.get('/companies/my-company'),
    ])
      .then(([dashRes, compRes]) => {
        setData(dashRes.data);
        setCompany(compRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const topServices = data?.topServices || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Visão Geral</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Acompanhe o desempenho do seu negócio em tempo real.
          </p>
        </div>

        {company?.slug && (
          <a
            href={`/empresa/${company.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-sm shadow-indigo-200 dark:shadow-none transition-all"
          >
            <span>Página de Agendamento</span>
            <ExternalLink size={16} />
          </a>
        )}
      </div>

      {/* Subscription Banner */}
      {data?.subscription && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-200 dark:shadow-none">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  Plano {data.subscription.planName}
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                    data.subscription.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-700'
                      : data.subscription.status === 'TRIALING'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {data.subscription.status === 'ACTIVE'
                    ? 'Ativo'
                    : data.subscription.status === 'TRIALING'
                    ? 'Período de Teste'
                    : 'Atrasado'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Vigência até{' '}
                {data.subscription.periodEnd
                  ? new Date(data.subscription.periodEnd).toLocaleDateString('pt-BR')
                  : 'N/A'}
              </p>
            </div>
          </div>

          <Link
            to="/subscription"
            className="inline-flex items-center justify-center px-4 py-2 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-lg border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            Gerenciar Plano / Upgrade
          </Link>
        </div>
      )}

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Hoje
            </p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {metrics.todayAppointments || 0}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Agendamentos hoje</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl">
            <Clock size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Próximos
            </p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {metrics.upcomingAppointments || 0}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Confirmados futuros</p>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Calendar size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Receita no Mês
            </p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              R$ {(metrics.estimatedRevenueThisMonth || 0).toFixed(2)}
            </h3>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
              {metrics.completedThisMonth || 0} atendimentos realizados
            </p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Clientes
            </p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {metrics.totalClients || 0}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Base cadastrada</p>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-xl">
            <Users size={24} />
          </div>
        </div>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Services */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4 text-base">
            Serviços Mais Agendados
          </h3>
          {topServices.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
              Nenhum serviço agendado ainda.
            </div>
          ) : (
            <div className="space-y-3">
              {topServices.map((srv: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{srv.serviceName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">R$ {Number(srv.price).toFixed(2)}</p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                    {srv.bookingsCount} agendamentos
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Tips & Next Actions */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 text-base">
              Configurações Rápidas
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Configure seus horários de atendimento, adicione serviços e compartilhe seu link exclusivo nas redes sociais.
            </p>
            <div className="space-y-2.5">
              <Link
                to="/services"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                <span>Cadastrar e Editar Serviços</span>
                <span className="text-indigo-600 dark:text-indigo-400 text-xs font-semibold">Ir &rarr;</span>
              </Link>
              <Link
                to="/availability"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                <span>Definir Horários & Intervalos</span>
                <span className="text-indigo-600 dark:text-indigo-400 text-xs font-semibold">Ir &rarr;</span>
              </Link>
              <Link
                to="/coupons"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                <span>Gerenciar Cupons de Desconto</span>
                <span className="text-indigo-600 dark:text-indigo-400 text-xs font-semibold">Ir &rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

