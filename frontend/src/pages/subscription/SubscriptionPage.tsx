import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import {
  CreditCard,
  Check,
  Sparkles,
  Zap,
  Shield,
  Loader2,
  AlertCircle,
  QrCode,
  X,
} from 'lucide-react';

export const SubscriptionPage: React.FC = () => {
  const [subData, setSubData] = useState<any>(null);
  const [featuresData, setFeaturesData] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CREDIT_CARD'>('PIX');
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState<any | null>(null);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get('/subscriptions/me'),
      api.get('/subscriptions/me/features'),
      api.get('/plans'),
    ])
      .then(([subRes, featRes, plansRes]) => {
        setSubData(subRes.data);
        setFeaturesData(featRes.data);
        setPlans(plansRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckingOut(true);
    try {
      const { data } = await api.post('/subscriptions/checkout', {
        planId: selectedPlan.id,
        billingCycle,
        paymentMethod,
      });
      setCheckoutSuccess(data);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao realizar contratação');
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  const currentSub = subData?.subscription;
  const currentFeatures = featuresData?.features || {};
  const currentUsage = featuresData?.usage || {};

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Minha Assinatura</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Gerencie seu plano, recursos contratados e faturamento recorrente.
        </p>
      </div>

      {/* Current Subscription Card */}
      {currentSub ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl font-bold text-slate-900 dark:text-white">
                  Plano {currentSub.plan.name}
                </span>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-bold ${
                    currentSub.status === 'ACTIVE'
                      ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                      : currentSub.status === 'TRIALING'
                      ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
                      : 'bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300'
                  }`}
                >
                  {currentSub.status === 'ACTIVE'
                    ? 'Ativo'
                    : currentSub.status === 'TRIALING'
                    ? 'Período de Testes (Trial)'
                    : 'Atrasado'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cobrança {currentSub.billingCycle === 'YEARLY' ? 'Anual' : 'Mensal'} • Próxima renovação em:{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  {currentSub.currentPeriodEnd
                    ? new Date(currentSub.currentPeriodEnd).toLocaleDateString('pt-BR')
                    : 'N/A'}
                </strong>
              </p>
            </div>

            <div className="text-right">
              <span className="text-3xl font-black text-slate-900 dark:text-white">
                R$ {Number(currentSub.amount).toFixed(2)}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                /{currentSub.billingCycle === 'YEARLY' ? 'ano' : 'mês'}
              </span>
            </div>
          </div>

          {/* Usage Meters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-semibold mb-2">
                <span className="text-slate-600 dark:text-slate-300">Profissionais Cadastrados</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                  {currentUsage.currentProfessionals || 0} / {currentFeatures.maxProfessionals || 1}
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      ((currentUsage.currentProfessionals || 0) /
                        (currentFeatures.maxProfessionals || 1)) *
                        100,
                      100,
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-semibold mb-2">
                <span className="text-slate-600 dark:text-slate-300">Agendamentos no Mês</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                  {currentUsage.currentAppointmentsThisMonth || 0} /{' '}
                  {currentFeatures.maxAppointments || 100}
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      ((currentUsage.currentAppointmentsThisMonth || 0) /
                        (currentFeatures.maxAppointments || 100)) *
                        100,
                      100,
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-semibold mb-2">
                <span className="text-slate-600 dark:text-slate-300">Disparos de WhatsApp</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                  {currentFeatures.whatsappNotifications
                    ? `Até ${currentFeatures.maxWhatsappMessages}/mês`
                    : 'Não Incluso'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {currentFeatures.whatsappNotifications
                  ? 'Confirmações e lembretes automáticos ativos'
                  : 'Faça upgrade para ativar notificações automáticas'}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Available Plans for Upgrade */}
      <div>
        <div className="text-center max-w-lg mx-auto mb-8">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Escolha o Melhor Plano para seu Negócio</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Mude de plano a qualquer momento conforme sua equipe cresce.
          </p>

          {/* Cycle Toggle */}
          <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mt-4 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setBillingCycle('MONTHLY')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                billingCycle === 'MONTHLY'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Cobrança Mensal
            </button>
            <button
              onClick={() => setBillingCycle('YEARLY')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                billingCycle === 'YEARLY'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Cobrança Anual (2 meses grátis 🎉)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => {
            const isCurrent = currentSub?.plan?.slug === p.slug;
            const price = billingCycle === 'YEARLY' ? p.priceYearly : p.priceMonthly;

            return (
              <div
                key={p.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl p-6 border transition-all flex flex-col justify-between ${
                  p.slug === 'professional'
                    ? 'border-indigo-600 shadow-lg shadow-indigo-100 dark:shadow-none ring-2 ring-indigo-600'
                    : 'border-slate-200 dark:border-slate-800 shadow-sm'
                }`}
              >
                <div>
                  {p.slug === 'professional' && (
                    <span className="inline-block px-3 py-1 bg-indigo-600 text-white rounded-full text-[10px] font-bold uppercase tracking-wider mb-3">
                      Mais Popular
                    </span>
                  )}

                  <h3 className="font-bold text-slate-900 dark:text-white text-lg">{p.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 min-h-[36px]">{p.description}</p>

                  <div className="my-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900 dark:text-white">
                        R$ {Number(price).toFixed(2)}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        /{billingCycle === 'YEARLY' ? 'ano' : 'mês'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-emerald-500 shrink-0" />
                      <span>Até <strong>{p.maxProfessionals}</strong> profissional(is)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-emerald-500 shrink-0" />
                      <span>
                        <strong>
                          {p.slug === 'business'
                            ? '200'
                            : p.slug === 'professional'
                            ? '100'
                            : '50'}
                        </strong>{' '}
                        agendamentos/mês por profissional (até {p.maxAppointmentsPerMonth} total)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-emerald-500 shrink-0" />
                      <span>
                        {p.maxWhatsappMessages > 0
                          ? `Até ${p.maxWhatsappMessages} msgs WhatsApp`
                          : 'Notificações WhatsApp desativadas'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-emerald-500 shrink-0" />
                      <span>Página pública mobile-first</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPlan(p)}
                  disabled={isCurrent}
                  className={`w-full mt-8 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                      : p.slug === 'professional'
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 dark:shadow-none'
                      : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white'
                  }`}
                >
                  {isCurrent ? 'Plano Atual' : 'Contratar Plano'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de Checkout */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Contratar Plano {selectedPlan.name}
              </h3>
              <button
                onClick={() => {
                  setSelectedPlan(null);
                  setCheckoutSuccess(null);
                }}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {checkoutSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <Check size={24} />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-lg">Assinatura Confirmada!</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  Seu plano {selectedPlan.name} foi contratado e seus novos limites e recursos já estão liberados!
                </p>
                <button
                  onClick={() => {
                    setSelectedPlan(null);
                    setCheckoutSuccess(null);
                  }}
                  className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Concluir
                </button>
              </div>
            ) : (
              <form onSubmit={handleCheckout} className="space-y-4 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block text-sm">
                      {selectedPlan.name} ({billingCycle === 'YEARLY' ? 'Anual' : 'Mensal'})
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">Cobrança recorrente Asaas</span>
                  </div>
                  <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
                    R${' '}
                    {Number(
                      billingCycle === 'YEARLY'
                        ? selectedPlan.priceYearly
                        : selectedPlan.priceMonthly,
                    ).toFixed(2)}
                  </span>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-2">Forma de Pagamento</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('PIX')}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        paymentMethod === 'PIX'
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <QrCode size={20} />
                      <span className="font-bold text-xs">Pix Automático</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CREDIT_CARD')}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        paymentMethod === 'CREDIT_CARD'
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <CreditCard size={20} />
                      <span className="font-bold text-xs">Cartão de Crédito</span>
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPlan(null)}
                    className="px-3.5 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={checkingOut}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-200 dark:shadow-none"
                  >
                    {checkingOut ? <Loader2 className="animate-spin" size={16} /> : 'Confirmar e Assinar'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

