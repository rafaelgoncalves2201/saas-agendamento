import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import {
  UserCheck,
  Plus,
  Copy,
  ExternalLink,
  Trash2,
  Loader2,
  X,
  AlertCircle,
  Upload,
  CreditCard,
  QrCode,
  CheckCircle2,
  ShieldCheck,
  Settings,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { DeleteConfirmationModal } from '../../components/DeleteConfirmationModal';
import { useAuthStore } from '../../store/useAuthStore';

export const ProfessionalsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [features, setFeatures] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [creatingAdminProf, setCreatingAdminProf] = useState(false);

  // Status de retorno OAuth do Mercado Pago via URL
  const [mpBanner, setMpBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  // Deletion state
  const [professionalToDelete, setProfessionalToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Mercado Pago / Sinal Modal State
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [selectedProfForDeposit, setSelectedProfForDeposit] = useState<any | null>(null);
  const [depositFormData, setDepositFormData] = useState({
    requiresDeposit: false,
    depositType: 'FIXED',
    depositValue: 20,
  });
  const [savingDeposit, setSavingDeposit] = useState(false);
  const [connectingMp, setConnectingMp] = useState(false);
  const [disconnectingMp, setDisconnectingMp] = useState(false);

  // Create Professional Form
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    phone: '',
    email: '',
    bio: '',
    avatarUrl: '',
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get('/professionals'),
      api.get('/subscriptions/me/features'),
      api.get('/companies/my-company'),
    ])
      .then(([profRes, featRes, compRes]) => {
        setProfessionals(profRes.data);
        setFeatures(featRes.data);
        setCompany(compRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();

    // Checar se retornou de conexão OAuth do Mercado Pago
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('mp_connected') === 'true') {
      setMpBanner({
        type: 'success',
        message: 'Conta do Mercado Pago conectada com sucesso! O profissional já pode cobrar sinal de agendamentos via Pix automático.',
      });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (searchParams.get('mp_error') === 'true') {
      setMpBanner({
        type: 'error',
        message: 'Houve uma falha ao conectar a conta do Mercado Pago. Por favor, tente novamente.',
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() ? formData.email.trim() : undefined,
        bio: formData.bio.trim() ? formData.bio.trim() : undefined,
        avatarUrl: formData.avatarUrl.trim() ? formData.avatarUrl.trim() : undefined,
      };

      await api.post('/professionals', payload);
      setModalOpen(false);
      setFormData({ name: '', slug: '', phone: '', email: '', bio: '', avatarUrl: '' });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao criar profissional');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!professionalToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/professionals/${professionalToDelete.id}`);
      setProfessionalToDelete(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao excluir profissional');
    } finally {
      setDeleting(false);
    }
  };

  const handleCopyLink = (professionalSlug: string, profId: string) => {
    const url = `${window.location.origin}/empresa/${company?.slug}/profissional/${professionalSlug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(profId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Abrir Modal de Configuração de Sinal e Mercado Pago
  const openDepositModal = (prof: any) => {
    setSelectedProfForDeposit(prof);
    setDepositFormData({
      requiresDeposit: prof.requiresDeposit ?? false,
      depositType: prof.depositType ?? 'FIXED',
      depositValue: prof.depositValue ? Number(prof.depositValue) : 20,
    });
    setDepositModalOpen(true);
  };

  // Conectar OAuth Mercado Pago
  const handleConnectMercadoPago = async () => {
    if (!selectedProfForDeposit) return;
    setConnectingMp(true);
    try {
      const res = await api.get(`/mercadopago/connect/${selectedProfForDeposit.id}`);
      const redirectUrl = res.data?.url || res.data?.authUrl;
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        alert('Não foi possível gerar o link de autorização do Mercado Pago.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao iniciar autorização com Mercado Pago.');
    } finally {
      setConnectingMp(false);
    }
  };

  // Desconectar Mercado Pago
  const handleDisconnectMercadoPago = async () => {
    if (!selectedProfForDeposit) return;
    if (!confirm('Deseja realmente desconectar a conta do Mercado Pago deste profissional?')) return;
    setDisconnectingMp(true);
    try {
      await api.post(`/mercadopago/disconnect/${selectedProfForDeposit.id}`);
      setDepositModalOpen(false);
      setSelectedProfForDeposit(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao desconectar conta do Mercado Pago.');
    } finally {
      setDisconnectingMp(false);
    }
  };

  // Salvar configurações de sinal
  const handleSaveDepositSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfForDeposit) return;
    setSavingDeposit(true);
    try {
      await api.patch(`/mercadopago/deposit-settings/${selectedProfForDeposit.id}`, {
        requiresDeposit: depositFormData.requiresDeposit,
        depositType: depositFormData.depositType,
        depositValue: Number(depositFormData.depositValue),
      });
      setDepositModalOpen(false);
      setSelectedProfForDeposit(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao salvar configurações de sinal.');
    } finally {
      setSavingDeposit(false);
    }
  };

  const isAdminWithoutProf = Boolean(
    user &&
    (user.role === 'COMPANY_ADMIN' || user.role === 'SUPER_ADMIN') &&
    !professionals.some(
      (p) =>
        (p.email && user.email && p.email.toLowerCase() === user.email.toLowerCase()) ||
        p.userId === user.id,
    ),
  );

  const handleCreateAdminProfessional = async () => {
    if (!user) return;
    setCreatingAdminProf(true);
    try {
      const slug = (user.name || 'admin').toLowerCase().trim().replace(/[^a-z0-9]/g, '-');
      await api.post('/professionals', {
        name: user.name,
        slug: `${slug}-${Date.now().toString().slice(-4)}`,
        phone: user.phone || company?.phone || '11999998888',
        email: user.email,
        bio: `Administrador e Profissional em ${company?.name || 'Inova Agenda'}`,
      });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao criar perfil de profissional para o Administrador.');
    } finally {
      setCreatingAdminProf(false);
    }
  };

  const isLimitReached =
    features &&
    features.usage?.currentProfessionals >= features.features?.maxProfessionals;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Banner de Feedback MP */}
      {mpBanner && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
            mpBanner.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="shrink-0" />
            <span className="font-semibold">{mpBanner.message}</span>
          </div>
          <button
            onClick={() => setMpBanner(null)}
            className="cursor-pointer font-bold opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Banner de Ativação de Perfil para Administrador */}
      {isAdminWithoutProf && (
        <div className="p-4 rounded-2xl bg-[#FAF5ED] dark:bg-[#2B1F14] border border-[#E5D7C5] dark:border-[#4A3220] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2.5 text-[#6B3E26] dark:text-[#E2CEBC]">
            <Sparkles size={18} className="text-[#6B3E26] dark:text-[#E2CEBC] shrink-0" />
            <div>
              <strong className="block font-bold">Você está logado como Administrador ({user?.name})</strong>
              <span>Você ainda não possui um perfil na equipe para receber agendamentos. Deseja atender como profissional?</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCreateAdminProfessional}
            disabled={creatingAdminProf}
            className="px-4 py-2 bg-[#6B3E26] hover:bg-[#54311E] text-white rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-sm"
          >
            {creatingAdminProf ? <Loader2 size={13} className="animate-spin" /> : <Plus size={14} />}
            <span>Ativar Meu Perfil Profissional</span>
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2B1D15] dark:text-[#FAF7F2]">Profissionais</h1>
          <p className="text-sm text-[#796758] dark:text-[#CDB196] mt-0.5">
            Gerencie sua equipe, links individuais e contas do Mercado Pago para cobrança de sinal via Pix.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {features && (
            <div className="px-3 py-1.5 rounded-xl bg-[#FAF5ED] dark:bg-[#2B1F14] border border-[#E2D9CC] dark:border-[#382A21] text-xs font-semibold text-[#6B3E26] dark:text-[#E2CEBC]">
              Uso do Plano: {features.usage?.currentProfessionals} / {features.features?.maxProfessionals} prof.
            </div>
          )}

          <button
            onClick={() => setModalOpen(true)}
            disabled={isLimitReached}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              isLimitReached
                ? 'bg-[#EFE9DF] dark:bg-[#34241B] text-[#9C8B7D] dark:text-[#796758] cursor-not-allowed'
                : 'bg-[#6B3E26] hover:bg-[#54311E] text-white shadow-md shadow-[#6B3E26]/20 cursor-pointer'
            }`}
          >
            <Plus size={16} />
            <span>Novo Profissional</span>
          </button>
        </div>
      </div>

      {/* Plan limit warning banner */}
      {isLimitReached && (
        <div className="p-4 rounded-xl bg-[#FAF5ED] dark:bg-[#2B1F14] border border-[#E5D7C5] dark:border-[#4A3220] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-xs text-[#6B3E26] dark:text-[#E2CEBC]">
            <AlertCircle size={18} className="text-[#6B3E26] shrink-0" />
            <span>
              Você atingiu o limite máximo de <strong>{features.features.maxProfessionals} profissional(is)</strong> do plano {features.plan}.
            </span>
          </div>
          <Link
            to="/subscription"
            className="px-3 py-1.5 bg-[#6B3E26] hover:bg-[#54311E] text-white rounded-lg text-xs font-bold shrink-0 transition-colors"
          >
            Fazer Upgrade
          </Link>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-[#6B3E26]" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {professionals.map((prof) => {
            const publicLink = `/empresa/${company?.slug}/profissional/${prof.slug}`;
            const hasMp = Boolean(prof.mpAccessToken);

            return (
              <div
                key={prof.id}
                className="bg-white dark:bg-[#251C16] border border-[#E2D9CC] dark:border-[#382A21] rounded-3xl p-5 shadow-sm flex flex-col justify-between hover:border-[#6B3E26]/60 transition-all space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3.5 overflow-hidden">
                      {prof.avatarUrl ? (
                        <img
                          src={prof.avatarUrl}
                          alt={prof.name}
                          className="w-12 h-12 rounded-2xl object-cover border border-[#E2D9CC] dark:border-[#382A21] shadow-xs shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-[#6B3E26] text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0">
                          {prof.name.charAt(0)}
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <h3 className="font-bold text-[#2B1D15] dark:text-[#FAF7F2] text-base truncate">
                          {prof.name}
                        </h3>
                        <p className="text-xs text-[#796758] dark:text-[#CDB196] truncate">{prof.phone}</p>
                        {prof.email ? (
                          <p className="text-xs text-[#9C8B7D] dark:text-[#796758] truncate">{prof.email}</p>
                        ) : (
                          <span className="inline-block text-[10px] text-[#9C8B7D] dark:text-[#796758] italic">
                            Sem e-mail cadastrado
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => setProfessionalToDelete(prof)}
                      className="p-1.5 text-[#9C8B7D] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Excluir Profissional"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <p className="text-xs text-[#5A4A3E] dark:text-[#CDB196] mb-3 line-clamp-2">
                    {prof.bio || 'Sem biografia cadastrada.'}
                  </p>

                  {/* Status Mercado Pago e Sinal */}
                  <div className="p-3 bg-[#FAF8F5] dark:bg-[#1E1713] rounded-2xl border border-[#E2D9CC] dark:border-[#382A21] space-y-2 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#796758] dark:text-[#CDB196]">
                        Mercado Pago:
                      </span>
                      {hasMp ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Conectado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF5ED] text-[#796758] dark:bg-[#2B1F14] dark:text-[#CDB196] border border-[#E2D9CC] dark:border-[#382A21]">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Desconectado
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#796758] dark:text-[#CDB196] text-[11px]">Cobrança de Sinal:</span>
                      <strong className="text-[#2B1D15] dark:text-[#FAF7F2] text-[11px]">
                        {prof.requiresDeposit
                          ? prof.depositType === 'PERCENTAGE'
                            ? `${prof.depositValue}% do valor`
                            : `R$ ${Number(prof.depositValue || 0).toFixed(2)}`
                          : 'Desativada'}
                      </strong>
                    </div>

                    <button
                      onClick={() => openDepositModal(prof)}
                      className="w-full mt-1 py-1.5 px-3 bg-white dark:bg-[#251C16] hover:bg-[#F5EFE6] dark:hover:bg-[#34241B] border border-[#E2D9CC] dark:border-[#382A21] text-[#6B3E26] dark:text-[#E2CEBC] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <CreditCard size={13} />
                      <span>Configurar Sinal (Mercado Pago)</span>
                    </button>
                  </div>
                </div>

                {/* Individual Link Section */}
                <div className="pt-3 border-t border-[#EFE9DF] dark:border-[#382A21] space-y-2">
                  <div className="text-[11px] font-semibold text-[#796758] dark:text-[#CDB196] uppercase tracking-wider">
                    Link de Agendamento Individual:
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopyLink(prof.slug, prof.id)}
                      className="flex-1 px-2.5 py-1.5 bg-[#FAF8F5] dark:bg-[#1E1713] hover:bg-[#F5EFE6] dark:hover:bg-[#34241B] border border-[#E2D9CC] dark:border-[#382A21] rounded-xl text-xs font-bold text-[#6B3E26] dark:text-[#FAF7F2] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Copy size={13} />
                      <span>{copiedId === prof.id ? 'Link Copiado! ✅' : 'Copiar Link'}</span>
                    </button>

                    <a
                      href={publicLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-[#FAF8F5] dark:bg-[#1E1713] hover:bg-[#F5EFE6] dark:hover:bg-[#34241B] border border-[#E2D9CC] dark:border-[#382A21] rounded-xl text-[#6B3E26] dark:text-[#CDB196] transition-colors"
                      title="Abrir Página Pública"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL CONFIGURAR SINAL & MERCADO PAGO */}
      {depositModalOpen && selectedProfForDeposit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#251C16] border border-[#E2D9CC] dark:border-[#382A21] rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE9DF] dark:border-[#382A21]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#F5EFE6] dark:bg-[#2B1F14] text-[#6B3E26] dark:text-[#E2CEBC] flex items-center justify-center font-bold">
                  <CreditCard size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-[#2B1D15] dark:text-[#FAF7F2] text-base">
                    Cobrança de Sinal & Mercado Pago
                  </h3>
                  <p className="text-xs text-[#796758] dark:text-[#CDB196]">
                    Profissional: <strong>{selectedProfForDeposit.name}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDepositModalOpen(false)}
                className="text-[#9C8B7D] hover:text-[#2B1D15] dark:hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* SEÇÃO 1: CONEXÃO OAUTH MERCADO PAGO */}
            <div className="p-4 bg-[#FAF8F5] dark:bg-[#1E1713] rounded-2xl border border-[#E2D9CC] dark:border-[#382A21] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-[#2B1D15] dark:text-[#FAF7F2]">
                    Conta Mercado Pago Vinculada:
                  </span>
                </div>
                {selectedProfForDeposit.mpAccessToken ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    Ativa (ID: {selectedProfForDeposit.mpUserId || 'OK'})
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF5ED] text-[#796758] dark:bg-[#2B1F14] dark:text-[#CDB196] border border-[#E2D9CC]">
                    Não Vinculada
                  </span>
                )}
              </div>

              <p className="text-[11px] text-[#796758] dark:text-[#CDB196] leading-relaxed">
                {selectedProfForDeposit.mpAccessToken
                  ? 'A conta deste profissional já está pronta para receber pagamentos de sinal direto no saldo do Mercado Pago.'
                  : 'Ao conectar o Mercado Pago deste profissional, os clientes que agendarem com ele pagarão o sinal via Pix gerado na hora e o dinheiro cairá 100% na conta dele.'}
              </p>

              <div className="pt-1">
                {selectedProfForDeposit.mpAccessToken ? (
                  <button
                    type="button"
                    onClick={handleDisconnectMercadoPago}
                    disabled={disconnectingMp}
                    className="w-full py-2.5 px-3 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {disconnectingMp ? <Loader2 size={13} className="animate-spin" /> : null}
                    <span>Desconectar Conta do Mercado Pago</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleConnectMercadoPago}
                    disabled={connectingMp}
                    className="w-full py-3 px-4 bg-[#009ee3] hover:bg-[#0082ba] text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {connectingMp ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <CreditCard size={14} />
                    )}
                    <span>Conectar Conta Mercado Pago (OAuth)</span>
                  </button>
                )}
              </div>
            </div>

            {/* SEÇÃO 2: REGRAS DO SINAL */}
            <form onSubmit={handleSaveDepositSettings} className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3.5 bg-[#FAF8F5] dark:bg-[#1E1713] rounded-2xl border border-[#E2D9CC] dark:border-[#382A21]">
                <div>
                  <span className="font-bold text-[#2B1D15] dark:text-[#FAF7F2] block">
                    Exigir Pagamento de Sinal via Pix
                  </span>
                  <span className="text-[11px] text-[#796758] dark:text-[#CDB196]">
                    O agendamento só será confirmado quando o cliente pagar o Pix.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={depositFormData.requiresDeposit}
                  onChange={(e) =>
                    setDepositFormData({
                      ...depositFormData,
                      requiresDeposit: e.target.checked,
                    })
                  }
                  className="w-5 h-5 accent-[#6B3E26] rounded cursor-pointer"
                />
              </div>

              {depositFormData.requiresDeposit && (
                <div className="space-y-3 p-4 bg-[#FAF5ED] dark:bg-[#2B1F14] border border-[#E5D7C5] dark:border-[#4A3220] rounded-2xl">
                  <div>
                    <label className="block text-[#2B1D15] dark:text-[#FAF7F2] font-semibold mb-1">
                      Modelo de Cobrança do Sinal *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setDepositFormData({ ...depositFormData, depositType: 'FIXED' })
                        }
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          depositFormData.depositType === 'FIXED'
                            ? 'bg-[#6B3E26] text-white border-[#6B3E26]'
                            : 'bg-white dark:bg-[#251C16] text-[#796758] dark:text-[#CDB196] border-[#E2D9CC] dark:border-[#382A21]'
                        }`}
                      >
                        Valor Fixo em Reais (R$)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDepositFormData({ ...depositFormData, depositType: 'PERCENTAGE' })
                        }
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          depositFormData.depositType === 'PERCENTAGE'
                            ? 'bg-[#6B3E26] text-white border-[#6B3E26]'
                            : 'bg-white dark:bg-[#251C16] text-[#796758] dark:text-[#CDB196] border-[#E2D9CC] dark:border-[#382A21]'
                        }`}
                      >
                        Porcentagem do Serviço (%)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#2B1D15] dark:text-[#FAF7F2] font-semibold mb-1">
                      {depositFormData.depositType === 'FIXED'
                        ? 'Valor do Sinal (R$) *'
                        : 'Porcentagem do Sinal (%) *'}
                    </label>
                    <input
                      type="number"
                      step={depositFormData.depositType === 'FIXED' ? '0.01' : '1'}
                      min={0.1}
                      max={depositFormData.depositType === 'PERCENTAGE' ? 100 : 10000}
                      required
                      value={depositFormData.depositValue}
                      onChange={(e) =>
                        setDepositFormData({
                          ...depositFormData,
                          depositValue: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 bg-white dark:bg-[#1F1712] border border-[#D0C3B2] dark:border-[#4A392D] text-[#2B1D15] dark:text-[#FAF7F2] rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#6B3E26]"
                    />
                    <p className="text-[10px] text-[#796758] dark:text-[#CDB196] mt-1">
                      {depositFormData.depositType === 'FIXED'
                        ? 'Exemplo: Se o serviço for R$ 80 e o sinal R$ 20, o cliente paga R$ 20 no ato do agendamento.'
                        : 'Exemplo: 50% significa que o cliente pagará metade do serviço para reservar o horário.'}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EFE9DF] dark:border-[#382A21]">
                <button
                  type="button"
                  onClick={() => setDepositModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-[#796758] dark:text-[#CDB196] hover:bg-[#FAF8F5] dark:hover:bg-[#1E1713] font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingDeposit}
                  className="px-5 py-2 rounded-xl bg-[#6B3E26] hover:bg-[#54311E] text-white font-bold flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {savingDeposit ? <Loader2 size={14} className="animate-spin" /> : null}
                  <span>Salvar Regras de Sinal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NOVO PROFISSIONAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#251C16] border border-[#E2D9CC] dark:border-[#382A21] rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE9DF] dark:border-[#382A21] mb-4">
              <h3 className="font-bold text-[#2B1D15] dark:text-[#FAF7F2] text-base">Novo Profissional</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-[#9C8B7D] hover:text-[#2B1D15] dark:hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#2B1D15] dark:text-[#FAF7F2] font-semibold mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Barbeiro"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]/g, '-');
                    setFormData({ ...formData, name, slug });
                  }}
                  className="w-full px-3 py-2 bg-[#FAF8F5] dark:bg-[#1E1713] border border-[#D0C3B2] dark:border-[#4A392D] text-[#2B1D15] dark:text-[#FAF7F2] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#6B3E26]"
                />
              </div>

              <div>
                <label className="block text-[#2B1D15] dark:text-[#FAF7F2] font-semibold mb-1">
                  Slug (Identificador do Link) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="carlos-barbeiro"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF8F5] dark:bg-[#1E1713] border border-[#D0C3B2] dark:border-[#4A392D] text-[#2B1D15] dark:text-[#FAF7F2] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#6B3E26]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#2B1D15] dark:text-[#FAF7F2] font-semibold mb-1">
                    WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="11999990000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF8F5] dark:bg-[#1E1713] border border-[#D0C3B2] dark:border-[#4A392D] text-[#2B1D15] dark:text-[#FAF7F2] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#6B3E26]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[#2B1D15] dark:text-[#FAF7F2] font-semibold">E-mail</label>
                    <span className="text-[10px] text-[#9C8B7D] dark:text-[#796758] font-normal">Opcional</span>
                  </div>
                  <input
                    type="email"
                    placeholder="carlos@empresa.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF8F5] dark:bg-[#1E1713] border border-[#D0C3B2] dark:border-[#4A392D] text-[#2B1D15] dark:text-[#FAF7F2] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#6B3E26]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#2B1D15] dark:text-[#FAF7F2] font-semibold mb-1">
                  Biografia / Apresentação (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Especialidades e experiência do profissional..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF8F5] dark:bg-[#1E1713] border border-[#D0C3B2] dark:border-[#4A392D] text-[#2B1D15] dark:text-[#FAF7F2] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#6B3E26]"
                />
              </div>

              {/* Foto de Perfil (Avatar) */}
              <div>
                <label className="block text-[#2B1D15] dark:text-[#FAF7F2] font-semibold mb-1">
                  Foto de Perfil (Avatar)
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <label className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-[#FAF5ED] hover:bg-[#F5EFE6] dark:bg-[#2B1F14] text-[#6B3E26] dark:text-[#E2CEBC] border border-[#E2D9CC] dark:border-[#382A21] rounded-xl font-bold cursor-pointer transition-colors text-xs shadow-xs">
                    <Upload size={14} />
                    <span>Anexar Foto do Arquivo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormData({ ...formData, avatarUrl: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
                <input
                  type="url"
                  placeholder="Ou cole a URL da foto (https://...)"
                  value={formData.avatarUrl.startsWith('data:') ? '' : formData.avatarUrl}
                  onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF8F5] dark:bg-[#1E1713] border border-[#D0C3B2] dark:border-[#4A392D] text-[#2B1D15] dark:text-[#FAF7F2] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#6B3E26]"
                />
                {formData.avatarUrl && (
                  <div className="mt-2 flex items-center gap-2.5 p-2 bg-[#FAF5ED] dark:bg-[#1E1713] border border-[#E2D9CC] dark:border-[#382A21] rounded-xl">
                    <img
                      src={formData.avatarUrl}
                      alt="Preview Avatar"
                      className="w-10 h-10 object-cover rounded-xl border border-[#E2D9CC] dark:border-[#382A21]"
                      onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                    />
                    <span className="text-[11px] text-[#796758] dark:text-[#CDB196]">
                      Prévia da foto carregada
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EFE9DF] dark:border-[#382A21]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-[#796758] dark:text-[#CDB196] hover:bg-[#FAF8F5] dark:hover:bg-[#1E1713] font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#6B3E26] hover:bg-[#54311E] text-white font-bold flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  <span>Salvar Profissional</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Caixa Personalizada para Exclusão de Profissional */}
      <DeleteConfirmationModal
        isOpen={!!professionalToDelete}
        onClose={() => setProfessionalToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir Profissional"
        description="Tem certeza que deseja excluir este profissional da sua equipe? Se houver agendamentos associados a ele, o cadastro será inativado para preservar o histórico financeiro."
        itemName={professionalToDelete ? `${professionalToDelete.name} (${professionalToDelete.phone})` : undefined}
        loading={deleting}
        confirmButtonText="Sim, Excluir Profissional"
      />
    </div>
  );
};
