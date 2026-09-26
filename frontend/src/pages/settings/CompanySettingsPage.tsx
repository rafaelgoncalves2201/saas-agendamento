import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { compressImage } from '../../utils/imageCompressor';
import { Link } from 'react-router-dom';
import {
  Settings,
  Save,
  Loader2,
  CheckCircle2,
  Palette,
  Image,
  DollarSign,
  AlertCircle,
  AlertTriangle,
  Eye,
  MapPin,
  Sparkles,
  Upload,
  ExternalLink,
  Phone,
  Clock,
  Copy,
  Check,
  Smartphone,
  ChevronRight,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';

const InstagramIcon = ({ size = 14, className = '' }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const COVER_PRESETS = [
  {
    name: 'Salão & Estética',
    url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Barbearia Clássica',
    url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Spa & Relax',
    url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Esmalteria & Cílios',
    url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1200&q=80',
  },
];

export const CompanySettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [companySlug, setCompanySlug] = useState('');

  // Preview tab: 'confirmation' (tela da foto) | 'booking' (página inicial)
  const [previewTab, setPreviewTab] = useState<'confirmation' | 'booking'>('confirmation');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    document: '',
    logoUrl: '',
    coverUrl: '',
    primaryColor: '#6B3E26',
    publicTheme: 'light', // 'dark' | 'light'
    bio: '',
    instagram: '',
    address: '',
    paymentModel: 'DEPOSIT_PIX', // 'DEPOSIT_PIX' | 'MERCADO_PAGO' | 'NONE'
    requiresDeposit: true,
    depositValue: 'R$ 50',
    pixKeyType: 'EMAIL',
    pixKey: 'lashhem1@gmail.com',
    pixRecipientName: 'Hayane Beauty',
    depositInstructions: 'Envie o comprovante do sinal pelo WhatsApp para confirmar seu horário.',
    whatsappButtonText: 'Enviar Comprovante pelo WhatsApp',
    welcomeMessage: 'Agende seu horário com nossos profissionais com facilidade e rapidez!',
    cancellationPolicyHours: 2,
    minBookingNoticeMinutes: 60,
  });

  const showNotification = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  const [companyData, setCompanyData] = useState<any>(null);
  const planSlug = (companyData?.subscription?.plan?.slug || '').toLowerCase();
  const isBasic = planSlug === 'basic' || planSlug === 'starter';

  // Mercado Pago do Estabelecimento (Admin)
  const [companyMpStatus, setCompanyMpStatus] = useState<{ isConnected: boolean; mpUserId: string | null } | null>(null);
  const [connectingMp, setConnectingMp] = useState(false);
  const [disconnectingMp, setDisconnectingMp] = useState(false);

  const fetchCompanyMpStatus = () => {
    api.get('/mercadopago/company-status')
      .then((res) => setCompanyMpStatus(res.data))
      .catch(() => {});
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('mp_connected') === 'true') {
      showNotification('success', 'Conta do Mercado Pago do Estabelecimento conectada com sucesso!');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (searchParams.get('mp_error') === 'true') {
      showNotification('error', 'Houve uma falha ao conectar a conta do Mercado Pago.');
      window.history.replaceState({}, '', window.location.pathname);
    }

    api.get('/companies/my-company')
      .then((res) => {
        const c = res.data;
        setCompanyData(c);
        const subSlug = (c.subscription?.plan?.slug || '').toLowerCase();
        if (subSlug !== 'basic' && subSlug !== 'starter') {
          fetchCompanyMpStatus();
        }

        const settings = c.settings || {};
        setCompanySlug(c.slug || '');
        setFormData({
          name: c.name || '',
          phone: c.phone || '',
          email: c.email || '',
          document: c.document || '',
          logoUrl: c.logoUrl || '',
          coverUrl: c.coverUrl || '',
          primaryColor: settings.primaryColor || '#6B3E26',
          publicTheme: settings.publicTheme || 'light',
          bio: settings.bio || '',
          instagram: settings.instagram || '',
          address: settings.address || '',
          paymentModel: settings.paymentModel || (settings.requiresDeposit === false ? 'NONE' : 'DEPOSIT_PIX'),
          requiresDeposit: settings.requiresDeposit !== undefined ? Boolean(settings.requiresDeposit) : true,
          depositValue: settings.depositValue || 'R$ 50',
          pixKeyType: settings.pixKeyType || 'EMAIL',
          pixKey: settings.pixKey || '',
          pixRecipientName: settings.pixRecipientName || c.name || '',
          depositInstructions:
            settings.depositInstructions ||
            'Envie o comprovante do sinal pelo WhatsApp para confirmar seu horário.',
          whatsappButtonText: settings.whatsappButtonText || 'Enviar Comprovante pelo WhatsApp',
          welcomeMessage:
            settings.welcomeMessage ||
            'Agende seu horário com nossos profissionais com facilidade e rapidez!',
          cancellationPolicyHours: settings.cancellationPolicyHours || 2,
          minBookingNoticeMinutes: settings.minBookingNoticeMinutes || 60,
        });
      })
      .catch((err) => {
        console.error(err);
        showNotification('error', 'Erro ao carregar configurações da empresa.');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleConnectCompanyMp = async () => {
    setConnectingMp(true);
    try {
      const res = await api.get('/mercadopago/company-connect');
      const redirectUrl = res.data?.url || res.data?.authUrl;
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        showNotification('error', 'Não foi possível gerar o link de autorização do Mercado Pago.');
      }
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Erro ao gerar link de conexão do Mercado Pago.');
    } finally {
      setConnectingMp(false);
    }
  };

  const handleDisconnectCompanyMp = async () => {
    if (!confirm('Deseja realmente desconectar a conta do Mercado Pago deste estabelecimento?')) return;
    setDisconnectingMp(true);
    try {
      await api.post('/mercadopago/company-disconnect');
      showNotification('success', 'Conta do Mercado Pago desconectada com sucesso.');
      fetchCompanyMpStatus();
    } catch (err: any) {
      showNotification('error', 'Erro ao desconectar conta do Mercado Pago.');
    } finally {
      setDisconnectingMp(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const finalPaymentModel = isBasic ? 'NONE' : formData.paymentModel;
    const finalRequiresDeposit = isBasic ? false : (formData.paymentModel !== 'NONE');

    try {
      await api.patch('/companies/my-company', {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        document: formData.document,
        logoUrl: formData.logoUrl || null,
        coverUrl: formData.coverUrl || null,
        settings: {
          primaryColor: formData.primaryColor,
          publicTheme: formData.publicTheme,
          bio: formData.bio,
          instagram: formData.instagram,
          address: formData.address,
          paymentModel: finalPaymentModel,
          requiresDeposit: finalRequiresDeposit,
          depositValue: isBasic ? 'R$ 0' : formData.depositValue,
          pixKeyType: formData.pixKeyType,
          pixKey: isBasic ? '' : formData.pixKey,
          pixRecipientName: isBasic ? '' : formData.pixRecipientName,
          depositInstructions: formData.depositInstructions,
          whatsappButtonText: formData.whatsappButtonText,
          welcomeMessage: formData.welcomeMessage,
          cancellationPolicyHours: Number(formData.cancellationPolicyHours),
          minBookingNoticeMinutes: Number(formData.minBookingNoticeMinutes),
          timezone: 'America/Sao_Paulo',
        },
      });
      showNotification('success', 'Configurações e personalização salvas com sucesso! O painel e páginas já foram atualizados.');
    } catch (err: any) {
      showNotification(
        'error',
        err.response?.data?.message || 'Erro ao salvar alterações no servidor.',
      );
    } finally {
      setSaving(false);
    }
  };

  const isDarkPublic = formData.publicTheme === 'dark';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Personalização & Identidade da Marca</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Configure as cores da sua empresa, fotos, Mercado Pago Pix e veja a prévia instantânea da tela dos seus clientes.
          </p>
        </div>

        {companySlug && (
          <a
            href={`/empresa/${companySlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 shadow-xs transition-all cursor-pointer"
          >
            <span>Abrir Página Pública Oficial</span>
            <ExternalLink size={14} />
          </a>
        )}
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* COLUNA ESQUERDA: FORMULÁRIO DE CONFIGURAÇÕES (7 Colunas) */}
          <form onSubmit={handleSave} className="lg:col-span-7 space-y-6 text-xs">
            {/* SEÇÃO 1: FOTOS & MARCA (LOGO E BANNER DE CAPA) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-xs bg-indigo-600"
                >
                  <Palette size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">Logo e Foto de Capa do Estabelecimento</h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    A logo e a imagem de capa são exibidas no topo da sua página pública de agendamentos.
                  </p>
                </div>
              </div>

              {/* Logo e Foto de Capa (Banner) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Logo do Estabelecimento
                  </label>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl font-bold cursor-pointer transition-colors text-xs shadow-xs">
                      <Upload size={14} />
                      <span>Anexar Foto dos Arquivos</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const compressed = await compressImage(file, 600, 600, 0.85);
                              setFormData((prev) => ({ ...prev, logoUrl: compressed }));
                            } catch {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setFormData((prev) => ({ ...prev, logoUrl: reader.result as string }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }
                        }}
                      />
                    </label>
                  </div>
                  <input
                    type="url"
                    placeholder="Ou cole a URL da imagem (https://...)"
                    value={formData.logoUrl.startsWith('data:') ? '' : formData.logoUrl}
                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Foto de Capa (Banner Superior)
                  </label>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl font-bold cursor-pointer transition-colors text-xs shadow-xs">
                      <Upload size={14} />
                      <span>Anexar Capa dos Arquivos</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const compressed = await compressImage(file, 1400, 800, 0.85);
                              setFormData((prev) => ({ ...prev, coverUrl: compressed }));
                            } catch {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setFormData((prev) => ({ ...prev, coverUrl: reader.result as string }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }
                        }}
                      />
                    </label>
                  </div>
                  <input
                    type="url"
                    placeholder="Ou cole a URL da capa (https://...)"
                    value={formData.coverUrl.startsWith('data:') ? '' : formData.coverUrl}
                    onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  {/* Sugestões Rápidas */}
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {COVER_PRESETS.map((preset) => (
                      <button
                        type="button"
                        key={preset.name}
                        onClick={() => setFormData({ ...formData, coverUrl: preset.url })}
                        className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md cursor-pointer hover:underline"
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* SEÇÃO 2: MODELO DE PAGAMENTO E SINAL */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                    <DollarSign size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      Modelo de Cobrança e Sinal dos Agendamentos
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Escolha como prefere receber: sinal na sua chave Pix direta (sem taxas), pagamento total pelo Mercado Pago ou agendamento livre.
                    </p>
                  </div>
                </div>
              </div>

              {/* SELETOR DE MODELO */}
              <div className="space-y-3">
                {isBasic && (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs mb-4">
                    <div className="flex items-center gap-2.5 text-amber-800 dark:text-amber-300">
                      <AlertTriangle size={20} className="shrink-0 text-amber-600 dark:text-amber-400" />
                      <div>
                        <strong className="font-bold block">Plano Básico: Cobrança de Sinal e Mercado Pago não inclusos</strong>
                        <span>No plano Básico, os agendamentos são registrados para pagamento presencial com confirmações e lembretes via WhatsApp inclusos. Para receber sinal antecipado via Pix ou pagamentos online via Mercado Pago, faça upgrade para o plano <strong>Profissional</strong> (R$ 59,90) ou <strong>Premium</strong> (R$ 99,90).</span>
                      </div>
                    </div>
                    <Link
                      to="/subscription"
                      className="px-4 py-2 bg-[#6B3E26] hover:bg-[#54311E] text-white rounded-xl font-bold shrink-0 text-center transition-colors shadow-sm"
                    >
                      Fazer Upgrade
                    </Link>
                  </div>
                )}

                <label className="block text-slate-800 dark:text-slate-200 font-bold text-xs">
                  Como seu estabelecimento deseja receber os agendamentos?
                </label>

                <div className={`grid grid-cols-1 ${isBasic ? 'sm:grid-cols-1' : 'sm:grid-cols-3'} gap-3`}>
                  {/* OPÇÃO 1: SINAL NA CHAVE PIX (Disponível apenas em Pro e Premium) */}
                  {!isBasic && (
                    <div
                      onClick={() => setFormData({ ...formData, paymentModel: 'DEPOSIT_PIX' })}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        formData.paymentModel === 'DEPOSIT_PIX'
                          ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          <span
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs transition-colors ${
                              formData.paymentModel === 'DEPOSIT_PIX'
                                ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950'
                                : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                            }`}
                          >
                            Pix
                          </span>
                          <span
                            className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full transition-colors ${
                              formData.paymentModel === 'DEPOSIT_PIX'
                                ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-transparent dark:border-emerald-800/40'
                            }`}
                          >
                            Sem Taxas
                          </span>
                        </div>
                        <h4
                          className={`font-extrabold text-xs mb-1.5 ${
                            formData.paymentModel === 'DEPOSIT_PIX'
                              ? 'text-emerald-950 dark:text-emerald-200'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          Sinal via Chave Pix
                        </h4>
                        <p
                          className={`text-[11px] leading-snug ${
                            formData.paymentModel === 'DEPOSIT_PIX'
                              ? 'text-emerald-900/80 dark:text-emerald-300/80'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          O cliente transfere o sinal para a chave do seu banco e envia o comprovante. O restante é pago no local. <strong className="font-bold">Mercado Pago não obrigatório.</strong>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* OPÇÃO 2: MERCADO PAGO (Disponível apenas em Pro e Premium) */}
                  {!isBasic && (
                    <div
                      onClick={() => setFormData({ ...formData, paymentModel: 'MERCADO_PAGO' })}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        formData.paymentModel === 'MERCADO_PAGO'
                          ? 'border-sky-600 dark:border-sky-500 bg-sky-50/80 dark:bg-sky-950/40 ring-2 ring-sky-500/20 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          <span
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm transition-colors ${
                              formData.paymentModel === 'MERCADO_PAGO'
                                ? 'bg-sky-600 dark:bg-sky-500 text-white dark:text-slate-950'
                                : 'bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300'
                            }`}
                          >
                            <CreditCard size={16} />
                          </span>
                          <span
                            className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full transition-colors ${
                              formData.paymentModel === 'MERCADO_PAGO'
                                ? 'bg-sky-600 dark:bg-sky-500 text-white dark:text-slate-950'
                                : 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border border-transparent dark:border-sky-800/40'
                            }`}
                          >
                            100% Automático
                          </span>
                        </div>
                        <h4
                          className={`font-extrabold text-xs mb-1.5 ${
                            formData.paymentModel === 'MERCADO_PAGO'
                              ? 'text-sky-950 dark:text-sky-200'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          Mercado Pago (Valor Total)
                        </h4>
                        <p
                          className={`text-[11px] leading-snug ${
                            formData.paymentModel === 'MERCADO_PAGO'
                              ? 'text-sky-900/80 dark:text-sky-300/80'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          Receba 100% do serviço adiantado via Pix automático ou Cartão até 12x. Confirmação instantânea sem precisar conferir comprovante.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* OPÇÃO 3: SEM SINAL */}
                  <div
                    onClick={() => setFormData({ ...formData, paymentModel: 'NONE' })}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      formData.paymentModel === 'NONE' || isBasic
                        ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <span
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm transition-colors ${
                            formData.paymentModel === 'NONE' || isBasic
                              ? 'bg-indigo-600 dark:bg-indigo-500 text-white dark:text-slate-950'
                              : 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300'
                          }`}
                        >
                          <CheckCircle2 size={16} />
                        </span>
                        <span
                          className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full transition-colors ${
                            formData.paymentModel === 'NONE' || isBasic
                              ? 'bg-indigo-600 dark:bg-indigo-500 text-white dark:text-slate-950'
                              : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/60 dark:border-slate-750'
                          }`}
                        >
                          Pagar no Local
                        </span>
                      </div>
                      <h4
                        className={`font-extrabold text-xs mb-1.5 ${
                          formData.paymentModel === 'NONE' || isBasic
                            ? 'text-indigo-950 dark:text-indigo-200'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        Agendamento Livre (Sem Sinal)
                      </h4>
                      <p
                        className={`text-[11px] leading-snug ${
                          formData.paymentModel === 'NONE' || isBasic
                            ? 'text-indigo-900/80 dark:text-indigo-300/80'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        O cliente agenda livremente sem pagar sinal online. O valor integral do atendimento é acertado pessoalmente no balcão.
                      </p>
                    </div>
                  </div>
                </div>
              </div>


              {/* CAMPOS ESPECÍFICOS PARA SINAL VIA CHAVE PIX */}
              {!isBasic && formData.paymentModel === 'DEPOSIT_PIX' && (
                <div className="space-y-4 p-5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                    <Check size={16} />
                    <span>Configuração do Sinal na sua Chave Pix (Restante no Local)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 text-xs">
                        Valor do Sinal de Reserva *
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: R$ 50 ou 30%"
                        value={formData.depositValue}
                        onChange={(e) => setFormData({ ...formData, depositValue: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                        Pode ser valor fixo em reais (ex: R$ 30, R$ 50) ou percentual do serviço (ex: 30%, 50%).
                      </p>
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 text-xs">
                        Tipo da sua Chave Pix *
                      </label>
                      <select
                        value={formData.pixKeyType}
                        onChange={(e) => setFormData({ ...formData, pixKeyType: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        <option value="EMAIL">E-mail</option>
                        <option value="CELULAR">Celular / WhatsApp</option>
                        <option value="CPF">CPF</option>
                        <option value="CNPJ">CNPJ</option>
                        <option value="CHAVE_ALEATORIA">Chave Aleatória (EVP)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 text-xs">
                        Sua Chave Pix para Recebimento *
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: lashhem1@gmail.com ou 17996220064"
                        value={formData.pixKey}
                        onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 text-xs">
                        Nome do Titular / Favorecido da Conta
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Hayane Beauty"
                        value={formData.pixRecipientName}
                        onChange={(e) => setFormData({ ...formData, pixRecipientName: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 text-xs">
                        Orientações para o Cliente na Tela de Pagamento
                      </label>
                      <textarea
                        rows={2}
                        value={formData.depositInstructions}
                        onChange={(e) => setFormData({ ...formData, depositInstructions: e.target.value })}
                        placeholder="Ex: Transfira o valor do sinal via Pix e envie o comprovante pelo WhatsApp para confirmar seu horário. O restante é pago no dia."
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 text-xs">
                        Texto do Botão de WhatsApp
                      </label>
                      <input
                        type="text"
                        value={formData.whatsappButtonText}
                        onChange={(e) => setFormData({ ...formData, whatsappButtonText: e.target.value })}
                        placeholder="Ex: Enviar Comprovante pelo WhatsApp"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* CAMPOS ESPECÍFICOS PARA MERCADO PAGO */}
              {!isBasic && formData.paymentModel === 'MERCADO_PAGO' && (
                <div className="space-y-4 p-5 bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800/60 rounded-2xl">
                  <div className="flex items-center gap-2 text-sky-800 dark:text-sky-300 font-bold text-xs">
                    <CreditCard size={16} />
                    <span>Conexão Oficial Mercado Pago (Pix e Cartão até 12x)</span>
                  </div>

                  <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        Conta Mercado Pago do Administrador
                      </span>
                      {companyMpStatus?.isConnected ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          Conectado (ID: {companyMpStatus.mpUserId || 'Ativo'})
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200">
                          Desconectado
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      {companyMpStatus?.isConnected
                        ? 'Sua conta Mercado Pago está conectada e pronta! Os clientes podem pagar 100% antecipado via Pix ou parcelar no Cartão, com confirmação automática imediata.'
                        : 'Conecte sua conta do Mercado Pago para liberar o recebimento de Pix e Cartão de Crédito com confirmação 100% automática.'}
                    </p>

                    <div className="pt-1">
                      {companyMpStatus?.isConnected ? (
                        <button
                          type="button"
                          onClick={handleDisconnectCompanyMp}
                          disabled={disconnectingMp}
                          className="py-2 px-3 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          {disconnectingMp ? <Loader2 size={13} className="animate-spin" /> : null}
                          <span>Desconectar Mercado Pago</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleConnectCompanyMp}
                          disabled={connectingMp}
                          className="py-2.5 px-4 bg-[#009ee3] hover:bg-[#0082ba] text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-2"
                        >
                          {connectingMp ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
                          <span>Conectar Conta Mercado Pago (OAuth)</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* MENSAGEM QUANDO SEM COBRANÇA */}
              {formData.paymentModel === 'NONE' && (
                <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl text-xs text-indigo-900 dark:text-indigo-200 flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <p>
                    <strong>Agendamento Livre Ativado:</strong> Nenhum pagamento ou sinal será solicitado na página de agendamento online. Os clientes recebem a confirmação instantaneamente e pagam pessoalmente no estabelecimento após o atendimento.
                  </p>
                </div>
              )}
            </div>

            {/* SEÇÃO 3: DADOS CADASTRAIS DO ESTABELECIMENTO */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
                Dados e Contato do Estabelecimento
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Nome Comercial *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">WhatsApp de Contato *</label>
                  <input
                    type="text"
                    required
                    placeholder="DDD + Número (ex: 17996220064)"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Instagram (@usuario)</label>
                  <input
                    type="text"
                    placeholder="@hayanebeauty"
                    value={formData.instagram}
                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Endereço Físico</label>
                  <input
                    type="text"
                    placeholder="Rua / Avenida, Bairro, Cidade"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Bio / Apresentação do Negócio
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Especialista em extensões de cílios e sobrancelhas com design exclusivo."
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Botão de Salvar */}
            <div className="pt-2 flex items-center justify-end">
              <button
                type="submit"
                disabled={saving}
                style={{ backgroundColor: formData.primaryColor }}
                className="px-6 py-3.5 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-lg hover:brightness-110 transition-all text-xs"
              >
                {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                <span>Salvar Todas as Configurações</span>
              </button>
            </div>
          </form>

          {/* COLUNA DIREITA: VISUALIZADOR EM TEMPO REAL (SMARTPHONE MOCKUP) (5 Colunas) */}
          <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Smartphone size={16} className="text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                  Prévia em Tempo Real
                </h3>
              </div>
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                Ao Vivo
              </span>
            </div>

            {/* Abas da Prévia */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setPreviewTab('confirmation')}
                className={`py-1.5 px-2 rounded-lg font-bold transition-all text-center cursor-pointer text-[11px] ${
                  previewTab === 'confirmation'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Tela de Pagamento Pix
              </button>

              <button
                type="button"
                onClick={() => setPreviewTab('booking')}
                className={`py-1.5 px-2 rounded-lg font-bold transition-all text-center cursor-pointer text-[11px] ${
                  previewTab === 'booking'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Página de Agendamento
              </button>
            </div>

            {/* CHASSI DO SMARTPHONE MOCKUP */}
            <div className="relative mx-auto w-full max-w-[340px] bg-slate-900 border-[7px] border-slate-800 rounded-[38px] shadow-2xl overflow-hidden ring-1 ring-slate-700/50">
              {/* Dynamic Island / Notch */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-full z-30 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-900/90 ml-auto mr-2"></div>
              </div>

              {/* TELA INTERNA DO SMARTPHONE */}
              <div
                className={`h-[560px] overflow-y-auto text-[11px] transition-colors select-none ${
                  isDarkPublic ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'
                }`}
              >
                {/* HEADER / BANNER DO ESTABELECIMENTO */}
                <div
                  className="relative p-4 pt-8 text-white bg-cover bg-center overflow-hidden"
                  style={{
                    backgroundColor: formData.primaryColor,
                    backgroundImage: formData.coverUrl
                      ? `linear-gradient(to bottom, rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.85)), url(${formData.coverUrl})`
                      : undefined,
                  }}
                >
                  <div className="flex items-center gap-2.5 relative z-10">
                    <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-black text-base shadow-sm shrink-0 overflow-hidden">
                      {formData.logoUrl ? (
                        <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        (formData.name?.charAt(0) || 'H').toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm inline-block">
                        AGENDAMENTO ONLINE
                      </span>
                      <h4 className="font-black text-sm truncate leading-tight mt-0.5">
                        {formData.name || 'Hayane Beauty'}
                      </h4>
                      <p className="text-[10px] text-white/80 truncate">
                        {formData.phone ? `📞 ${formData.phone}` : '📞 (00) 00000-0000'}
                      </p>
                    </div>
                  </div>

                  {previewTab === 'confirmation' && (
                    <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center gap-1.5 text-[10px] text-white/90">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span>Atendimento com <strong>Hemilli da Silva</strong></span>
                    </div>
                  )}
                </div>

                {/* CORPO DA PRÉVIA: ABA 1 - TELA DA FOTO (CONFIRMAÇÃO / PIX) */}
                {previewTab === 'confirmation' && (
                  <div className="p-3.5 space-y-3">
                    {/* Ícone de Relógio e Status */}
                    <div className="text-center pt-1">
                      <div className="w-11 h-11 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-2 shadow-inner">
                        <Clock size={22} className="animate-pulse" />
                      </div>
                      <span className="inline-block text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 mb-1">
                        AGUARDANDO PAGAMENTO
                      </span>
                      <h5 className="font-black text-sm text-slate-100">Aguardando Pagamento do Serviço</h5>
                      <p className="text-[10px] text-slate-400 px-2 mt-0.5 leading-snug">
                        Seu horário está pré-reservado por 15 minutos. Efetue o pagamento do valor total via Pix abaixo para confirmação imediata.
                      </p>
                    </div>

                    {/* CARD DADOS PARA PAGAMENTO DO SERVIÇO */}
                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-[10px] space-y-2 shadow-md">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                        <span className="text-amber-500 font-black uppercase tracking-wider text-[9px]">
                          DADOS PARA PAGAMENTO VIA PIX
                        </span>
                        <span className="font-black text-amber-500 text-xs">
                          R$ 80,00 (Total)
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[9px]">Favorecido / Titular:</span>
                        <strong className="text-slate-200">{formData.pixRecipientName || formData.name || 'Hayane Beauty'}</strong>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[9px] mb-0.5">
                          Chave Pix ({formData.pixKeyType}):
                        </span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            readOnly
                            value={formData.pixKey || 'lashhem1@gmail.com'}
                            className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg font-mono text-[10px] text-slate-200"
                          />
                          <span className="px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 font-bold shrink-0 text-[9px]">
                            Copiar
                          </span>
                        </div>
                      </div>

                      <div className="p-2 bg-slate-800/80 rounded-xl text-[9px] text-slate-300 leading-snug border border-slate-750">
                        <strong>Orientações:</strong> {formData.depositInstructions || 'Efetue o pagamento do Pix para confirmação imediata do seu horário.'}
                      </div>
                    </div>

                    {/* BOTÃO DO WHATSAPP (VERDE CLÁSSICO) */}
                    <div>
                      <div className="w-full py-2.5 bg-[#25D366] text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/40 text-xs">
                        <Phone size={14} />
                        <span>{formData.whatsappButtonText || 'Enviar Comprovante pelo WhatsApp'}</span>
                      </div>
                      <p className="text-[9px] text-slate-400 text-center mt-1">
                        Ao clicar, o WhatsApp abrirá com mensagem pronta e o resumo do seu agendamento.
                      </p>
                    </div>

                    {/* RESUMO DO AGENDAMENTO */}
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl space-y-1 text-[10px]">
                      <p><span className="text-slate-400">Serviço:</span> <strong className="text-white">Kim Kardashian</strong></p>
                      <p><span className="text-slate-400">Profissional:</span> <strong className="text-white">Hemilli da Silva</strong></p>
                      <p><span className="text-slate-400">Horário:</span> <strong className="text-white">09:30 até 12:30 (28/09/2026)</strong></p>
                      <p><span className="text-slate-400">Local:</span> <strong className="text-white">{formData.name || 'Hayane Beauty'}</strong></p>
                    </div>

                    <div className="w-full py-2 text-center bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-[10px]">
                      Consultar ou Cancelar Agendamento
                    </div>
                  </div>
                )}

                {/* CORPO DA PRÉVIA: ABA 2 - PÁGINA INICIAL DE AGENDAMENTO */}
                {previewTab === 'booking' && (
                  <div className="p-3.5 space-y-3">
                    <div className="text-center">
                      <h5 className="font-black text-xs text-slate-100">Escolha seu Procedimento</h5>
                      <p className="text-[9px] text-slate-400">Selecione para ver horários disponíveis</p>
                    </div>

                    {/* Exemplo de Card de Serviço com a cor selecionada */}
                    <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-900 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Cílios</span>
                        <h6 className="font-bold text-xs text-white">Kim Kardashian</h6>
                        <span className="text-[10px] text-slate-400">3h de atendimento fechado</span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-xs" style={{ color: formData.primaryColor }}>
                          R$ 180,00
                        </span>
                        <div
                          className="mt-1 px-2.5 py-1 text-white rounded-lg text-[9px] font-bold flex items-center gap-1 shadow-xs"
                          style={{ backgroundColor: formData.primaryColor }}
                        >
                          <span>Agendar</span>
                          <ChevronRight size={10} />
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-900 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Sobrancelhas</span>
                        <h6 className="font-bold text-xs text-white">Design & Henna</h6>
                        <span className="text-[10px] text-slate-400">45 minutos</span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-xs" style={{ color: formData.primaryColor }}>
                          R$ 65,00
                        </span>
                        <div
                          className="mt-1 px-2.5 py-1 text-white rounded-lg text-[9px] font-bold flex items-center gap-1 shadow-xs"
                          style={{ backgroundColor: formData.primaryColor }}
                        >
                          <span>Agendar</span>
                          <ChevronRight size={10} />
                        </div>
                      </div>
                    </div>

                    {/* Botão de Exemplo */}
                    <div
                      className="w-full py-2.5 text-white font-bold rounded-xl text-center text-xs shadow-md mt-2"
                      style={{ backgroundColor: formData.primaryColor }}
                    >
                      Continuar para Escolha do Horário
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="text-center pt-1">
              <span className="text-[11px] text-slate-400">
                Visualização em tempo real das alterações do seu negócio
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
