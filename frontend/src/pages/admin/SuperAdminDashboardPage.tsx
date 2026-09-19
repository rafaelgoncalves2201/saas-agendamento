import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import {
  TrendingUp,
  Building2,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  Layers,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

export const SuperAdminDashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then((res) => setData(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-amber-500" size={32} />
      </div>
    );
  }

  const financial = data?.financial || {};
  const companies = data?.companies || {};
  const subscriptions = data?.subscriptions || {};
  const plans = data?.plansDistribution || [];
  const recentPayments = data?.recentPayments || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold mb-2">
          <ShieldCheck size={14} />
          Painel Master da Plataforma
        </div>
        <h1 className="text-2xl font-bold text-white">Métricas Gerais do SaaS</h1>
        <p className="text-sm text-slate-400 mt-1">
          Acompanhamento de receita recorrente mensal (MRR), assinaturas ativas e crescimento da base de empresas.
        </p>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">MRR</span>
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <TrendingUp size={20} />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-white mt-3">
            R$ {(financial.mrr || 0).toFixed(2)}
          </h3>
          <p className="text-xs text-slate-400 mt-1">Receita Recorrente Mensal</p>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">ARR</span>
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl">
              <DollarSign size={20} />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-white mt-3">
            R$ {(financial.annualRunRate || 0).toFixed(2)}
          </h3>
          <p className="text-xs text-slate-400 mt-1">Receita Anual Projetada</p>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Empresas</span>
            <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl">
              <Building2 size={20} />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-white mt-3">
            {companies.total || 0}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {companies.active || 0} ativas • {companies.trial || 0} em teste
          </p>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Assinaturas</span>
            <div className="p-2.5 bg-purple-500/20 text-purple-400 rounded-xl">
              <Layers size={20} />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-white mt-3">
            {subscriptions.active || 0}
          </h3>
          <p className="text-xs text-amber-400 mt-1">
            {subscriptions.pastDue || 0} faturas em atraso
          </p>
        </div>
      </div>

      {/* Plans & Subscriptions Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-base font-bold text-white mb-4">Assinantes por Plano</h3>
          <div className="space-y-3">
            {plans.map((p: any) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800/80"
              >
                <div>
                  <h4 className="text-sm font-semibold text-white">{p.name}</h4>
                  <p className="text-xs text-slate-400">R$ {Number(p.priceMonthly).toFixed(2)}/mês</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-amber-400">
                    {p.activeSubscribers} {p.activeSubscribers === 1 ? 'empresa' : 'empresas'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Payments Log */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-base font-bold text-white mb-4">Últimos Pagamentos Confirmados</h3>
          {recentPayments.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              Nenhum pagamento registrado no momento.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentPayments.map((pay: any) => (
                <div
                  key={pay.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800"
                >
                  <div>
                    <p className="text-xs font-semibold text-white">{pay.company?.name}</p>
                    <p className="text-[11px] text-slate-400">
                      {new Date(pay.paidAt || pay.createdAt).toLocaleString('pt-BR')} • {pay.paymentMethod}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">
                    R$ {Number(pay.amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

