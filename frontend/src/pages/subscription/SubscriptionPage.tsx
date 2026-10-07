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
  RefreshCw,
  Copy,
  ExternalLink,
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
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);

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

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const { data } = await api.post('/subscriptions/sync');
      setSyncMessage(data.message);
      if (data.active) {
        if (checkoutSuccess) {
          setCheckoutSuccess((prev: any) => ({
            ...prev,
            subscription: { ...prev.subscription, status: 'ACTIVE' },
          }));
        }
        fetchData();
      }
    } catch (err: any) {
      setSyncMessage(err.response?.data?.message || 'Falha ao sincronizar com o gateway Asaas.');
    } finally {
      setSyncing(false);
    }
  };

  const handleCopyPix = (payload: string) => {
    if (!payload) return;
    navigator.clipboard.writeText(payload);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  };

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
        <Loader2 className="animate-spin text-stone-900 dark:text-[#E6D4B0]" size={32} />
      </div>
    );
  }

  const currentSub = subData?.subscription;
  const currentFeatures = featuresData?.features || {};
  const currentUsage = featuresData?.usage || {};

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-white">Minha Assinatura</h1>
        <p className="text-sm text-stone-500 dark:text-slate-400 mt-0.5">
          Gerencie seu plano, recursos contratados e faturamento recorrente.
        </p>
      </div>

      {syncMessage && (
        <div className="bg-[#E6D4B0]/25 dark:bg-slate-800 border border-[#E6D4B0] dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs text-stone-900 dark:text-[#E6D4B0]">
          <div className="flex items-center gap-2">
            <Sparkles className="text-stone-900 dark:text-[#E6D4B0] shrink-0" size={18} />
            <span>{syncMessage}</span>
          </div>
          <button
            onClick={() => setSyncMessage(null)}
            className="text-stone-500 hover:text-stone-900 dark:hover:text-white cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Alerta de pagamento pendente quando a assinatura não está 100% ativa */}
      {currentSub && (currentSub.status === 'INCOMPLETE' || currentSub.status === 'PAST_DUE') && (
        <div className="bg-[#E6D4B0]/25 dark:bg-slate-800 border border-[#E6D4B0] dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-900 dark:text-[#E6D4B0]">
          <div className="flex items-center gap-2">
            <AlertCircle className="text-stone-900 dark:text-[#E6D4B0] shrink-0" size={20} />
            <div>
              <strong className="block font-bold">Aguardando confirmação do pagamento no Asaas</strong>
              <span>Após efetuar o pagamento via Pix ou Boleto, clique no botão para verificar se o banco já compensou.</span>
            </div>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-4 py-2 bg-[#E6D4B0] hover:bg-[#DAC295] text-stone-900 font-bold shadow-xs rounded-xl font-bold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? 'Consultando...' : 'Verificar Pagamento no Asaas'}</span>
          </button>
        </div>
      )}

      {/* Current Subscription Card */}
      {currentSub ? (
        <div className="bg-white dark:bg-slate-800 border border-[#EAE1D2] dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EAE1D2] dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                <span className="text-xl font-bold text-stone-900 dark:text-white">
                  Plano {currentSub.plan.name}
                </span>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-bold ${
                    currentSub.status === 'ACTIVE'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : currentSub.status === 'TRIALING'
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      : currentSub.status === 'INCOMPLETE'
                      ? 'bg-[#E6D4B0]/25 dark:bg-[#E6D4B0]/15 text-stone-900 dark:text-[#E6D4B0] border border-[#E6D4B0] dark:border-slate-800'
                      : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200'
                  }`}
                >
                  {currentSub.status === 'ACTIVE'
                    ? 'Ativo'
                    : currentSub.status === 'TRIALING'
                    ? 'Período de Testes (Trial Grátis)'
                    : currentSub.status === 'INCOMPLETE'
                    ? 'Aguardando Pagamento'
                    : 'Fatura Pendente / Em Atraso'}
                </span>

                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FAF8F5] dark:bg-slate-800 hover:bg-[#F0EAE1] text-stone-900 dark:text-[#E6D4B0] border border-[#EAE1D2] dark:border-slate-800 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                  title="Consultar status direto no gateway Asaas"
                >
                  <RefreshCw size={12} className={syncing ? 'animate-spin text-stone-900 dark:text-[#E6D4B0]' : ''} />
                  <span>{syncing ? 'Verificando...' : 'Verificar Status Asaas'}</span>
                </button>
              </div>
              <p className="text-xs text-stone-500 dark:text-slate-400">
                Cobrança {currentSub.billingCycle === 'YEARLY' ? 'Anual' : 'Mensal'} • Próxima renovação em:{' '}
                <strong className="text-stone-900 dark:text-white">
                  {currentSub.currentPeriodEnd
                    ? new Date(currentSub.currentPeriodEnd).toLocaleDateString('pt-BR')
                    : 'N/A'}
                </strong>
              </p>
            </div>

            <div className="text-right">
              <span className="text-3xl font-black text-stone-900 dark:text-white">
                R$ {Number(currentSub.amount).toFixed(2)}
              </span>
              <span className="text-xs text-stone-500 dark:text-slate-400 font-medium">
                /{currentSub.billingCycle === 'YEARLY' ? 'ano' : 'mês'}
              </span>
            </div>
          </div>

          {/* Usage Meters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            <div className="bg-[#FAF8F5] dark:bg-[#1E1713] p-4 rounded-2xl border border-[#EAE1D2] dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-semibold mb-2">
                <span className="text-stone-500 dark:text-slate-400">Profissionais Cadastrados</span>
                <span className="text-stone-900 dark:text-[#E6D4B0] font-bold">
                  {currentUsage.currentProfessionals || 0} / {currentFeatures.maxProfessionals || 1}
                </span>
              </div>
              <div className="w-full bg-[#FAF8F5] dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#E6D4B0] dark:bg-[#E6D4B0] h-full rounded-full transition-all"
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

            <div className="bg-[#FAF8F5] dark:bg-[#1E1713] p-4 rounded-2xl border border-[#EAE1D2] dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-semibold mb-2">
                <span className="text-stone-500 dark:text-slate-400">Agendamentos no Mês</span>
                <span className="text-stone-900 dark:text-[#E6D4B0] font-bold">
                  {currentUsage.currentAppointmentsThisMonth || 0} /{' '}
                  {currentFeatures.maxAppointments || 100}
                </span>
              </div>
              <div className="w-full bg-[#FAF8F5] dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#E6D4B0] dark:bg-[#E6D4B0] h-full rounded-full transition-all"
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

            <div className="bg-[#FAF8F5] dark:bg-[#1E1713] p-4 rounded-2xl border border-[#EAE1D2] dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-semibold mb-2">
                <span className="text-stone-500 dark:text-slate-400">Disparos de WhatsApp</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-extrabold uppercase text-[10px] tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40">
                  Ilimitado
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-slate-400">
                Confirmações e lembretes automáticos inclusos sem limite de envio.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Available Plans for Upgrade */}
      <div>
        <div className="text-center max-w-lg mx-auto mb-8">
          <h2 className="text-xl font-bold text-stone-900 dark:text-white">Escolha o Melhor Plano para seu Negócio</h2>
          <p className="text-xs text-stone-500 dark:text-slate-400 mt-1">
            Mude de plano a qualquer momento conforme sua equipe cresce.
          </p>

          {/* Cycle Toggle */}
          <div className="inline-flex items-center p-1 bg-[#FAF8F5] dark:bg-slate-800 rounded-xl mt-4 border border-[#EAE1D2] dark:border-slate-800">
            <button
              onClick={() => setBillingCycle('MONTHLY')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                billingCycle === 'MONTHLY'
                  ? 'bg-[#E6D4B0] text-stone-900 font-bold shadow-xs shadow-sm'
                  : 'text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              Cobrança Mensal
            </button>
            <button
              onClick={() => setBillingCycle('YEARLY')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                billingCycle === 'YEARLY'
                  ? 'bg-[#E6D4B0] text-stone-900 font-bold shadow-xs shadow-sm'
                  : 'text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
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
                className={`bg-white dark:bg-slate-800 rounded-3xl p-6 border transition-all flex flex-col justify-between ${
                  p.slug === 'professional'
                    ? 'border-[#E6D4B0] shadow-lg shadow-[#E6D4B0]/10 ring-2 ring-[#E6D4B0]'
                    : 'border-[#EAE1D2] dark:border-slate-800 shadow-sm'
                }`}
              >
                <div>
                  {p.slug === 'professional' && (
                    <span className="inline-block px-3 py-1 bg-[#E6D4B0] text-stone-900 font-bold shadow-xs rounded-full text-[10px] font-bold uppercase tracking-wider mb-3">
                      Mais Popular
                    </span>
                  )}

                  <h3 className="font-bold text-stone-900 dark:text-white text-lg">{p.name}</h3>
                  <p className="text-xs text-stone-500 dark:text-slate-400 mt-1 min-h-[36px]">{p.description}</p>

                  <div className="my-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-stone-900 dark:text-white">
                        R$ {Number(price).toFixed(2)}
                      </span>
                      <span className="text-xs text-stone-500 dark:text-slate-400 font-medium">
                        /{billingCycle === 'YEARLY' ? 'ano' : 'mês'}
                      </span>
                    </div>
                  </div>

                  {/* Badge de Destaque de Acesso ao Estoque */}
                  {p.features?.inventoryControl || p.features?.inventory || p.slug === 'professional' || p.slug === 'premium' ? (
                    <div className="mb-4 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs">
                      <Check size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="font-bold text-emerald-800 dark:text-emerald-300">
                        Mercado Pago, Sinal Pix & Estoque: <strong>INCLUSOS</strong> ✅
                      </span>
                    </div>
                  ) : (
                    <div className="mb-4 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center gap-2 text-xs">
                      <X size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
                      <span className="font-bold text-amber-800 dark:text-amber-300">
                        Plano Básico Essencial ⚡
                      </span>
                    </div>
                  )}

                  <div className="space-y-3 text-xs text-stone-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-stone-900 dark:text-[#E6D4B0] shrink-0" />
                      <span>
                        {p.slug === 'premium'
                          ? 'Até 15 profissionais prestadores'
                          : p.slug === 'professional'
                          ? 'Até 5 profissionais prestadores'
                          : '1 profissional prestador'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-stone-900 dark:text-[#E6D4B0] shrink-0" />
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                        {p.slug === 'premium'
                          ? 'Agendamentos SEM LIMITE mensal'
                          : p.slug === 'professional'
                          ? 'Até 100 agendamentos por mês'
                          : 'Até 50 agendamentos por mês'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        WhatsApp agendamentos (confirmação, cancelamento, lembretes)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-stone-900 dark:text-[#E6D4B0] shrink-0" />
                      <span>Página pública de agendamento & Link próprio</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.features?.mercadopago || p.slug === 'professional' || p.slug === 'premium' ? (
                        <>
                          <Check size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="font-medium">Mercado Pago & Pagamentos online</span>
                        </>
                      ) : (
                        <>
                          <X size={16} className="text-amber-700 dark:text-amber-500 shrink-0" />
                          <span className="text-stone-500 dark:text-stone-500 line-through">
                            Sem Mercado Pago / Pagamento online
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {p.features?.pixSignal || p.slug === 'professional' || p.slug === 'premium' ? (
                        <>
                          <Check size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="font-medium">Recebimento de sinal na sua chave Pix</span>
                        </>
                      ) : (
                        <>
                          <X size={16} className="text-amber-700 dark:text-amber-500 shrink-0" />
                          <span className="text-stone-500 dark:text-stone-500 line-through">
                            Sem Pix para sinal
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {p.features?.inventory || p.features?.inventoryControl || p.slug === 'professional' || p.slug === 'premium' ? (
                        <>
                          <Check size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="font-bold text-emerald-800 dark:text-emerald-300">
                            Controle de Estoque & Alertas de Reposição
                          </span>
                        </>
                      ) : (
                        <>
                          <X size={16} className="text-amber-700 dark:text-amber-500 shrink-0" />
                          <span className="text-stone-500 dark:text-stone-500 line-through">
                            Sem controle de estoque (Apenas Pro e Premium)
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPlan(p)}
                  disabled={isCurrent}
                  className={`w-full mt-8 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-[#FAF8F5] dark:bg-slate-800 text-stone-500 dark:text-slate-400 cursor-not-allowed'
                      : 'bg-[#E6D4B0] hover:bg-[#DAC295] text-stone-900 font-bold shadow-xs shadow-md shadow-[#E6D4B0]/20'
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
          <div className="bg-white dark:bg-slate-800 border border-[#EAE1D2] dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE1D2] dark:border-slate-800 mb-4">
              <h3 className="font-bold text-stone-900 dark:text-white text-base">
                Contratar Plano {selectedPlan.name}
              </h3>
              <button
                onClick={() => {
                  setSelectedPlan(null);
                  setCheckoutSuccess(null);
                  setSyncMessage(null);
                }}
                className="text-stone-500 hover:text-stone-900 dark:hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {checkoutSuccess ? (
              <div className="py-4 space-y-4 text-center">
                {checkoutSuccess.subscription?.status === 'ACTIVE' ? (
                  <>
                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                      <Check size={24} />
                    </div>
                    <h4 className="font-bold text-stone-900 dark:text-white text-lg">Assinatura Ativa!</h4>
                    <p className="text-xs text-stone-500 dark:text-slate-400 max-w-xs mx-auto">
                      Seu plano {selectedPlan.name} está 100% ativo e pronto para uso!
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-[#E6D4B0]/25 dark:bg-[#E6D4B0]/15 text-stone-900 dark:text-[#E6D4B0] flex items-center justify-center mx-auto">
                      <QrCode size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-stone-900 dark:text-white text-base">Cobrança Gerada no Asaas!</h4>
                      <p className="text-xs text-stone-500 dark:text-slate-400 mt-1">
                        Pague via Pix ou abra a fatura. O plano será liberado assim que o valor for identificado pelo banco!
                      </p>
                    </div>

                    {/* QR Code Pix se disponível */}
                    {checkoutSuccess.pixQrCode?.encodedImage && (
                      <div className="bg-white p-3 rounded-2xl border border-[#EAE1D2] inline-block mx-auto shadow-sm">
                        <img
                          src={`data:image/png;base64,${checkoutSuccess.pixQrCode.encodedImage}`}
                          alt="Pix QR Code"
                          className="w-48 h-48 mx-auto"
                        />
                        <span className="text-[10px] text-stone-500 font-medium block mt-1">
                          Escaneie no app do seu banco
                        </span>
                      </div>
                    )}

                    {/* Botão Copia e Cola Pix */}
                    {checkoutSuccess.pixQrCode?.payload && (
                      <button
                        type="button"
                        onClick={() => handleCopyPix(checkoutSuccess.pixQrCode.payload)}
                        className="w-full py-2.5 px-3 bg-[#E6D4B0]/25 dark:bg-slate-800 hover:bg-[#F0EAE1] text-stone-900 dark:text-[#E6D4B0] border border-[#EAE1D2] dark:border-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        {copiedPix ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        <span>{copiedPix ? 'Código Pix Copiado!' : 'Copiar Chave Pix Copia e Cola'}</span>
                      </button>
                    )}

                    {/* Link para Fatura Externa */}
                    {checkoutSuccess.paymentUrl && (
                      <div>
                        <a
                          href={checkoutSuccess.paymentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 text-xs text-stone-900 dark:text-[#E6D4B0] hover:underline font-bold"
                        >
                          <span>Abrir fatura completa no Asaas</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    )}

                    {/* Feedback da Consulta dentro do modal */}
                    {syncMessage && (
                      <div className="p-3 bg-[#E6D4B0]/25 dark:bg-[#E6D4B0]/15 text-stone-900 dark:text-[#E6D4B0] border border-[#E6D4B0] dark:border-slate-800 rounded-xl text-xs font-medium text-left">
                        {syncMessage}
                      </div>
                    )}

                    {/* Botão de Verificação no Asaas */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={async () => {
                          await handleSync();
                        }}
                        disabled={syncing}
                        className="w-full py-3 bg-[#E6D4B0] hover:bg-[#DAC295] text-stone-900 font-bold shadow-xs rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#E6D4B0]/20 transition-all"
                      >
                        <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} />
                        <span>{syncing ? 'Consultando Asaas...' : 'Verificar Pagamento no Asaas'}</span>
                      </button>
                      <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-2">
                        * O plano só é liberado após a confirmação do pagamento pelo gateway Asaas.
                      </p>
                    </div>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlan(null);
                    setCheckoutSuccess(null);
                    setSyncMessage(null);
                    fetchData();
                  }}
                  className="w-full py-2.5 bg-[#FAF8F5] dark:bg-slate-800 border border-[#EAE1D2] dark:border-slate-800 text-stone-900 dark:text-[#E6D4B0] rounded-xl text-xs font-bold cursor-pointer hover:bg-[#FAF8F5]"
                >
                  Fechar Janela
                </button>
              </div>
            ) : (
              <form onSubmit={handleCheckout} className="space-y-4 text-xs">
                <div className="p-3 bg-[#FAF8F5] dark:bg-slate-800 rounded-xl border border-[#EAE1D2] dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-stone-900 dark:text-white block text-sm">
                      {selectedPlan.name} ({billingCycle === 'YEARLY' ? 'Anual' : 'Mensal'})
                    </span>
                    <span className="text-stone-500 dark:text-slate-400">Cobrança recorrente Asaas</span>
                  </div>
                  <span className="text-base font-black text-stone-900 dark:text-[#E6D4B0]">
                    R${' '}
                    {Number(
                      billingCycle === 'YEARLY'
                        ? selectedPlan.priceYearly
                        : selectedPlan.priceMonthly,
                    ).toFixed(2)}
                  </span>
                </div>

                <div>
                  <label className="block text-stone-900 dark:text-white font-semibold mb-2">Forma de Pagamento</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('PIX')}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        paymentMethod === 'PIX'
                          ? 'border-[#E6D4B0] bg-[#E6D4B0]/25 dark:bg-[#E6D4B0]/15 text-stone-900 dark:text-[#E6D4B0] ring-2 ring-[#E6D4B0]/20'
                          : 'border-[#EAE1D2] dark:border-slate-800 text-stone-500 dark:text-slate-400 hover:bg-[#FAF8F5]'
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
                          ? 'border-[#E6D4B0] bg-[#E6D4B0]/25 dark:bg-[#E6D4B0]/15 text-stone-900 dark:text-[#E6D4B0] ring-2 ring-[#E6D4B0]/20'
                          : 'border-[#EAE1D2] dark:border-slate-800 text-stone-500 dark:text-slate-400 hover:bg-[#FAF8F5]'
                      }`}
                    >
                      <CreditCard size={20} />
                      <span className="font-bold text-xs">Cartão de Crédito</span>
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#EAE1D2] dark:border-slate-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPlan(null)}
                    className="px-3.5 py-2 text-stone-500 dark:text-slate-400 hover:bg-[#FAF8F5] dark:hover:bg-slate-900 rounded-xl font-medium cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={checkingOut}
                    className="px-5 py-2.5 bg-[#E6D4B0] hover:bg-[#DAC295] text-stone-900 font-bold shadow-xs rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-md shadow-[#E6D4B0]/20"
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
