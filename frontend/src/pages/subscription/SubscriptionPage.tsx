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
        <Loader2 className="animate-spin text-[#6B3E26]" size={32} />
      </div>
    );
  }

  const currentSub = subData?.subscription;
  const currentFeatures = featuresData?.features || {};
  const currentUsage = featuresData?.usage || {};

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[#2B1D15] dark:text-[#F8F5EE]">Minha Assinatura</h1>
        <p className="text-sm text-[#796758] dark:text-[#CDB196] mt-0.5">
          Gerencie seu plano, recursos contratados e faturamento recorrente.
        </p>
      </div>

      {syncMessage && (
        <div className="bg-[#FAF5ED] dark:bg-[#261E18] border border-[#CDB196] dark:border-[#523A2C] rounded-2xl p-4 flex items-center justify-between gap-3 text-xs text-[#6B3E26] dark:text-[#E2CEBC]">
          <div className="flex items-center gap-2">
            <Sparkles className="text-[#6B3E26] dark:text-[#CDB196] shrink-0" size={18} />
            <span>{syncMessage}</span>
          </div>
          <button
            onClick={() => setSyncMessage(null)}
            className="text-[#796758] hover:text-[#2B1D15] dark:hover:text-white cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Alerta de pagamento pendente quando a assinatura não está 100% ativa */}
      {currentSub && (currentSub.status === 'INCOMPLETE' || currentSub.status === 'PAST_DUE') && (
        <div className="bg-[#FAF5ED] dark:bg-[#261E18] border border-[#CDB196] dark:border-[#523A2C] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#6B3E26] dark:text-[#E2CEBC]">
          <div className="flex items-center gap-2">
            <AlertCircle className="text-[#6B3E26] shrink-0" size={20} />
            <div>
              <strong className="block font-bold">Aguardando confirmação do pagamento no Asaas</strong>
              <span>Após efetuar o pagamento via Pix ou Boleto, clique no botão para verificar se o banco já compensou.</span>
            </div>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-4 py-2 bg-[#6B3E26] hover:bg-[#54311E] text-white rounded-xl font-bold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? 'Consultando...' : 'Verificar Pagamento no Asaas'}</span>
          </button>
        </div>
      )}

      {/* Current Subscription Card */}
      {currentSub ? (
        <div className="bg-white dark:bg-[#261E18] border border-[#E2D9CC] dark:border-[#3D2C22] rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2D9CC] dark:border-[#382A21]">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                <span className="text-xl font-bold text-[#2B1D15] dark:text-[#F8F5EE]">
                  Plano {currentSub.plan.name}
                </span>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-bold ${
                    currentSub.status === 'ACTIVE'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : currentSub.status === 'TRIALING'
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      : currentSub.status === 'INCOMPLETE'
                      ? 'bg-[#FAF5ED] dark:bg-[#34241B] text-[#6B3E26] dark:text-[#E2CEBC] border border-[#CDB196] dark:border-[#523A2C]'
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
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FAF8F5] dark:bg-[#34241B] hover:bg-[#F0EAE1] text-[#6B3E26] dark:text-[#E2CEBC] border border-[#E2D9CC] dark:border-[#523A2C] text-xs font-semibold rounded-xl transition-all cursor-pointer"
                  title="Consultar status direto no gateway Asaas"
                >
                  <RefreshCw size={12} className={syncing ? 'animate-spin text-[#6B3E26]' : ''} />
                  <span>{syncing ? 'Verificando...' : 'Verificar Status Asaas'}</span>
                </button>
              </div>
              <p className="text-xs text-[#796758] dark:text-[#CDB196]">
                Cobrança {currentSub.billingCycle === 'YEARLY' ? 'Anual' : 'Mensal'} • Próxima renovação em:{' '}
                <strong className="text-[#2B1D15] dark:text-[#F8F5EE]">
                  {currentSub.currentPeriodEnd
                    ? new Date(currentSub.currentPeriodEnd).toLocaleDateString('pt-BR')
                    : 'N/A'}
                </strong>
              </p>
            </div>

            <div className="text-right">
              <span className="text-3xl font-black text-[#2B1D15] dark:text-[#F8F5EE]">
                R$ {Number(currentSub.amount).toFixed(2)}
              </span>
              <span className="text-xs text-[#796758] dark:text-[#CDB196] font-medium">
                /{currentSub.billingCycle === 'YEARLY' ? 'ano' : 'mês'}
              </span>
            </div>
          </div>

          {/* Usage Meters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            <div className="bg-[#FAF8F5] dark:bg-[#1E1713] p-4 rounded-2xl border border-[#E2D9CC] dark:border-[#3D2C22]">
              <div className="flex items-center justify-between text-xs font-semibold mb-2">
                <span className="text-[#796758] dark:text-[#CDB196]">Profissionais Cadastrados</span>
                <span className="text-[#6B3E26] dark:text-[#E2CEBC] font-bold">
                  {currentUsage.currentProfessionals || 0} / {currentFeatures.maxProfessionals || 1}
                </span>
              </div>
              <div className="w-full bg-[#EFE9DF] dark:bg-[#34241B] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#6B3E26] dark:bg-[#CDB196] h-full rounded-full transition-all"
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

            <div className="bg-[#FAF8F5] dark:bg-[#1E1713] p-4 rounded-2xl border border-[#E2D9CC] dark:border-[#3D2C22]">
              <div className="flex items-center justify-between text-xs font-semibold mb-2">
                <span className="text-[#796758] dark:text-[#CDB196]">Agendamentos no Mês</span>
                <span className="text-[#6B3E26] dark:text-[#E2CEBC] font-bold">
                  {currentUsage.currentAppointmentsThisMonth || 0} /{' '}
                  {currentFeatures.maxAppointments || 100}
                </span>
              </div>
              <div className="w-full bg-[#EFE9DF] dark:bg-[#34241B] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#6B3E26] dark:bg-[#CDB196] h-full rounded-full transition-all"
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

            <div className="bg-[#FAF8F5] dark:bg-[#1E1713] p-4 rounded-2xl border border-[#E2D9CC] dark:border-[#3D2C22]">
              <div className="flex items-center justify-between text-xs font-semibold mb-2">
                <span className="text-[#796758] dark:text-[#CDB196]">Disparos de WhatsApp</span>
                <span className="text-[#6B3E26] dark:text-[#E2CEBC] font-bold">
                  {currentFeatures.whatsappNotifications
                    ? `Até ${currentFeatures.maxWhatsappMessages}/mês`
                    : 'Não Incluso'}
                </span>
              </div>
              <p className="text-[11px] text-[#796758] dark:text-[#CDB196]">
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
          <h2 className="text-xl font-bold text-[#2B1D15] dark:text-[#F8F5EE]">Escolha o Melhor Plano para seu Negócio</h2>
          <p className="text-xs text-[#796758] dark:text-[#CDB196] mt-1">
            Mude de plano a qualquer momento conforme sua equipe cresce.
          </p>

          {/* Cycle Toggle */}
          <div className="inline-flex items-center p-1 bg-[#FAF8F5] dark:bg-[#261E18] rounded-xl mt-4 border border-[#E2D9CC] dark:border-[#3D2C22]">
            <button
              onClick={() => setBillingCycle('MONTHLY')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                billingCycle === 'MONTHLY'
                  ? 'bg-[#6B3E26] text-white shadow-sm'
                  : 'text-[#796758] dark:text-[#CDB196] hover:text-[#2B1D15] dark:hover:text-white'
              }`}
            >
              Cobrança Mensal
            </button>
            <button
              onClick={() => setBillingCycle('YEARLY')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                billingCycle === 'YEARLY'
                  ? 'bg-[#6B3E26] text-white shadow-sm'
                  : 'text-[#796758] dark:text-[#CDB196] hover:text-[#2B1D15] dark:hover:text-white'
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
                className={`bg-white dark:bg-[#261E18] rounded-3xl p-6 border transition-all flex flex-col justify-between ${
                  p.slug === 'professional'
                    ? 'border-[#6B3E26] shadow-lg shadow-[#6B3E26]/10 ring-2 ring-[#6B3E26]'
                    : 'border-[#E2D9CC] dark:border-[#3D2C22] shadow-sm'
                }`}
              >
                <div>
                  {p.slug === 'professional' && (
                    <span className="inline-block px-3 py-1 bg-[#6B3E26] text-white rounded-full text-[10px] font-bold uppercase tracking-wider mb-3">
                      Mais Popular
                    </span>
                  )}

                  <h3 className="font-bold text-[#2B1D15] dark:text-[#F8F5EE] text-lg">{p.name}</h3>
                  <p className="text-xs text-[#796758] dark:text-[#CDB196] mt-1 min-h-[36px]">{p.description}</p>

                  <div className="my-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-[#2B1D15] dark:text-[#F8F5EE]">
                        R$ {Number(price).toFixed(2)}
                      </span>
                      <span className="text-xs text-[#796758] dark:text-[#CDB196] font-medium">
                        /{billingCycle === 'YEARLY' ? 'ano' : 'mês'}
                      </span>
                    </div>
                  </div>

                  {/* Badge de Destaque de Acesso ao Estoque */}
                  {p.features?.inventoryControl || p.slug === 'professional' || p.slug === 'business' ? (
                    <div className="mb-4 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs">
                      <Check size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="font-bold text-emerald-800 dark:text-emerald-300">
                        Acesso ao Estoque: <strong>INCLUSO</strong> ✅
                      </span>
                    </div>
                  ) : (
                    <div className="mb-4 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center gap-2 text-xs">
                      <X size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
                      <span className="font-bold text-amber-800 dark:text-amber-300">
                        Controle de Estoque: <strong>NÃO INCLUSO</strong> ❌
                      </span>
                    </div>
                  )}

                  <div className="space-y-3 text-xs text-[#2B1D15] dark:text-[#F8F5EE]">
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-[#6B3E26] dark:text-[#CDB196] shrink-0" />
                      <span>Até <strong>{p.maxProfessionals}</strong> profissional(is) prestador(es)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-[#6B3E26] dark:text-[#CDB196] shrink-0" />
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                        Conta de Administrador inclusa (não consome vaga)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-[#6B3E26] dark:text-[#CDB196] shrink-0" />
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
                      <Check size={16} className="text-[#6B3E26] dark:text-[#CDB196] shrink-0" />
                      <span>
                        {p.maxWhatsappMessages > 0
                          ? `Até ${p.maxWhatsappMessages} msgs WhatsApp`
                          : 'Notificações WhatsApp desativadas'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.features?.inventoryControl || p.slug === 'professional' || p.slug === 'business' ? (
                        <>
                          <Check size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="font-bold text-emerald-800 dark:text-emerald-300">
                            Gestão de Estoque & Alertas de Reposição
                          </span>
                        </>
                      ) : (
                        <>
                          <X size={16} className="text-amber-700 dark:text-amber-500 shrink-0" />
                          <span className="text-[#9C8B7D] dark:text-[#796758] line-through">
                            Sem controle de estoque (Apenas Pro e Business)
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-[#6B3E26] dark:text-[#CDB196] shrink-0" />
                      <span>Página pública mobile-first</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPlan(p)}
                  disabled={isCurrent}
                  className={`w-full mt-8 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-[#EFE9DF] dark:bg-[#34241B] text-[#796758] dark:text-[#CDB196] cursor-not-allowed'
                      : 'bg-[#6B3E26] hover:bg-[#54311E] text-white shadow-md shadow-[#6B3E26]/20'
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
          <div className="bg-white dark:bg-[#261E18] border border-[#E2D9CC] dark:border-[#3D2C22] rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2D9CC] dark:border-[#382A21] mb-4">
              <h3 className="font-bold text-[#2B1D15] dark:text-[#F8F5EE] text-base">
                Contratar Plano {selectedPlan.name}
              </h3>
              <button
                onClick={() => {
                  setSelectedPlan(null);
                  setCheckoutSuccess(null);
                  setSyncMessage(null);
                }}
                className="text-[#796758] hover:text-[#2B1D15] dark:hover:text-white cursor-pointer"
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
                    <h4 className="font-bold text-[#2B1D15] dark:text-[#F8F5EE] text-lg">Assinatura Ativa!</h4>
                    <p className="text-xs text-[#796758] dark:text-[#CDB196] max-w-xs mx-auto">
                      Seu plano {selectedPlan.name} está 100% ativo e pronto para uso!
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-[#FAF5ED] dark:bg-[#34241B] text-[#6B3E26] dark:text-[#CDB196] flex items-center justify-center mx-auto">
                      <QrCode size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#2B1D15] dark:text-[#F8F5EE] text-base">Cobrança Gerada no Asaas!</h4>
                      <p className="text-xs text-[#796758] dark:text-[#CDB196] mt-1">
                        Pague via Pix ou abra a fatura. O plano será liberado assim que o valor for identificado pelo banco!
                      </p>
                    </div>

                    {/* QR Code Pix se disponível */}
                    {checkoutSuccess.pixQrCode?.encodedImage && (
                      <div className="bg-white p-3 rounded-2xl border border-[#D0C3B2] inline-block mx-auto shadow-sm">
                        <img
                          src={`data:image/png;base64,${checkoutSuccess.pixQrCode.encodedImage}`}
                          alt="Pix QR Code"
                          className="w-48 h-48 mx-auto"
                        />
                        <span className="text-[10px] text-[#796758] font-medium block mt-1">
                          Escaneie no app do seu banco
                        </span>
                      </div>
                    )}

                    {/* Botão Copia e Cola Pix */}
                    {checkoutSuccess.pixQrCode?.payload && (
                      <button
                        type="button"
                        onClick={() => handleCopyPix(checkoutSuccess.pixQrCode.payload)}
                        className="w-full py-2.5 px-3 bg-[#FAF5ED] dark:bg-[#34241B] hover:bg-[#F0EAE1] text-[#6B3E26] dark:text-[#E2CEBC] border border-[#D0C3B2] dark:border-[#523A2C] rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all"
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
                          className="inline-flex items-center justify-center gap-1.5 text-xs text-[#6B3E26] dark:text-[#CDB196] hover:underline font-bold"
                        >
                          <span>Abrir fatura completa no Asaas</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    )}

                    {/* Feedback da Consulta dentro do modal */}
                    {syncMessage && (
                      <div className="p-3 bg-[#FAF5ED] dark:bg-[#34241B] text-[#6B3E26] dark:text-[#E2CEBC] border border-[#CDB196] dark:border-[#523A2C] rounded-xl text-xs font-medium text-left">
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
                        className="w-full py-3 bg-[#6B3E26] hover:bg-[#54311E] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#6B3E26]/20 transition-all"
                      >
                        <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} />
                        <span>{syncing ? 'Consultando Asaas...' : 'Verificar Pagamento no Asaas'}</span>
                      </button>
                      <p className="text-[11px] text-[#796758] dark:text-[#CDB196] mt-2">
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
                  className="w-full py-2.5 bg-[#FAF8F5] dark:bg-[#34241B] border border-[#E2D9CC] dark:border-[#523A2C] text-[#6B3E26] dark:text-[#E2CEBC] rounded-xl text-xs font-bold cursor-pointer hover:bg-[#EFE9DF]"
                >
                  Fechar Janela
                </button>
              </div>
            ) : (
              <form onSubmit={handleCheckout} className="space-y-4 text-xs">
                <div className="p-3 bg-[#FAF8F5] dark:bg-[#34241B] rounded-xl border border-[#E2D9CC] dark:border-[#523A2C] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#2B1D15] dark:text-[#F8F5EE] block text-sm">
                      {selectedPlan.name} ({billingCycle === 'YEARLY' ? 'Anual' : 'Mensal'})
                    </span>
                    <span className="text-[#796758] dark:text-[#CDB196]">Cobrança recorrente Asaas</span>
                  </div>
                  <span className="text-base font-black text-[#6B3E26] dark:text-[#E2CEBC]">
                    R${' '}
                    {Number(
                      billingCycle === 'YEARLY'
                        ? selectedPlan.priceYearly
                        : selectedPlan.priceMonthly,
                    ).toFixed(2)}
                  </span>
                </div>

                <div>
                  <label className="block text-[#2B1D15] dark:text-[#F8F5EE] font-semibold mb-2">Forma de Pagamento</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('PIX')}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        paymentMethod === 'PIX'
                          ? 'border-[#6B3E26] bg-[#FAF5ED] dark:bg-[#34241B] text-[#6B3E26] dark:text-[#E2CEBC] ring-2 ring-[#6B3E26]/20'
                          : 'border-[#E2D9CC] dark:border-[#523A2C] text-[#796758] dark:text-[#CDB196] hover:bg-[#FAF8F5]'
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
                          ? 'border-[#6B3E26] bg-[#FAF5ED] dark:bg-[#34241B] text-[#6B3E26] dark:text-[#E2CEBC] ring-2 ring-[#6B3E26]/20'
                          : 'border-[#E2D9CC] dark:border-[#523A2C] text-[#796758] dark:text-[#CDB196] hover:bg-[#FAF8F5]'
                      }`}
                    >
                      <CreditCard size={20} />
                      <span className="font-bold text-xs">Cartão de Crédito</span>
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E2D9CC] dark:border-[#382A21] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPlan(null)}
                    className="px-3.5 py-2 text-[#796758] dark:text-[#CDB196] hover:bg-[#FAF8F5] dark:hover:bg-[#34241B] rounded-xl font-medium cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={checkingOut}
                    className="px-5 py-2.5 bg-[#6B3E26] hover:bg-[#54311E] text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-md shadow-[#6B3E26]/20"
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
