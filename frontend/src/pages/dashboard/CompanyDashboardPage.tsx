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
  CheckCircle2,
  CalendarRange,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader, StatCard } from '../../components/admin/PageHeader';

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
        <Loader2 className="animate-spin text-accent" size={36} />
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
    <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Page Header */}
      <PageHeader
        title="Visão Geral"
        description="Acompanhe o faturamento, agendamentos e estoque do seu negócio em tempo real."
        actions={
          company?.slug ? (
            <a
              href={`/agenda/${company.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              <span>Ver Minha Página Pública</span>
              <ExternalLink size={14} />
            </a>
          ) : null
        }
      />

      {/* Subscription Banner */}
      {data?.subscription && (
        <div className="card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-2/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-accent text-accent-foreground rounded-xl shadow-soft">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground text-sm">
                  Plano {data.subscription.planName || 'Profissional'}
                </span>
                <span
                  className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${
                    data.subscription.status === 'ACTIVE'
                      ? 'bg-success/10 text-success border-success/30'
                      : data.subscription.status === 'TRIALING'
                      ? 'bg-warning/10 text-warning border-warning/30'
                      : 'bg-accent/10 text-accent border-accent/30'
                  }`}
                >
                  {data.subscription.status === 'ACTIVE'
                    ? 'Ativo'
                    : data.subscription.status === 'TRIALING'
                    ? 'Período de Testes'
                    : 'Aguardando Pagamento'}
                </span>
              </div>
              <p className="text-xs text-foreground-muted mt-0.5">
                Renovação em:{' '}
                {data.subscription.periodEnd
                  ? new Date(data.subscription.periodEnd).toLocaleDateString('pt-BR')
                  : 'N/A'}
              </p>
            </div>
          </div>

          <Link
            to="/subscription"
            className="btn-outline text-xs"
          >
            Gerenciar Assinatura
          </Link>
        </div>
      )}

      {/* Grid de Métricas Principais (5 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Receita de Hoje"
          value={`R$ ${Number(metrics.todayRevenue || 0).toFixed(2)}`}
          hint={`${metrics.todayAppointments || 0} agendamento(s) hoje`}
          icon={DollarSign}
          accent="accent"
        />
        <StatCard
          label="Receita no Mês"
          value={`R$ ${Number(metrics.estimatedRevenueThisMonth || 0).toFixed(2)}`}
          hint={`${metrics.completedThisMonth || 0} concluído(s)`}
          icon={TrendingUp}
          accent="success"
        />
        <StatCard
          label="Próximos"
          value={metrics.upcomingAppointments || 0}
          hint="Confirmados na agenda"
          icon={Calendar}
          accent="info"
        />
        <StatCard
          label="Estoque"
          value={`${inventory.totalProducts || 0} itens`}
          hint={
            inventory.lowStockCount > 0
              ? `${inventory.lowStockCount} item(s) em reposição`
              : 'Estoque regular'
          }
          icon={Package}
          accent={inventory.lowStockCount > 0 ? 'warning' : 'accent'}
        />
        <StatCard
          label="Clientes (CRM)"
          value={metrics.totalClients || 0}
          hint="Base cadastrada"
          icon={Users}
          accent="accent"
        />
      </div>

      {/* Gráfico de Desempenho Visual (14 Dias) */}
      <div className="card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border">
          <div>
            <h3 className="font-bold text-foreground text-base tracking-tight">
              Desempenho dos Últimos 14 Dias
            </h3>
            <p className="text-xs text-foreground-muted">
              Acompanhe a curva diária de faturamento e fluxo de agendamentos.
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-surface-2 rounded-xl border border-border">
            <button
              onClick={() => setChartMetric('revenue')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                chartMetric === 'revenue'
                  ? 'bg-accent text-accent-foreground shadow-soft'
                  : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              Faturamento (R$)
            </button>
            <button
              onClick={() => setChartMetric('appointments')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                chartMetric === 'appointments'
                  ? 'bg-accent text-accent-foreground shadow-soft'
                  : 'text-foreground-muted hover:text-foreground'
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
                    <div className="absolute -top-12 z-20 px-3 py-1.5 bg-surface border border-border text-foreground text-[11px] font-bold rounded-xl shadow-elevated whitespace-nowrap pointer-events-none animate-scale-in">
                      <span className="block text-center text-foreground-muted">{d.dayLabel}</span>
                      <span className="block text-accent">
                        {chartMetric === 'revenue' ? `R$ ${d.revenue.toFixed(2)}` : `${d.appointments} agendamento(s)`}
                      </span>
                    </div>
                  )}

                  {/* Barra */}
                  <div
                    className={`w-full max-w-[28px] rounded-t-xl transition-all duration-300 ${
                      isHovered
                        ? 'bg-accent brightness-110 shadow-glow'
                        : val > 0
                        ? 'bg-accent'
                        : 'bg-muted'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />

                  {/* Label do dia */}
                  <span
                    className={`text-[10px] font-medium tracking-tight truncate ${
                      isHovered ? 'text-accent font-bold' : 'text-foreground-subtle'
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
        <div className="card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-accent" />
                <h3 className="font-bold text-foreground text-sm">
                  Controle de Estoque
                </h3>
              </div>
              <Link to="/products" className="text-xs font-semibold text-accent hover:underline flex items-center gap-0.5">
                <span>Ver Todos</span>
                <ChevronRight size={13} />
              </Link>
            </div>

            {inventory.lowStockItems.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <CheckCircle2 size={32} className="mx-auto text-success" />
                <p className="text-xs font-semibold text-foreground">
                  Estoque 100% Abastecido!
                </p>
                <p className="text-[11px] text-foreground-muted">
                  Nenhum produto está com estoque crítico no momento.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                <p className="text-[11px] text-warning font-semibold bg-warning/10 p-2 rounded-xl border border-warning/20">
                  Atenção: Itens em nível crítico de estoque para reposição:
                </p>
                {inventory.lowStockItems.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-surface-2 border border-border text-xs"
                  >
                    <div>
                      <strong className="block text-foreground">{item.name}</strong>
                      <span className="text-[11px] text-foreground-muted">
                        {item.minStock > 0 ? `Estoque mínimo: ${item.minStock} ${item.unit || 'un'}` : `R$ ${Number(item.price).toFixed(2)}`}
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-warning/20 text-warning font-bold text-[11px]">
                      {item.stock} {item.unit || 'un'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link
            to="/products"
            className="btn-outline w-full mt-4 text-xs"
          >
            Gerenciar Estoque e Produtos
          </Link>
        </div>

        {/* Serviços Mais Agendados */}
        <div className="card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
              <div className="flex items-center gap-2">
                <Scissors size={18} className="text-accent" />
                <h3 className="font-bold text-foreground text-sm">
                  Mais Agendados no Mês
                </h3>
              </div>
              <Link to="/services" className="text-xs font-semibold text-accent hover:underline flex items-center gap-0.5">
                <span>Serviços</span>
                <ChevronRight size={13} />
              </Link>
            </div>

            {topServices.length === 0 ? (
              <div className="text-center py-8 text-foreground-subtle text-xs">
                Nenhum serviço agendado neste mês ainda.
              </div>
            ) : (
              <div className="space-y-2.5">
                {topServices.map((srv: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-surface-2 border border-border text-xs"
                  >
                    <div>
                      <strong className="block text-foreground truncate max-w-[160px]">
                        {srv.serviceName}
                      </strong>
                      <span className="text-[11px] text-foreground-muted">
                        R$ {Number(srv.price).toFixed(2)}
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-accent-soft text-accent-foreground font-bold text-[11px] border border-accent/20">
                      {srv.bookingsCount} agendados
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link
            to="/services"
            className="btn-outline w-full mt-4 text-xs"
          >
            Cadastrar / Editar Procedimentos
          </Link>
        </div>

        {/* Atalhos Rápidos da Gestão */}
        <div className="card p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-foreground text-sm pb-3 border-b border-border mb-3">
              Módulos em Destaque
            </h3>

            <div className="space-y-2.5">
              <Link
                to="/waitlist"
                className="flex items-center justify-between p-3 rounded-xl border border-border hover:border-accent hover:bg-surface-2 transition text-xs font-medium text-foreground"
              >
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-accent" />
                  <span>Lista de Espera</span>
                </div>
                {metrics.waitlistPending > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold">
                    {metrics.waitlistPending} aguardando
                  </span>
                )}
              </Link>

              <Link
                to="/reviews"
                className="flex items-center justify-between p-3 rounded-xl border border-border hover:border-accent hover:bg-surface-2 transition text-xs font-medium text-foreground"
              >
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-warning fill-warning" />
                  <span>Avaliações & Estrelas</span>
                </div>
                <span className="text-accent text-[11px] font-bold">Ver Depoimentos &rarr;</span>
              </Link>

              <Link
                to="/availability"
                className="flex items-center justify-between p-3 rounded-xl border border-border hover:border-accent hover:bg-surface-2 transition text-xs font-medium text-foreground"
              >
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-accent" />
                  <span>Horários & Intervalos</span>
                </div>
                <span className="text-accent text-[11px] font-bold">Ajustar &rarr;</span>
              </Link>
            </div>
          </div>

          <div className="mt-4 p-3 bg-surface-2 rounded-2xl border border-border text-[11px] text-foreground-muted">
            💡 <strong>Inovae Agenda:</strong> Mantenha o estoque atualizado para evitar oferecer produtos esgotados aos clientes no balcão.
          </div>
        </div>
      </div>
    </div>
  );
};
