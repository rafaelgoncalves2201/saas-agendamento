import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import {
  Settings,
  Save,
  Loader2,
  CheckCircle2,
  Palette,
  Image,
  DollarSign,
  AlertCircle,
  Eye,
  MapPin,
  Sparkles,
  Upload,
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

const COLOR_PRESETS = [
  { name: 'Índigo Moderno', hex: '#4F46E5', desc: 'Clássico & Tecnológico' },
  { name: 'Rosa Glamour', hex: '#EC4899', desc: 'Beleza, Lash & Nails' },
  { name: 'Verde Esmeralda', hex: '#059669', desc: 'Spa, Saúde & Bem-Estar' },
  { name: 'Dourado Elegance', hex: '#D97706', desc: 'Premium & Barbearia Retrô' },
  { name: 'Dark Slate', hex: '#0F172A', desc: 'Barbearia Black & Urbano' },
  { name: 'Roxo Creative', hex: '#8B5CF6', desc: 'Tatuagem & Studio Moderno' },
  { name: 'Rose Carmim', hex: '#E11D48', desc: 'Estética & Maquiagem' },
  { name: 'Azul Real', hex: '#2563EB', desc: 'Clínica & Massoterapia' },
];

const COVER_PRESETS = [
  {
    name: 'Salão de Beleza',
    url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Barbearia Clássica',
    url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Spa & Estética',
    url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Esmalteria & Nails',
    url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1200&q=80',
  },
];

export const CompanySettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    document: '',
    logoUrl: '',
    coverUrl: '',
    primaryColor: '#4F46E5',
    bio: '',
    instagram: '',
    address: '',
    requiresDeposit: false,
    depositValue: 'R$ 20,00',
    pixKeyType: 'CHAVE_ALEATORIA',
    pixKey: '',
    pixRecipientName: '',
    depositInstructions: 'Envie o comprovante do sinal pelo WhatsApp para confirmar seu horário.',
    welcomeMessage: 'Agende seu horário com nossos profissionais com facilidade e rapidez!',
    cancellationPolicyHours: 2,
    minBookingNoticeMinutes: 60,
  });

  const showNotification = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  useEffect(() => {
    api.get('/companies/my-company')
      .then((res) => {
        const c = res.data;
        const settings = c.settings || {};
        setFormData({
          name: c.name || '',
          phone: c.phone || '',
          email: c.email || '',
          document: c.document || '',
          logoUrl: c.logoUrl || '',
          coverUrl: c.coverUrl || '',
          primaryColor: settings.primaryColor || '#4F46E5',
          bio: settings.bio || '',
          instagram: settings.instagram || '',
          address: settings.address || '',
          requiresDeposit: Boolean(settings.requiresDeposit),
          depositValue: settings.depositValue || 'R$ 20,00',
          pixKeyType: settings.pixKeyType || 'CHAVE_ALEATORIA',
          pixKey: settings.pixKey || '',
          pixRecipientName: settings.pixRecipientName || c.name || '',
          depositInstructions:
            settings.depositInstructions ||
            'Envie o comprovante do sinal pelo WhatsApp para confirmar seu horário.',
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

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
          bio: formData.bio,
          instagram: formData.instagram,
          address: formData.address,
          requiresDeposit: formData.requiresDeposit,
          depositValue: formData.depositValue,
          pixKeyType: formData.pixKeyType,
          pixKey: formData.pixKey,
          pixRecipientName: formData.pixRecipientName,
          depositInstructions: formData.depositInstructions,
          welcomeMessage: formData.welcomeMessage,
          cancellationPolicyHours: Number(formData.cancellationPolicyHours),
          minBookingNoticeMinutes: Number(formData.minBookingNoticeMinutes),
          timezone: 'America/Sao_Paulo',
        },
      });
      showNotification('success', 'Configurações e personalização salvas com sucesso!');
    } catch (err: any) {
      showNotification(
        'error',
        err.response?.data?.message || 'Erro ao salvar alterações no servidor.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Personalização & Configurações</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Configure as cores da sua marca, fotos, regras de sinal via Pix e políticas de atendimento.
          </p>
        </div>
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
        <form onSubmit={handleSave} className="space-y-6 text-xs">
          {/* SEÇÃO 1: IDENTIDADE VISUAL & CORES */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-xs"
                style={{ backgroundColor: formData.primaryColor }}
              >
                <Palette size={16} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Identidade Visual & Cores da Página</h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  A cor e banner escolhidos serão exibidos na sua página pública de agendamento.
                </p>
              </div>
            </div>

            {/* Seletor de Cores */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-2">
                Cor Principal da Marca (Tema do Estabelecimento)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
                {COLOR_PRESETS.map((p) => {
                  const isSelected = formData.primaryColor.toLowerCase() === p.hex.toLowerCase();
                  return (
                    <button
                      type="button"
                      key={p.hex}
                      onClick={() => setFormData({ ...formData, primaryColor: p.hex })}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50'
                      }`}
                    >
                      <span
                        className="w-5 h-5 rounded-full shrink-0 shadow-xs border border-white dark:border-slate-700"
                        style={{ backgroundColor: p.hex }}
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-[11px] text-slate-800 dark:text-slate-200 truncate">{p.name}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{p.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Cor Personalizada (Color Picker + Hex) */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                  title="Escolha uma cor livremente"
                />
                <div className="flex-1">
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Cor Personalizada (Hex):</span>
                  <input
                    type="text"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="ml-2 px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs font-mono w-28 uppercase focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    placeholder="#4F46E5"
                  />
                </div>
                <div
                  className="px-3 py-1 rounded-lg text-[11px] font-bold text-white shadow-xs"
                  style={{ backgroundColor: formData.primaryColor }}
                >
                  Exemplo de Botão
                </div>
              </div>
            </div>

            {/* Imagem de Capa (Cover) e Logo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Logo da Empresa
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <label className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl font-bold cursor-pointer transition-colors text-xs shadow-xs">
                    <Upload size={14} />
                    <span>Anexar Logo do Arquivo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormData({ ...formData, logoUrl: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
                <input
                  type="url"
                  placeholder="Ou cole a URL da logo (https://...)"
                  value={formData.logoUrl.startsWith('data:') ? '' : formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                {formData.logoUrl && (
                  <div className="mt-2 flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 rounded-xl">
                    <img
                      src={formData.logoUrl}
                      alt="Preview Logo"
                      className="w-10 h-10 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                      onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                    />
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Prévia da Logo carregada</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Foto de Capa (Banner)
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <label className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl font-bold cursor-pointer transition-colors text-xs shadow-xs">
                    <Upload size={14} />
                    <span>Anexar Capa do Arquivo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormData({ ...formData, coverUrl: reader.result as string });
                          };
                          reader.readAsDataURL(file);
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
                {/* Sugestões Rápidas de Banner */}
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 self-center">Sugestões:</span>
                  {COVER_PRESETS.map((preset) => (
                    <button
                      type="button"
                      key={preset.name}
                      onClick={() => setFormData({ ...formData, coverUrl: preset.url })}
                      className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Prévia da Capa */}
            {formData.coverUrl && (
              <div className="relative h-28 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner">
                <img
                  src={formData.coverUrl}
                  alt="Banner Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
                  <span className="text-white text-[11px] font-semibold flex items-center gap-1.5">
                    <Eye size={13} /> Prévia da Capa no Agendamento Público
                  </span>
                </div>
              </div>
            )}

            {/* Informações Complementares Públicas (Bio, Instagram, Endereço) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="sm:col-span-1">
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 flex items-center gap-1">
                  <InstagramIcon size={13} className="text-pink-600" />
                  Instagram do Negócio
                </label>
                <input
                  type="text"
                  placeholder="@seunegocio"
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 flex items-center gap-1">
                  <MapPin size={13} className="text-red-500" />
                  Endereço Completo
                </label>
                <input
                  type="text"
                  placeholder="Av. Paulista, 1000 - Sala 42, Centro"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Bio / Slogan do Estabelecimento
                </label>
                <input
                  type="text"
                  placeholder="Ex: Especialistas em cortes modernos, mechas e cuidados capilares premium."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: SINAL DE AGENDAMENTO (PIX) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                  <DollarSign size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">Cobrança de Sinal (Pix)</h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Exija o pagamento de um sinal antecipado para garantir o comparecimento e evitar furos na agenda.
                  </p>
                </div>
              </div>

              {/* Switch Toggle */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requiresDeposit}
                  onChange={(e) => setFormData({ ...formData, requiresDeposit: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {formData.requiresDeposit ? (
              <div className="space-y-4 p-4 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl">
                <div className="flex items-start gap-2 text-emerald-800 dark:text-emerald-300 text-xs">
                  <Sparkles size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <p>
                    <strong>Como funciona:</strong> Ao agendar no link público, o cliente receberá a chave Pix e um botão direto para enviar o comprovante no seu WhatsApp. O agendamento ficará com status <strong>"Aguardando Sinal"</strong> na sua tela de agendamentos até que você confira o Pix e clique em "Aprovar".
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Valor do Sinal Exigido *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: R$ 20,00 ou 50%"
                      value={formData.depositValue}
                      onChange={(e) => setFormData({ ...formData, depositValue: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">Valor fixo ou percentual</span>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Tipo de Chave Pix *
                    </label>
                    <select
                      value={formData.pixKeyType}
                      onChange={(e) => setFormData({ ...formData, pixKeyType: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="CELULAR">Celular / WhatsApp</option>
                      <option value="CPF">CPF</option>
                      <option value="CNPJ">CNPJ</option>
                      <option value="EMAIL">E-mail</option>
                      <option value="CHAVE_ALEATORIA">Chave Aleatória (EVP)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Chave Pix *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="11999998888 ou chave aleatória"
                      value={formData.pixKey}
                      onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Nome do Titular / Favorecido da Conta Pix
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Hayane Silva ou Studio Hayane ME"
                      value={formData.pixRecipientName}
                      onChange={(e) => setFormData({ ...formData, pixRecipientName: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">Ajuda o cliente a conferir o nome correto antes de transferir</span>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Instruções do Sinal para o Cliente
                    </label>
                    <textarea
                      rows={2}
                      value={formData.depositInstructions}
                      onChange={(e) => setFormData({ ...formData, depositInstructions: e.target.value })}
                      placeholder="Ex: Para garantir sua vaga, envie o comprovante do sinal via Pix em até 30 minutos."
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <AlertCircle size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
                <span>
                  Sinal desativado. Os clientes podem agendar livremente e a confirmação é imediata.
                </span>
              </div>
            )}
          </div>

          {/* SEÇÃO 3: DADOS CADASTRAIS DO ESTABELECIMENTO */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
              Dados do Estabelecimento
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
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">E-mail de Notificações *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">CNPJ ou CPF</label>
                <input
                  type="text"
                  value={formData.document}
                  onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 4: POLÍTICAS & ANTECEDÊNCIA */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
              Regras e Políticas de Agendamento
            </h3>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Mensagem Inicial de Boas-Vindas
              </label>
              <textarea
                rows={2}
                value={formData.welcomeMessage}
                onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Antecedência Mínima para Agendar (minutos)
                </label>
                <input
                  type="number"
                  min="0"
                  step="15"
                  value={formData.minBookingNoticeMinutes}
                  onChange={(e) =>
                    setFormData({ ...formData, minBookingNoticeMinutes: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  Ex: 60 = cliente só pode agendar para daqui a 1 hora
                </span>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Prazo Limite para Cancelamento (horas)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.cancellationPolicyHours}
                  onChange={(e) =>
                    setFormData({ ...formData, cancellationPolicyHours: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  Ex: 2 = cliente só pode cancelar com 2h de antecedência
                </span>
              </div>
            </div>
          </div>

          {/* Botão de Salvar Flutuante / Fixo */}
          <div className="pt-2 flex items-center justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-200 dark:shadow-none transition-all text-xs"
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              <span>Salvar Todas as Configurações</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
