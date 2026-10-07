import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import {
  Calendar,
  Clock,
  Users,
  TrendingUp,
  DollarSign,
  Package,
  AlertTriangle,
  ExternalLink,
  Sparkles,
  Loader2,
  ChevronRight,
  Scissors,
  Star,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const CompanyDashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chartMetric, setChartMetric] = useState<'revenue' | 'appointments'>('revenue');
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

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
        <Loader2 className="animate-spin text-stone-700 dark:text-[#E6D4B0]" size={36} />
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const inventory = data?.inventory || { totalProducts: 0, lowStockCount: 0, lowStockItems: [] };
  const topServices = data?.topServices || [];
  const chartData: any[] = data?.chartData || [];

  // Calcular valor máximo para escala do gráfico
  const maxChartValue = Math.max(
    ...chartData.map((d: any) => (chartMetric === 'revenue' ? d.revenue : d.appointments)),
    chartMetric === 'revenue' ? 100 : 5,
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-white">Visão Geral</h1>
          <p className="text-sm text-stone-500 dark:text-slate-400 mt-0.5">
            Acompanhe o faturamento, agendamentos e estoque do seu negócio em tempo real.
          </p>
        </div>

        {company?.slug && (
          <a
            href={`/empresa/${company.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#E6D4B0] hover:bg-[#DAC295] text-stone-900 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <span>Ver Minha Página Pública</span>
            <ExternalLink size={14} />
          </a>
        )}
      </div>

      {/* Subscription Banner */}
      {data?.subscription && (
        <div className="bg-[#FAF8F5] dark:bg-slate-900 border border-[#EAE1D2] dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#E6D4B0] text-stone-900 rounded-xl shadow-xs">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-900 dark:text-white text-sm">
                  Plano {data.subscription.planName || 'Starter'}
                </span>
                <span
                  className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                    data.subscription.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : data.subscription.status === 'TRIALING'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-[#E6D4B0]/30 text-stone-800 border border-[#E6D4B0]'
                  }`}
                >
                  {data.subscription.status === 'ACTIVE'
                    ? 'Ativo'
                    : data.subscription.status === 'TRIALING'
                    ? 'Período de Testes'
                    : 'Aguardando Pagamento'}
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                Renovação em:{' '}
                {data.subscription.periodEnd
                  ? new Date(data.subscription.periodEnd).toLocaleDateString('pt-BR')
                  : 'N/A'}
              </p>
            </div>
          </div>

          <Link
            to="/subscription"
            className="inline-flex items-center justify-center px-4 py-2 bg-white dark:bg-slate-800 text-stone-900 dark:text-slate-200 text-xs font-bold rounded-xl border border-[#EAE1D2] dark:border-slate-700 hover:bg-[#FAF8F5] transition-colors"
          >
            Gerenciar Assinatura
          </Link>
        </div>
      )}

      {/* Grid de Métricas Principais (5 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Receita de Hoje (Destaque Principal) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-[#EAE1D2] dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-stone-500 dark:text-slate-400 uppercase tracking-wider">
              Receita de Hoje
            </p>
            <h3 className="text-2xl font-black text-stone-900 dark:text-white mt-1">
              R$ {Number(metrics.todayRevenue || 0).toFixed(2)}
            </h3>
            <p className="text-[11px] text-stone-700 dark:text-slate-300 font-semibold mt-0.5">
              {metrics.todayAppointments || 0} agendamento(s) hoje
            </p>
          </div>
          <div className="p-3 bg-[#E6D4B0]/30 text-stone-900 dark:text-[#E6D4B0] rounded-2xl">
            <DollarSign size={22} />
          </div>
        </div>

        {/* Faturamento do Mês */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-[#EAE1D2] dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-stone-500 dark:text-slate-400 uppercase tracking-wider">
              Receita no Mês
            </p>
            <h3 className="text-2xl font-black text-stone-900 dark:text-white mt-1">
              R$ {Number(metrics.estimatedRevenueThisMonth || 0).toFixed(2)}
            </h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
              {metrics.completedThisMonth || 0} concluído(s)
            </p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <TrendingUp size={22} />
          </div>
        </div>

        {/* Próximos Agendamentos */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-[#EAE1D2] dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-stone-500 dark:text-slate-400 uppercase tracking-wider">
              Próximos
            </p>
            <h3 className="text-2xl font-black text-stone-900 dark:text-white mt-1">
              {metrics.upcomingAppointments || 0}
            </h3>
            <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-0.5">Confirmados na agenda</p>
          </div>
          <div className="p-3 bg-[#E6D4B0]/30 text-stone-900 dark:text-[#E6D4B0] rounded-2xl">
            <Calendar size={22} />
          </div>
        </div>

        {/* Estoque de Produtos */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-[#EAE1D2] dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-stone-500 dark:text-slate-400 uppercase tracking-wider">
              Estoque
            </p>
            <h3 className="text-2xl font-black text-stone-900 dark:text-white mt-1">
              {inventory.totalProducts || 0} <span className="text-xs font-normal text-stone-500">itens</span>
            </h3>
            {inventory.lowStockCount > 0 ? (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold mt-0.5 flex items-center gap-1">
                <AlertTriangle size={11} /> {inventory.lowStockCount} item(s) acabando
              </p>
            ) : (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">Estoque regular</p>
            )}
          </div>
          <div
            className={`p-3 rounded-2xl ${
              inventory.lowStockCount > 0
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                : 'bg-[#E6D4B0]/30 text-stone-900 dark:text-[#E6D4B0]'
            }`}
          >
            <Package size={22} />
          </div>
        </div>

        {/* Clientes Cadastrados */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-[#EAE1D2] dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-stone-500 dark:text-slate-400 uppercase tracking-wider">
              Clientes (CRM)
            </p>
            <h3 className="text-2xl font-black text-stone-900 dark:text-white mt-1">
              {metrics.totalClients || 0}
            </h3>
            <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-0.5">Base cadastrada</p>
          </div>
          <div className="p-3 bg-[#E6D4B0]/30 text-stone-900 dark:text-[#E6D4B0] rounded-2xl">
            <Users size={22} />
          </div>
        </div>
      </div>

      {/* Gráfico de Desempenho Visual (14 Dias) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-[#EAE1D2] dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#EAE1D2] dark:border-slate-800">
          <div>
            <h3 className="font-bold text-stone-900 dark:text-white text-base">
              Desempenho dos Últimos 14 Dias
            </h3>
            <p className="text-xs text-stone-500 dark:text-slate-400">
              Acompanhe a curva diária de faturamento e fluxo de agendamentos.
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-[#FAF8F5] dark:bg-slate-800 rounded-xl border border-[#EAE1D2] dark:border-slate-700">
            <button
              onClick={() => setChartMetric('revenue')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                chartMetric === 'revenue'
                  ? 'bg-[#E6D4B0] text-stone-900 shadow-xs'
                  : 'text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              Faturamento (R$)
            </button>
            <button
              onClick={() => setChartMetric('appointments')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                chartMetric === 'appointments'
                  ? 'bg-[#E6D4B0] text-stone-900 shadow-xs'
                  : 'text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              Agendamentos
            </button>
          </div>
        </div>

        {/* Visual Bar Chart */}
        <div className="pt-4">
          <div className="h-56 flex items-end justify-between gap-2 sm:gap-3 px-2">
            {chartData.map((d: any, idx: number) => {
              const val = chartMetric === 'revenue' ? d.revenue : d.appointments;
              const heightPct = Math.max(8, Math.round((val / maxChartValue) * 100));
              const isHovered = hoveredBarIndex === idx;

              return (
                <div
                  key={d.date}
                  className="flex-1 flex flex-col items-center gap-2 group relative cursor-pointer h-full justify-end"
                  onMouseEnter={() => setHoveredBarIndex(idx)}
                  onMouseLeave={() => setHoveredBarIndex(null)}
                >
                  {/* Tooltip Hover */}
                  {isHovered && (
                    <div className="absolute -top-12 z-20 px-3 py-1.5 bg-stone-900 text-stone-100 text-[11px] font-bold rounded-xl shadow-lg whitespace-nowrap pointer-events-none">
                      <span className="block text-center">{d.dayLabel}</span>
                      <span className="block text-[#E6D4B0]">
                        {chartMetric === 'revenue' ? `R$ ${d.revenue.toFixed(2)}` : `${d.appointments} agendamento(s)`}
                      </span>
                    </div>
                  )}

                  {/* Barra */}
                  <div
                    className="w-full max-w-[28px] rounded-t-xl transition-all duration-300"
                    style={{
                      height: `${heightPct}%`,
                      backgroundColor: isHovered ? '#DAC295' : val > 0 ? '#E6D4B0' : '#F5EFE6',
                    }}
                  />

                  {/* Label do dia */}
                  <span
                    className={`text-[10px] font-semibold tracking-tighter truncate ${
                      isHovered ? 'text-stone-900 dark:text-white font-bold' : 'text-stone-500 dark:text-slate-400'
                    }`}
                  >
                    {d.dayLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid Inferior: Estoque Crítico, Top Serviços & Ações Rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card de Controle de Estoque & Reposição */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-[#EAE1D2] dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE1D2] dark:border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-stone-800 dark:text-[#E6D4B0]" />
                <h3 className="font-bold text-stone-900 dark:text-white text-sm">
                  Controle de Estoque
                </h3>
              </div>
              <Link to="/products" className="text-xs font-bold text-stone-800 dark:text-[#E6D4B0] hover:underline flex items-center gap-0.5">
                <span>Ver Todos</span>
                <ChevronRight size={13} />
              </Link>
            </div>

            {inventory.lowStockItems.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <CheckCircle2 size={32} className="mx-auto text-emerald-600" />
                <p className="text-xs font-semibold text-stone-900 dark:text-white">
                  Estoque 100% Abastecido!
                </p>
                <p className="text-[11px] text-stone-500 dark:text-slate-400">
                  Nenhum produto está com estoque crítico no momento.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                <p className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold bg-amber-50 dark:bg-amber-950/40 p-2 rounded-xl border border-amber-200 dark:border-amber-800">
                  Atenção: Itens em nível crítico de estoque para reposição:
                </p>
                {inventory.lowStockItems.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-slate-800/60 border border-[#EAE1D2] dark:border-slate-800 text-xs"
                  >
                    <div>
                      <strong className="block text-stone-900 dark:text-white">{item.name}</strong>
                      <span className="text-[11px] text-stone-500 dark:text-slate-400">
                        {item.minStock > 0 ? `Estoque mínimo: ${item.minStock} ${item.unit || 'un'}` : `R$ ${Number(item.price).toFixed(2)}`}
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 font-bold text-[11px]">
                      {item.stock} {item.unit || 'un'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link
            to="/products"
            className="w-full mt-4 py-2 bg-[#FAF8F5] dark:bg-slate-800 hover:bg-[#E6D4B0]/20 text-stone-900 dark:text-stone-100 text-xs font-bold rounded-xl border border-[#EAE1D2] dark:border-slate-700 text-center transition-colors"
          >
            Gerenciar Estoque e Produtos
          </Link>
        </div>

        {/* Serviços Mais Agendados */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-[#EAE1D2] dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE1D2] dark:border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <Scissors size={18} className="text-stone-800 dark:text-[#E6D4B0]" />
                <h3 className="font-bold text-stone-900 dark:text-white text-sm">
                  Mais Agendados no Mês
                </h3>
              </div>
              <Link to="/services" className="text-xs font-bold text-stone-800 dark:text-[#E6D4B0] hover:underline flex items-center gap-0.5">
                <span>Serviços</span>
                <ChevronRight size={13} />
              </Link>
            </div>

            {topServices.length === 0 ? (
              <div className="text-center py-8 text-stone-500 dark:text-slate-400 text-xs">
                Nenhum serviço agendado neste mês ainda.
              </div>
            ) : (
              <div className="space-y-2.5">
                {topServices.map((srv: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-slate-800/60 border border-[#EAE1D2] dark:border-slate-800 text-xs"
                  >
                    <div>
                      <strong className="block text-stone-900 dark:text-white truncate max-w-[160px]">
                        {srv.serviceName}
                      </strong>
                      <span className="text-[11px] text-stone-500 dark:text-slate-400">
                        R$ {Number(srv.price).toFixed(2)}
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-[#E6D4B0]/25 dark:bg-[#E6D4B0]/15 text-stone-900 dark:text-[#E6D4B0] font-bold text-[11px] border border-[#E6D4B0]/40">
                      {srv.bookingsCount} agendados
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link
            to="/services"
            className="w-full mt-4 py-2 bg-[#FAF8F5] dark:bg-slate-800 hover:bg-[#E6D4B0]/20 text-stone-900 dark:text-stone-100 text-xs font-bold rounded-xl border border-[#EAE1D2] dark:border-slate-700 text-center transition-colors"
          >
            Cadastrar / Editar Procedimentos
          </Link>
        </div>

        {/* Atalhos Rápidos da Gestão */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-[#EAE1D2] dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-stone-900 dark:text-white text-sm pb-3 border-b border-[#EAE1D2] dark:border-slate-800 mb-3">
              Módulos em Destaque
            </h3>

            <div className="space-y-2.5">
              <Link
                to="/waitlist"
                className="flex items-center justify-between p-3 rounded-xl border border-[#EAE1D2] dark:border-slate-800 hover:border-[#E6D4B0] hover:bg-[#FAF8F5] dark:hover:bg-slate-800/60 transition-all text-xs font-medium text-stone-900 dark:text-white"
              >
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-stone-800 dark:text-[#E6D4B0]" />
                  <span>Lista de Espera</span>
                </div>
                {metrics.waitlistPending > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#E6D4B0] text-stone-900 text-[10px] font-bold">
                    {metrics.waitlistPending} aguardando
                  </span>
                )}
              </Link>

              <Link
                to="/reviews"
                className="flex items-center justify-between p-3 rounded-xl border border-[#EAE1D2] dark:border-slate-800 hover:border-[#E6D4B0] hover:bg-[#FAF8F5] dark:hover:bg-slate-800/60 transition-all text-xs font-medium text-stone-900 dark:text-white"
              >
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-amber-500 fill-amber-500" />
                  <span>Avaliações & Estrelas</span>
                </div>
                <span className="text-stone-800 dark:text-[#E6D4B0] text-[11px] font-bold">Ver Depoimentos &rarr;</span>
              </Link>

              <Link
                to="/availability"
                className="flex items-center justify-between p-3 rounded-xl border border-[#EAE1D2] dark:border-slate-800 hover:border-[#E6D4B0] hover:bg-[#FAF8F5] dark:hover:bg-slate-800/60 transition-all text-xs font-medium text-stone-900 dark:text-white"
              >
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-stone-800 dark:text-[#E6D4B0]" />
                  <span>Horários & Intervalos</span>
                </div>
                <span className="text-stone-800 dark:text-[#E6D4B0] text-[11px] font-bold">Ajustar &rarr;</span>
              </Link>
            </div>
          </div>

          <div className="mt-4 p-3 bg-[#FAF8F5] dark:bg-slate-800/60 rounded-2xl border border-[#EAE1D2] dark:border-slate-700 text-[11px] text-stone-700 dark:text-slate-300">
            💡 <strong>Dica Inovae Agenda:</strong> Mantenha o estoque atualizado para evitar oferecer produtos esgotados aos clientes no balcão.
          </div>
        </div>
      </div>
    </div>
  );
};
