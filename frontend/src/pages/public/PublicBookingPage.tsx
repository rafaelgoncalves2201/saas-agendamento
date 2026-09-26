import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Scissors,
  CheckCircle2,
  ChevronLeft,
  Phone,
  ArrowRight,
  Loader2,
  Sparkles,
  MapPin,
  Copy,
  Check,
  AlertCircle,
  Tag,
  X,
  Star,
  CreditCard,
  ExternalLink,
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

export const PublicBookingPage: React.FC = () => {
  const { companySlug, professionalSlug } = useParams<{
    companySlug: string;
    professionalSlug?: string;
  }>();

  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stepper
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Selections
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<any | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);

  // Client info
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [notes, setNotes] = useState('');

  // Cupom de Desconto
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Booking Result & Pix Copy feedback
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);
  const [bookingPaymentMethod, setBookingPaymentMethod] = useState<'pix' | 'card'>('pix');

  // Avaliações Públicas
  const [publicReviews, setPublicReviews] = useState<{
    averageRating: number;
    totalCount: number;
    reviews: any[];
  } | null>(null);

  // Lista de Espera Modal & Formulário
  const [waitlistModalOpen, setWaitlistModalOpen] = useState(false);
  const [waitlistName, setWaitlistName] = useState('');
  const [waitlistPhone, setWaitlistPhone] = useState('');
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistServiceId, setWaitlistServiceId] = useState('');
  const [waitlistProfessionalId, setWaitlistProfessionalId] = useState('');
  const [waitlistPreferredDate, setWaitlistPreferredDate] = useState('');
  const [waitlistPreferredPeriod, setWaitlistPreferredPeriod] = useState<
    'QUALQUER' | 'MANHA' | 'TARDE' | 'NOITE'
  >('QUALQUER');
  const [waitlistNotes, setWaitlistNotes] = useState('');
  const [submittingWaitlist, setSubmittingWaitlist] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [waitlistError, setWaitlistError] = useState<string | null>(null);

  // 1. Carregar dados públicos da empresa e avaliações
  useEffect(() => {
    if (!companySlug) return;
    setLoading(true);

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    axios
      .get(`${apiUrl}/public/companies/${companySlug}`)
      .then((res) => {
        setCompany(res.data);

        // Se veio por link de profissional específico
        if (professionalSlug && res.data.professionals) {
          const prof = res.data.professionals.find((p: any) => p.slug === professionalSlug);
          if (prof) {
            setSelectedProfessional(prof);
          }
        }
      })
      .catch(() => setError('Estabelecimento não encontrado ou temporariamente inativo.'))
      .finally(() => setLoading(false));

    // Carregar avaliações aprovadas
    axios
      .get(`${apiUrl}/public/companies/${companySlug}/reviews`)
      .then((res) => setPublicReviews(res.data))
      .catch((err) => console.error('Erro ao buscar avaliações:', err));
  }, [companySlug, professionalSlug]);

  const handleJoinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !waitlistName.trim() || !waitlistPhone.trim()) return;
    setSubmittingWaitlist(true);
    setWaitlistError(null);

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    try {
      await axios.post(`${apiUrl}/public/companies/${company.slug}/waitlist`, {
        clientName: waitlistName.trim(),
        clientPhone: waitlistPhone.trim(),
        clientEmail: waitlistEmail.trim() || undefined,
        serviceId: waitlistServiceId || undefined,
        professionalId: waitlistProfessionalId || undefined,
        preferredDate: waitlistPreferredDate || undefined,
        preferredPeriod: waitlistPreferredPeriod,
        notes: waitlistNotes.trim() || undefined,
      });
      setWaitlistSuccess(true);
    } catch (err: any) {
      setWaitlistError(err.response?.data?.message || 'Erro ao registrar na lista de espera.');
    } finally {
      setSubmittingWaitlist(false);
    }
  };

  // 2. Carregar horários disponíveis sempre que data/serviço/profissional mudar
  useEffect(() => {
    if (!company || !selectedService || !selectedProfessional || !selectedDate) return;

    setLoadingSlots(true);
    setSelectedSlot(null);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    axios
      .get(`${apiUrl}/public/companies/${company.slug}/availability`, {
        params: {
          professionalId: selectedProfessional.id,
          serviceId: selectedService.id,
          date: selectedDate,
        },
      })
      .then((res) => {
        setAvailableSlots(res.data.availableSlots || []);
      })
      .catch((err) => {
        console.error(err);
        setAvailableSlots([]);
      })
      .finally(() => setLoadingSlots(false));
  }, [company, selectedService, selectedProfessional, selectedDate]);

  // Resetar cupom se mudar serviço ou profissional
  useEffect(() => {
    setAppliedCoupon(null);
    setCouponError(null);
  }, [selectedService, selectedProfessional]);

  const handleApplyCoupon = async () => {
    if (!couponCodeInput.trim() || !company || !selectedService || !selectedProfessional) return;
    setValidatingCoupon(true);
    setCouponError(null);

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    try {
      const res = await axios.post(`${apiUrl}/public/companies/${company.slug}/validate-coupon`, {
        code: couponCodeInput.trim(),
        serviceId: selectedService.id,
        professionalId: selectedProfessional.id,
      });
      setAppliedCoupon(res.data);
    } catch (err: any) {
      setAppliedCoupon(null);
      setCouponError(err.response?.data?.message || 'Cupom inválido ou expirado.');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput('');
    setCouponError(null);
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    try {
      const res = await axios.post(`${apiUrl}/public/companies/${company.slug}/appointments`, {
        professionalId: selectedProfessional.id,
        serviceId: selectedService.id,
        startDateTime: selectedSlot.start,
        clientName,
        clientPhone,
        clientEmail: clientEmail || undefined,
        notes: notes || undefined,
        couponCode: appliedCoupon?.coupon?.code || undefined,
      });

      setBookingSuccess(res.data);
      setStep(5);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Este horário acabou de ser reservado por outro cliente. Por favor, selecione outro horário.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-polling para confirmação automática do Pix do Mercado Pago em tempo real
  useEffect(() => {
    const mgmtCode = bookingSuccess?.appointment?.clientManagementCode;
    const currentStatus = bookingSuccess?.appointment?.status;

    if (step !== 5 || !mgmtCode || currentStatus === 'CONFIRMED') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const res = await axios.get(`${apiUrl}/public/appointments/${mgmtCode}`);
        if (res.data?.status === 'CONFIRMED') {
          setBookingSuccess((prev: any) => ({
            ...prev,
            requiresDeposit: false,
            appointment: {
              ...(prev?.appointment || {}),
              ...res.data,
              status: 'CONFIRMED',
            },
          }));
        }
      } catch (err) {
        // Silencioso em caso de oscilação momentânea de rede
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [step, bookingSuccess?.appointment?.clientManagementCode, bookingSuccess?.appointment?.status]);

  const handleCopyPixKey = (key: string) => {
    if (!key) return;
    navigator.clipboard.writeText(key);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#6B3E26]" size={36} />
      </div>
    );
  }

  if (error && !company) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#1A120D] flex items-center justify-center p-4 text-center">
        <div className="bg-white dark:bg-[#261E18] p-8 rounded-2xl border border-[#E2D9CC] dark:border-[#3D2C22] max-w-md shadow-sm">
          <h2 className="text-xl font-bold text-[#2B1D15] dark:text-[#F8F5EE] mb-2">Ops!</h2>
          <p className="text-sm text-[#6B3E26] dark:text-[#CDB196]">{error}</p>
        </div>
      </div>
    );
  }

  const primaryColor = company?.settings?.primaryColor || '#6B3E26';
  const companySettings = company?.settings || {};
  const nextDays = Array.from({ length: 7 }).map((_, i) => addDays(new Date(), i + 1));

  // Modelo de pagamento configurado pela empresa
  const activePaymentModel: 'MERCADO_PAGO' | 'DEPOSIT_PIX' | 'NONE' =
    companySettings.paymentModel || (companySettings.requireDeposit ? 'DEPOSIT_PIX' : 'MERCADO_PAGO');

  // Preço do serviço com ou sem cupom
  const currentServicePrice = appliedCoupon ? appliedCoupon.finalPrice : Number(selectedService?.price || 0);

  // Cálculo prévio do sinal para o Passo 4 (Resumo)
  let step4DepositVal = currentServicePrice;
  const hasProfCustomDeposit = Boolean(
    selectedProfessional?.requiresDeposit &&
    selectedProfessional?.depositValue !== null &&
    selectedProfessional?.depositValue !== undefined
  );
  const rawDepositConfig = (
    hasProfCustomDeposit
      ? String(selectedProfessional.depositValue)
      : (companySettings.depositValue || '')
  ).toString().trim();
  const isPercentage = hasProfCustomDeposit
    ? (selectedProfessional?.depositType === 'PERCENTAGE' || rawDepositConfig.includes('%'))
    : rawDepositConfig.includes('%');

  if (isPercentage) {
    const pct = parseFloat(rawDepositConfig.replace('%', '').replace(',', '.'));
    if (!isNaN(pct) && pct > 0) {
      step4DepositVal = Math.round(((currentServicePrice * pct) / 100) * 100) / 100;
    }
  } else if (rawDepositConfig) {
    const fixed = parseFloat(rawDepositConfig.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (!isNaN(fixed) && fixed > 0) {
      step4DepositVal = Math.min(fixed, currentServicePrice);
    }
  }
  const step4RemainingVal = Math.max(0, currentServicePrice - step4DepositVal);

  // WhatsApp link preparation for Step 5
  const companyPhoneRaw = (bookingSuccess?.depositInfo?.companyPhone || company?.phone || '').replace(/\D/g, '');
  const cleanPhone = companyPhoneRaw.startsWith('55') ? companyPhoneRaw : `55${companyPhoneRaw}`;
  const totalValFormatted = bookingSuccess?.depositInfo?.depositValue || (`R$ ${currentServicePrice.toFixed(2)}`);
  const dateFormatted = format(new Date(selectedDate + 'T12:00:00'), 'dd/MM/yyyy');
  const timeLabel = selectedSlot?.endTime
    ? `${selectedSlot.time} até ${selectedSlot.endTime}`
    : selectedSlot?.time;

  const isDepositPixSuccess = bookingSuccess?.depositInfo?.paymentModel === 'DEPOSIT_PIX';
  const whatsappMessage = encodeURIComponent(
    `Olá! Realizei o agendamento no *${company?.name}*:\n\n` +
      `*Serviço:* ${selectedService?.name}\n` +
      `*Profissional:* ${selectedProfessional?.name}\n` +
      `*Horário:* ${timeLabel} de ${dateFormatted}\n` +
      `*Cliente:* ${clientName}\n` +
      (bookingSuccess?.requiresDeposit
        ? (isDepositPixSuccess
            ? `*Valor do Sinal via Pix:* ${bookingSuccess?.depositInfo?.depositValue}\n*Restante no Atendimento:* ${bookingSuccess?.depositInfo?.remainingValue}\n*Total:* R$ ${Number(bookingSuccess?.appointment?.priceAtBooking || currentServicePrice).toFixed(2)}\n\nEstou enviando o comprovante do sinal via Pix para confirmar minha reserva!`
            : `*Valor Total via Pix:* ${totalValFormatted}\n\nEstou enviando o comprovante do pagamento via Pix para confirmação da minha vaga!`)
        : `\nGostaria de confirmar que meu agendamento foi realizado com sucesso!`),
  );

  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${whatsappMessage}`;
  const whatsappButtonLabel = companySettings.whatsappButtonText || 'Enviar Comprovante pelo WhatsApp';

  return (
    <div className="min-h-screen bg-[#F8F5EE] dark:bg-[#120D0A] text-[#2B1D15] dark:text-[#FAF7F2] flex flex-col items-center justify-start p-3 sm:p-6 lg:p-8 transition-colors">
      <div className="w-full max-w-6xl bg-white dark:bg-[#1C1510] border border-[#E2D9CC] dark:border-[#382A21] rounded-3xl shadow-xl overflow-hidden flex flex-col">
        {/* Banner de Capa + Header da Empresa */}
        <div
          className="relative text-white p-6 sm:p-10 bg-cover bg-center overflow-hidden"
          style={{
            backgroundColor: primaryColor,
            backgroundImage: company?.coverUrl
              ? `linear-gradient(to bottom, rgba(20, 15, 10, 0.45), rgba(20, 15, 10, 0.85)), url(${company.coverUrl})`
              : undefined,
          }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 relative z-10">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-bold text-3xl shadow-xl shrink-0 overflow-hidden">
              {company?.logoUrl ? (
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  className="w-full h-full object-cover"
                  onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                />
              ) : (
                company?.name?.charAt(0) || 'A'
              )}
            </div>

            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white inline-block mb-1.5">
                Agendamento Online
              </span>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
                {company?.name}
              </h1>
              {companySettings.bio && (
                <p className="text-xs sm:text-sm text-white/85 mt-1.5 max-w-2xl leading-relaxed">{companySettings.bio}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-3 text-xs text-white/90">
                {company?.phone && (
                  <span className="flex items-center gap-1.5 bg-black/20 backdrop-blur-xs px-2.5 py-1 rounded-lg">
                    <Phone size={13} /> {company?.phone}
                  </span>
                )}
                {companySettings.instagram && (
                  <span className="flex items-center gap-1.5 bg-black/20 backdrop-blur-xs px-2.5 py-1 rounded-lg">
                    <InstagramIcon size={13} /> {companySettings.instagram}
                  </span>
                )}
                {companySettings.address && (
                  <span className="flex items-center gap-1.5 bg-black/20 backdrop-blur-xs px-2.5 py-1 rounded-lg">
                    <MapPin size={13} /> {companySettings.address}
                  </span>
                )}
                {/* Avaliações Públicas */}
                <span className="flex items-center gap-1.5 bg-black/25 backdrop-blur-xs px-2.5 py-1 rounded-lg text-amber-300 font-bold">
                  <Star size={13} className="fill-amber-300" />
                  <span>{publicReviews?.averageRating ? publicReviews.averageRating.toFixed(1) : '5.0'}</span>
                  <span className="text-white/80 font-normal">
                    ({publicReviews?.totalCount || 0} {publicReviews?.totalCount === 1 ? 'avaliação' : 'avaliações'})
                  </span>
                </span>
                {/* Botão Entrar na Lista de Espera */}
                <button
                  type="button"
                  onClick={() => {
                    setWaitlistServiceId(selectedService?.id || '');
                    setWaitlistProfessionalId(selectedProfessional?.id || '');
                    setWaitlistPreferredDate(selectedDate || '');
                    setWaitlistSuccess(false);
                    setWaitlistModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-xs px-3 py-1 rounded-lg text-white font-bold transition-all cursor-pointer shadow-xs"
                >
                  <Clock size={13} />
                  <span>Lista de Espera</span>
                </button>
              </div>
            </div>
          </div>

          {selectedProfessional && (
            <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-white relative z-10 shadow-xs">
              <User size={14} />
              <span>Profissional selecionado: <strong>{selectedProfessional.name}</strong></span>
            </div>
          )}
        </div>

        {/* Mensagem de Boas-Vindas */}
        {step === 1 && companySettings.welcomeMessage && (
          <div className="px-6 sm:px-10 py-3.5 text-xs sm:text-sm text-[#796758] dark:text-[#CDB196] italic bg-[#FAF8F5] dark:bg-[#261E18] border-b border-[#E2D9CC] dark:border-[#382A21]">
            "{companySettings.welcomeMessage}"
          </div>
        )}

        {/* Barra de Progresso do Agendamento (Stepper Responsivo) */}
        {step < 5 && (
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-6 px-4 sm:px-10 py-3 bg-[#FAF8F5] dark:bg-[#261E18]/80 border-b border-[#E2D9CC] dark:border-[#382A21] text-xs font-bold overflow-x-auto scrollbar-none">
            <button
              onClick={() => setStep(1)}
              className={`flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 font-medium ${
                step === 1 ? 'text-[#6B3E26] dark:text-[#E2CEBC] font-bold' : 'text-[#796758] dark:text-[#CDB196] hover:text-[#2B1D15] dark:hover:text-white'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 1 ? 'bg-[#6B3E26] text-white' : 'bg-[#EFE9DF] dark:bg-[#34241B] text-[#796758] dark:text-[#CDB196]'}`}>1</span>
              <span>Serviço</span>
            </button>
            <span className="text-[#D0C3B2] dark:text-[#523A2C]">&rarr;</span>

            <button
              onClick={() => selectedService && setStep(2)}
              disabled={!selectedService}
              className={`flex items-center gap-1.5 transition-colors shrink-0 font-medium ${
                step === 2
                  ? 'text-[#6B3E26] dark:text-[#E2CEBC] font-bold'
                  : selectedService
                  ? 'text-[#796758] dark:text-[#CDB196] hover:text-[#2B1D15] dark:hover:text-white cursor-pointer'
                  : 'text-[#CDB196]/60 dark:text-[#523A2C] cursor-not-allowed'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 2 ? 'bg-[#6B3E26] text-white' : 'bg-[#EFE9DF] dark:bg-[#34241B] text-[#796758] dark:text-[#CDB196]'}`}>2</span>
              <span>Profissional</span>
            </button>
            <span className="text-[#D0C3B2] dark:text-[#523A2C]">&rarr;</span>

            <button
              onClick={() => selectedService && selectedProfessional && setStep(3)}
              disabled={!selectedService || !selectedProfessional}
              className={`flex items-center gap-1.5 transition-colors shrink-0 font-medium ${
                step === 3
                  ? 'text-[#6B3E26] dark:text-[#E2CEBC] font-bold'
                  : selectedService && selectedProfessional
                  ? 'text-[#796758] dark:text-[#CDB196] hover:text-[#2B1D15] dark:hover:text-white cursor-pointer'
                  : 'text-[#CDB196]/60 dark:text-[#523A2C] cursor-not-allowed'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 3 ? 'bg-[#6B3E26] text-white' : 'bg-[#EFE9DF] dark:bg-[#34241B] text-[#796758] dark:text-[#CDB196]'}`}>3</span>
              <span>Horário</span>
            </button>
            <span className="text-[#D0C3B2] dark:text-[#523A2C]">&rarr;</span>

            <button
              onClick={() => selectedSlot && setStep(4)}
              disabled={!selectedSlot}
              className={`flex items-center gap-1.5 transition-colors shrink-0 font-medium ${
                step === 4
                  ? 'text-[#6B3E26] dark:text-[#E2CEBC] font-bold'
                  : selectedSlot
                  ? 'text-[#796758] dark:text-[#CDB196] hover:text-[#2B1D15] dark:hover:text-white cursor-pointer'
                  : 'text-[#CDB196]/60 dark:text-[#523A2C] cursor-not-allowed'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 4 ? 'bg-[#6B3E26] text-white' : 'bg-[#EFE9DF] dark:bg-[#34241B] text-[#796758] dark:text-[#CDB196]'}`}>4</span>
              <span>Dados</span>
            </button>
          </div>
        )}

        {error && (
          <div className="mx-6 sm:mx-10 mt-6 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs sm:text-sm rounded-2xl flex items-center gap-2.5">
            <AlertCircle size={18} className="shrink-0 text-red-600 dark:text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-6 sm:p-10 flex-1">
          {/* PASSO 1: SELECIONAR SERVIÇO COM FOTOS (TELA TODA NO COMPUTADOR) */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EFE9DF] dark:border-[#382A21] pb-4">
                <div>
                  <h2 className="font-extrabold text-[#2B1D15] dark:text-[#FAF7F2] text-xl sm:text-2xl">
                    Escolha o Serviço
                  </h2>
                  <p className="text-xs sm:text-sm text-[#796758] dark:text-[#CDB196] mt-0.5">
                    Selecione o procedimento que deseja agendar com nossos especialistas.
                  </p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 bg-[#FAF8F5] dark:bg-[#251C16] text-[#6B3E26] dark:text-[#E2CEBC] border border-[#E2D9CC] dark:border-[#382A21] rounded-full w-fit">
                  {company?.services?.length || 0} serviço(s) disponível(is)
                </span>
              </div>

              {/* Grid Responsivo Compacto: 1 no mobile, 2 no tablet, 3-4 no computador */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {company?.services?.map((srv: any) => {
                  const isSelected = selectedService?.id === srv.id;
                  return (
                    <div
                      key={srv.id}
                      onClick={() => {
                        setSelectedService(srv);
                        setStep(selectedProfessional ? 3 : 2);
                      }}
                      className={`group rounded-2xl border transition-all flex flex-col justify-between cursor-pointer overflow-hidden p-4 w-full max-w-[280px] mx-auto sm:mx-0 ${
                        isSelected
                          ? 'border-[#6B3E26] ring-2 ring-[#6B3E26]/20 bg-[#FAF8F5] dark:bg-[#251C16] shadow-md'
                          : 'border-[#E2D9CC] dark:border-[#382A21] bg-white dark:bg-[#1F1712] hover:border-[#6B3E26] hover:shadow-lg hover:-translate-y-0.5'
                      }`}
                    >
                      <div>
                        {/* Imagem Quadrada do Serviço */}
                        {srv.imageUrl ? (
                          <div className="w-full aspect-square rounded-2xl overflow-hidden mb-4 border border-[#E2D9CC] dark:border-[#382A21] bg-[#FAF8F5] dark:bg-[#19120D]">
                            <img
                              src={srv.imageUrl}
                              alt={srv.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                            />
                          </div>
                        ) : (
                          <div
                            className="w-full aspect-square rounded-2xl flex items-center justify-center mb-4 transition-colors"
                            style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                          >
                            <Scissors size={32} />
                          </div>
                        )}

                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-[#2B1D15] dark:text-[#FAF7F2] text-base group-hover:text-[#6B3E26] transition-colors">
                            {srv.name}
                          </h3>
                        </div>

                        {srv.description && (
                          <p className="text-xs text-[#796758] dark:text-[#CDB196] mt-1.5 line-clamp-2 leading-relaxed">
                            {srv.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-4 mt-4 border-t border-[#EFE9DF] dark:border-[#382A21] flex items-center justify-between gap-3">
                        <div>
                          <span className="flex items-center gap-1.5 text-xs text-[#796758] dark:text-[#CDB196] font-medium">
                            <Clock size={13} /> {srv.durationMinutes} minutos
                          </span>
                          <span className="font-black text-lg text-[#2B1D15] dark:text-[#FAF7F2] block mt-0.5">
                            R$ {Number(srv.price).toFixed(2)}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-sm flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <span>Agendar</span>
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Banner de Lista de Espera */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF5ED] dark:bg-[#251C16] border border-[#E2D9CC] dark:border-[#382A21] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#2B1D15] dark:text-[#FAF7F2]">
                    <Clock size={16} className="text-[#6B3E26]" />
                    <span>Não encontrou o horário ideal ou agenda concorrida?</span>
                  </div>
                  <p className="text-xs text-[#796758] dark:text-[#CDB196]">
                    Entre na nossa lista de espera! Caso surja um cancelamento ou novo horário, você será o primeiro a ser chamado.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setWaitlistServiceId(selectedService?.id || '');
                    setWaitlistProfessionalId(selectedProfessional?.id || '');
                    setWaitlistPreferredDate(selectedDate || '');
                    setWaitlistSuccess(false);
                    setWaitlistModalOpen(true);
                  }}
                  className="px-4 py-2.5 bg-[#6B3E26] hover:bg-[#54311E] text-white rounded-xl text-xs font-bold shrink-0 transition-all shadow-xs cursor-pointer"
                >
                  Entrar na Lista de Espera
                </button>
              </div>

              {/* Seção de Avaliações / Depoimentos de Clientes */}
              {publicReviews && publicReviews.reviews.length > 0 && (
                <div className="pt-8 border-t border-[#EFE9DF] dark:border-[#382A21] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black text-[#2B1D15] dark:text-[#FAF7F2] flex items-center gap-2">
                        <Star size={18} className="text-[#6B3E26] fill-[#6B3E26]" />
                        <span>O que nossos clientes dizem</span>
                      </h3>
                      <p className="text-xs text-[#796758] dark:text-[#CDB196] mt-0.5">
                        Média de {publicReviews.averageRating.toFixed(1)} estrelas com base em {publicReviews.totalCount} avaliação(ões)
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {publicReviews.reviews.slice(0, 6).map((rev: any) => (
                      <div
                        key={rev.id}
                        className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#251C16] border border-[#E2D9CC] dark:border-[#382A21] space-y-2.5 flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-[#2B1D15] dark:text-[#FAF7F2]">
                              {rev.clientName}
                            </span>
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  size={12}
                                  className={
                                    s <= rev.rating
                                      ? 'text-amber-500 fill-amber-500'
                                      : 'text-[#D0C3B2]'
                                  }
                                />
                              ))}
                            </div>
                          </div>
                          {rev.comment ? (
                            <p className="text-xs text-[#5A4A3E] dark:text-[#CDB196] italic line-clamp-3">
                              "{rev.comment}"
                            </p>
                          ) : (
                            <p className="text-xs text-[#9C8B7D] italic">
                              Avaliou com {rev.rating} estrelas.
                            </p>
                          )}
                        </div>
                        {rev.service && (
                          <div className="pt-2 border-t border-[#E2D9CC]/60 dark:border-[#382A21] text-[10px] text-[#796758] dark:text-[#CDB196]">
                            Serviço: <strong className="text-[#2B1D15] dark:text-[#FAF7F2]">{rev.service.name}</strong>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PASSO 2: SELECIONAR PROFISSIONAL (TELA TODA NO COMPUTADOR) */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#EFE9DF] dark:border-[#382A21] pb-4">
                <div>
                  <h2 className="font-extrabold text-[#2B1D15] dark:text-[#FAF7F2] text-xl sm:text-2xl">
                    Escolha o Profissional
                  </h2>
                  <p className="text-xs sm:text-sm text-[#796758] dark:text-[#CDB196] mt-0.5">
                    Serviço selecionado: <strong className="text-[#2B1D15] dark:text-[#FAF7F2]">{selectedService?.name}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="text-xs hover:underline flex items-center gap-1 font-semibold px-3 py-1.5 rounded-xl border border-[#E2D9CC] dark:border-[#382A21] text-[#796758] dark:text-[#CDB196] cursor-pointer hover:bg-[#FAF8F5]"
                >
                  <ChevronLeft size={14} /> Trocar Serviço
                </button>
              </div>

              {/* Grid Responsivo de Profissionais */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {company?.professionals?.map((prof: any) => {
                  const isSelected = selectedProfessional?.id === prof.id;
                  return (
                    <div
                      key={prof.id}
                      onClick={() => {
                        setSelectedProfessional(prof);
                        setStep(3);
                      }}
                      className={`group p-5 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'border-[#6B3E26] ring-2 ring-[#6B3E26]/20 bg-[#FAF8F5] dark:bg-[#251C16] shadow-md'
                          : 'border-[#E2D9CC] dark:border-[#382A21] bg-white dark:bg-[#1F1712] hover:border-[#6B3E26] hover:shadow-lg hover:-translate-y-0.5'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {prof.avatarUrl ? (
                          <img
                            src={prof.avatarUrl}
                            alt={prof.name}
                            className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-[#E2D9CC] dark:border-[#382A21] shadow-xs"
                          />
                        ) : (
                          <div
                            className="w-16 h-16 rounded-2xl font-black text-xl flex items-center justify-center shrink-0 shadow-xs"
                            style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                          >
                            {prof.name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="font-bold text-[#2B1D15] dark:text-[#FAF7F2] text-base group-hover:text-[#6B3E26] transition-colors">
                            {prof.name}
                          </h3>
                          <p className="text-xs text-[#796758] dark:text-[#CDB196] mt-1 line-clamp-2">
                            {prof.bio || `Especialista em ${company?.name}`}
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 mt-4 border-t border-[#EFE9DF] dark:border-[#382A21] flex items-center justify-end">
                        <button
                          type="button"
                          className="w-full py-2.5 rounded-xl font-bold text-xs text-white shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <span>Ver Horários Disponíveis</span>
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PASSO 3: SELECIONAR DATA E HORÁRIO (2 COLUNAS NO COMPUTADOR) */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#EFE9DF] dark:border-[#382A21] pb-4">
                <div>
                  <h2 className="font-extrabold text-[#2B1D15] dark:text-[#FAF7F2] text-xl sm:text-2xl">
                    Selecione Data e Horário
                  </h2>
                  <p className="text-xs sm:text-sm text-[#796758] dark:text-[#CDB196] mt-0.5">
                    {selectedService?.name} com {selectedProfessional?.name}
                  </p>
                </div>
                <button
                  onClick={() => setStep(selectedProfessional && !professionalSlug ? 2 : 1)}
                  className="text-xs hover:underline flex items-center gap-1 font-semibold px-3 py-1.5 rounded-xl border border-[#E2D9CC] dark:border-[#382A21] text-[#796758] dark:text-[#CDB196] cursor-pointer hover:bg-[#FAF8F5]"
                >
                  <ChevronLeft size={14} /> Voltar
                </button>
              </div>

              {/* Layout em 2 colunas para Computador / Tablet */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Coluna 1 (Esquerda): Seleção da Data */}
                <div className="lg:col-span-5 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#796758] dark:text-[#CDB196]">
                    1. Escolha o Dia
                  </h3>
                  <div className="grid grid-cols-4 sm:grid-cols-7 lg:grid-cols-4 gap-2">
                    {nextDays.map((d) => {
                      const dateStr = format(d, 'yyyy-MM-dd');
                      const isSelected = selectedDate === dateStr;
                      return (
                        <button
                          key={dateStr}
                          onClick={() => setSelectedDate(dateStr)}
                          className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                            isSelected
                              ? 'text-white shadow-md'
                              : 'bg-[#FAF8F5] dark:bg-[#251C16] text-[#2B1D15] dark:text-[#FAF7F2] border-[#E2D9CC] dark:border-[#382A21] hover:bg-[#F0E6DC] dark:hover:bg-[#34241B]'
                          }`}
                          style={{
                            backgroundColor: isSelected ? primaryColor : undefined,
                            borderColor: isSelected ? primaryColor : undefined,
                          }}
                        >
                          <p className="text-[10px] uppercase font-bold tracking-wider opacity-85">
                            {format(d, 'EEE', { locale: ptBR })}
                          </p>
                          <p className="text-lg font-black mt-0.5">{format(d, 'dd')}</p>
                        </button>
                      );
                    })}
                  </div>

                  {/* Card Resumo do Serviço Escolhido */}
                  <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#251C16] border border-[#E2D9CC] dark:border-[#382A21] text-xs space-y-2 mt-4">
                    <span className="font-bold text-[#2B1D15] dark:text-[#FAF7F2] block text-sm">
                      {selectedService?.name}
                    </span>
                    <div className="flex items-center justify-between text-[#796758] dark:text-[#CDB196]">
                      <span>Profissional:</span>
                      <strong className="text-[#2B1D15] dark:text-[#FAF7F2]">{selectedProfessional?.name}</strong>
                    </div>
                    <div className="flex items-center justify-between text-[#796758] dark:text-[#CDB196]">
                      <span>Duração:</span>
                      <strong className="text-[#2B1D15] dark:text-[#FAF7F2]">{selectedService?.durationMinutes} minutos</strong>
                    </div>
                    <div className="flex items-center justify-between text-[#796758] dark:text-[#CDB196] pt-2 border-t border-[#E2D9CC] dark:border-[#382A21]">
                      <span>Valor:</span>
                      <strong className="text-base text-[#2B1D15] dark:text-[#FAF7F2]">
                        R$ {Number(selectedService?.price).toFixed(2)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Coluna 2 (Direita): Lista de Slots de Horários Vagos */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#796758] dark:text-[#CDB196]">
                      2. Horários Disponíveis ({dateFormatted})
                    </h3>
                    {selectedSlot && (
                      <span className="text-xs font-bold text-[#6B3E26] dark:text-[#E2CEBC]">
                        Horário Selecionado: {selectedSlot.time}
                      </span>
                    )}
                  </div>

                  {loadingSlots ? (
                    <div className="flex flex-col items-center justify-center py-16 bg-[#FAF8F5] dark:bg-[#251C16] rounded-2xl border border-[#E2D9CC] dark:border-[#382A21]">
                      <Loader2 className="animate-spin text-[#6B3E26] dark:text-[#E2CEBC]" size={32} />
                      <p className="text-xs text-[#796758] dark:text-[#CDB196] mt-2 font-medium">Buscando horários disponíveis...</p>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="p-8 bg-[#FAF5ED] dark:bg-[#2B1F14] rounded-2xl border border-[#EADCC8] dark:border-[#4A3220] text-center space-y-3">
                      <p className="text-xs text-[#6B584C] dark:text-[#D7C1AC]">
                        Nenhum horário livre para {dateFormatted}. Selecione outro dia ao lado ou entre na lista de espera deste dia.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setWaitlistServiceId(selectedService?.id || '');
                          setWaitlistProfessionalId(selectedProfessional?.id || '');
                          setWaitlistPreferredDate(selectedDate || '');
                          setWaitlistSuccess(false);
                          setWaitlistModalOpen(true);
                        }}
                        className="px-4 py-2 bg-[#6B3E26] hover:bg-[#54311E] text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      >
                        <Clock size={14} />
                        <span>Entrar na Lista de Espera deste Dia</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4 gap-2.5 max-h-80 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                      {availableSlots.map((slot) => {
                        const isChosen = selectedSlot?.time === slot.time;
                        return (
                          <button
                            key={slot.time}
                            onClick={() => setSelectedSlot(slot)}
                            className={`py-2.5 px-3 rounded-xl border font-bold transition-all cursor-pointer flex flex-col items-center justify-center ${
                              isChosen
                                ? 'text-white shadow-md'
                                : 'bg-[#FAF8F5] dark:bg-[#251C16] text-[#2B1D15] dark:text-[#FAF7F2] border-[#E2D9CC] dark:border-[#382A21] hover:border-[#6B3E26]'
                            }`}
                            style={{
                              backgroundColor: isChosen ? primaryColor : undefined,
                              borderColor: isChosen ? primaryColor : undefined,
                            }}
                          >
                            <span className="text-sm font-extrabold">{slot.time}</span>
                            {slot.endTime && (
                              <span
                                className={`text-[10px] font-normal tracking-tight ${
                                  isChosen ? 'text-white/90' : 'text-[#796758] dark:text-[#CDB196]'
                                }`}
                              >
                                até {slot.endTime}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {selectedSlot && (
                    <button
                      onClick={() => setStep(4)}
                      className="w-full py-4 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-xl transition-all mt-4"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <span>Continuar para Identificação & Confirmação</span>
                      <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PASSO 4: DADOS DO CLIENTE (2 COLUNAS NO COMPUTADOR) */}
          {step === 4 && (
            <form onSubmit={handleConfirmBooking} className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#EFE9DF] dark:border-[#382A21] pb-4">
                <div>
                  <h2 className="font-extrabold text-[#2B1D15] dark:text-[#FAF7F2] text-xl sm:text-2xl">
                    Seus Dados de Contato
                  </h2>
                  <p className="text-xs sm:text-sm text-[#796758] dark:text-[#CDB196] mt-0.5">
                    Preencha seus dados para receber o lembrete e confirmação do seu horário.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="text-xs hover:underline flex items-center gap-1 font-semibold px-3 py-1.5 rounded-xl border border-[#E2D9CC] dark:border-[#382A21] text-[#796758] dark:text-[#CDB196] cursor-pointer hover:bg-[#FAF8F5]"
                >
                  <ChevronLeft size={14} /> Voltar
                </button>
              </div>

              {/* Layout em 2 colunas para Computador */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Coluna 1 (Esquerda): Formulário */}
                <div className="lg:col-span-7 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#2B1D15] dark:text-[#FAF7F2] mb-1.5">
                      Seu Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Como gostaria de ser chamado(a)?"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full px-4 py-3 bg-[#FAF8F5] dark:bg-[#251C16] border border-[#D0C3B2] dark:border-[#4A392D] text-[#2B1D15] dark:text-[#FAF7F2] rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-[#6B3E26] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#2B1D15] dark:text-[#FAF7F2] mb-1.5">
                      WhatsApp com DDD (para envio da confirmação e lembretes) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: 17999998888"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full px-4 py-3 bg-[#FAF8F5] dark:bg-[#251C16] border border-[#D0C3B2] dark:border-[#4A392D] text-[#2B1D15] dark:text-[#FAF7F2] rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-[#6B3E26] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#2B1D15] dark:text-[#FAF7F2] mb-1.5">
                      E-mail (Opcional)
                    </label>
                    <input
                      type="email"
                      placeholder="seu@email.com"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-[#FAF8F5] dark:bg-[#251C16] border border-[#D0C3B2] dark:border-[#4A392D] text-[#2B1D15] dark:text-[#FAF7F2] rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-[#6B3E26] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#2B1D15] dark:text-[#FAF7F2] mb-1.5">
                      Observações ou Preferências (Opcional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Alguma observação importante para o profissional?"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-4 py-3 bg-[#FAF8F5] dark:bg-[#251C16] border border-[#D0C3B2] dark:border-[#4A392D] text-[#2B1D15] dark:text-[#FAF7F2] rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-[#6B3E26] focus:outline-none"
                    />
                  </div>

                  {/* Cupom de Desconto */}
                  <div className="p-4 bg-[#FAF8F5] dark:bg-[#251C16] border border-[#E2D9CC] dark:border-[#382A21] rounded-2xl space-y-2">
                    <label className="block text-xs font-semibold text-[#2B1D15] dark:text-[#FAF7F2]">
                      Possui Cupom de Desconto?
                    </label>
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs">
                        <div className="flex items-center gap-2">
                          <Tag className="text-emerald-600 dark:text-emerald-400" size={16} />
                          <div>
                            <span className="font-black text-emerald-800 dark:text-emerald-200 tracking-wider">
                              {appliedCoupon.coupon.code}
                            </span>
                            <span className="text-emerald-600 dark:text-emerald-400 ml-2 font-semibold">
                              {appliedCoupon.coupon.discountType === 'PERCENTAGE'
                                ? `(${appliedCoupon.coupon.discountValue}% OFF)`
                                : `(-R$ ${appliedCoupon.discountAmount.toFixed(2)})`}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="text-[#796758] hover:text-red-500 font-bold p-1 cursor-pointer transition-colors"
                          title="Remover cupom"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Tag className="absolute left-3.5 top-3 text-[#9C8B7D]" size={15} />
                          <input
                            type="text"
                            placeholder="DIGITE SEU CUPOM"
                            value={couponCodeInput}
                            onChange={(e) => {
                              setCouponCodeInput(e.target.value.toUpperCase());
                              setCouponError(null);
                            }}
                            className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-[#1F1712] border border-[#D0C3B2] dark:border-[#4A392D] text-[#2B1D15] dark:text-[#FAF7F2] rounded-xl text-xs uppercase font-mono font-bold focus:ring-2 focus:ring-[#6B3E26] focus:outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          disabled={validatingCoupon || !couponCodeInput.trim()}
                          className="px-5 py-2.5 bg-[#6B3E26] hover:bg-[#56311D] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
                        >
                          {validatingCoupon ? <Loader2 size={13} className="animate-spin" /> : 'Aplicar'}
                        </button>
                      </div>
                    )}
                    {couponError && (
                      <p className="text-[11px] text-red-500 font-medium">{couponError}</p>
                    )}
                  </div>
                </div>

                {/* Coluna 2 (Direita): Resumo e Botão de Confirmação */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="p-5 rounded-2xl border border-[#E2D9CC] dark:border-[#382A21] bg-[#FAF8F5] dark:bg-[#251C16] text-xs space-y-3 sticky top-4">
                    <h3 className="font-bold text-[#2B1D15] dark:text-[#FAF7F2] text-sm border-b border-[#E2D9CC] dark:border-[#382A21] pb-2">
                      Resumo da Sua Reserva
                    </h3>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-[#796758] dark:text-[#CDB196]">Serviço:</span>
                        <strong className="text-[#2B1D15] dark:text-[#FAF7F2] text-right">{selectedService?.name}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#796758] dark:text-[#CDB196]">Profissional:</span>
                        <strong className="text-[#2B1D15] dark:text-[#FAF7F2]">{selectedProfessional?.name}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#796758] dark:text-[#CDB196]">Data e Hora:</span>
                        <strong className="text-[#2B1D15] dark:text-[#FAF7F2] text-right">
                          {dateFormatted} às {selectedSlot?.time}
                          {selectedSlot?.endTime ? ` até ${selectedSlot.endTime}` : ''}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#796758] dark:text-[#CDB196]">Duração estimada:</span>
                        <strong className="text-[#2B1D15] dark:text-[#FAF7F2]">{selectedService?.durationMinutes} min</strong>
                      </div>
                    </div>

                    {appliedCoupon ? (
                      <div className="pt-3 border-t border-[#E2D9CC] dark:border-[#382A21] flex justify-between items-baseline">
                        <div className="space-y-0.5">
                          <span className="text-[#9C8B7D] line-through text-xs font-semibold">
                            R$ {Number(selectedService?.price).toFixed(2)}
                          </span>
                          <span className="text-[11px] block font-bold text-emerald-600">
                            Cupom {appliedCoupon.coupon.code}: -R$ {appliedCoupon.discountAmount.toFixed(2)}
                          </span>
                        </div>
                        <p className="font-black text-xl text-emerald-600 dark:text-emerald-400">
                          R$ {appliedCoupon.finalPrice.toFixed(2)}
                        </p>
                      </div>
                    ) : (
                      <div className="pt-3 border-t border-[#E2D9CC] dark:border-[#382A21] flex justify-between items-baseline">
                        <span className="text-[#2B1D15] dark:text-[#FAF7F2] font-bold text-sm">Total:</span>
                        <p className="font-black text-xl text-[#2B1D15] dark:text-[#FAF7F2]">
                          R$ {Number(selectedService?.price).toFixed(2)}
                        </p>
                      </div>
                    )}

                    {activePaymentModel === 'DEPOSIT_PIX' && (
                      <div className="p-3 bg-[#F5EFE6] dark:bg-[#251C16] border border-[#E2D9CC] dark:border-[#382A21] rounded-xl space-y-1.5 text-xs">
                        <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-bold">
                          <span>Sinal via Pix (agora):</span>
                          <span className="text-sm font-black">R$ {step4DepositVal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-[#796758] dark:text-[#CDB196]">
                          <span>Restante no atendimento:</span>
                          <span className="font-semibold">R$ {step4RemainingVal.toFixed(2)}</span>
                        </div>
                      </div>
                    )}

                    <div className="p-3.5 bg-amber-50/90 dark:bg-[#2B1F14] border border-amber-200/80 dark:border-[#4A3220] rounded-xl text-xs text-[#5A4A3E] dark:text-[#E2CEBC] flex items-start gap-2.5">
                      <AlertCircle className="text-[#6B3E26] shrink-0 mt-0.5" size={16} />
                      <div>
                        {activePaymentModel === 'NONE' ? (
                          <>
                            <strong className="block font-bold text-[#6B3E26] dark:text-[#FAF7F2]">
                              Agendamento com Pagamento no Local
                            </strong>
                            <span className="text-[11px] leading-relaxed block mt-0.5">
                              Sua vaga será reservada de imediato sem custo agora. O valor total de R$ {currentServicePrice.toFixed(2)} será pago presencialmente no dia do atendimento.
                            </span>
                          </>
                        ) : activePaymentModel === 'DEPOSIT_PIX' ? (
                          <>
                            <strong className="block font-bold text-[#6B3E26] dark:text-[#FAF7F2]">
                              Reserva com Sinal via Pix de R$ {step4DepositVal.toFixed(2)}
                            </strong>
                            <span className="text-[11px] leading-relaxed block mt-0.5">
                              Para assegurar seu horário, transfira o sinal via Pix e envie o comprovante no WhatsApp. O restante (R$ {step4RemainingVal.toFixed(2)}) será pago presencialmente no atendimento.
                            </span>
                          </>
                        ) : (
                          <>
                            <strong className="block font-bold text-[#6B3E26] dark:text-[#FAF7F2]">
                              Pagamento Total via Pix ou Cartão (Até 12x)
                            </strong>
                            <span className="text-[11px] leading-relaxed block mt-0.5">
                              Para garantir sua vaga com segurança, o agendamento é confirmado instantaneamente após o pagamento integral via Mercado Pago.
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-4 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-xl disabled:opacity-60 transition-all mt-4"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {submitting ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <>
                          <CheckCircle2 size={18} />
                          <span>
                            {activePaymentModel === 'NONE'
                              ? `Confirmar Agendamento (R$ ${currentServicePrice.toFixed(2)})`
                              : activePaymentModel === 'DEPOSIT_PIX'
                              ? `Pagar Sinal e Agendar (R$ ${step4DepositVal.toFixed(2)})`
                              : `Pagar e Agendar (R$ ${currentServicePrice.toFixed(2)})`}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* PASSO 5: TELA DE SUCESSO / PAGAMENTO TOTAL PIX */}
          {step === 5 && bookingSuccess && (
            <div className="max-w-2xl mx-auto text-center py-6 space-y-6">
              {(bookingSuccess.appointment?.status === 'PENDING' ||
                bookingSuccess.appointment?.status === 'PENDING_PAYMENT' ||
                (bookingSuccess.requiresDeposit && bookingSuccess.appointment?.status !== 'CONFIRMED')) ? (
                /* CASO AGUARDANDO PAGAMENTO */
                bookingSuccess.depositInfo?.paymentModel === 'DEPOSIT_PIX' || !bookingSuccess.depositInfo?.isMercadoPago ? (
                  /* VISÃO 1: SINAL VIA CHAVE PIX DE PREFERÊNCIA */
                  <div className="space-y-6">
                    <div className="w-20 h-20 rounded-3xl bg-amber-50 dark:bg-[#2B1F14] text-[#6B3E26] dark:text-[#E2CEBC] flex items-center justify-center mx-auto shadow-inner border border-amber-200/80 dark:border-[#382A21]">
                      <Clock size={40} className="animate-pulse" />
                    </div>

                    <div>
                      <span className="inline-block text-xs font-bold uppercase tracking-wider px-3.5 py-1 bg-amber-100/80 dark:bg-[#2B1F14] text-[#6B3E26] dark:text-[#E2CEBC] border border-[#CDB196] dark:border-[#4A392D] rounded-full mb-2">
                        Pré-Reserva Garantida (Aguardando Sinal)
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-black text-[#2B1D15] dark:text-[#FAF7F2]">
                        Pague o Sinal via Pix para Confirmar
                      </h2>
                      <p className="text-xs sm:text-sm text-[#796758] dark:text-[#CDB196] max-w-md mx-auto mt-2 leading-relaxed">
                        Transfira o sinal via Pix e envie o comprovante no WhatsApp do estabelecimento. O restante será pago presencialmente no atendimento!
                      </p>
                    </div>

                    {/* Divisão Financeira Transparente */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-400/80 dark:border-emerald-700 rounded-2xl text-center shadow-xs">
                        <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                          Sinal via Pix (Agora)
                        </span>
                        <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
                          {bookingSuccess.depositInfo?.depositValue}
                        </p>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-0.5">
                          Garante sua vaga
                        </span>
                      </div>

                      <div className="p-4 bg-white dark:bg-[#1F1712] border border-[#E2D9CC] dark:border-[#382A21] rounded-2xl text-center shadow-xs">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#796758] dark:text-[#CDB196] block">
                          Restante no Atendimento
                        </span>
                        <p className="text-2xl font-black text-[#2B1D15] dark:text-[#FAF7F2] mt-1">
                          {bookingSuccess.depositInfo?.remainingValue}
                        </p>
                        <span className="text-[10px] text-[#796758] dark:text-[#CDB196] block mt-0.5">
                          Pague no local
                        </span>
                      </div>

                      <div className="p-4 bg-white dark:bg-[#1F1712] border border-[#E2D9CC] dark:border-[#382A21] rounded-2xl text-center shadow-xs">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#796758] dark:text-[#CDB196] block">
                          Valor Total
                        </span>
                        <p className="text-2xl font-black text-[#2B1D15] dark:text-[#FAF7F2] mt-1">
                          R$ {Number(bookingSuccess.appointment?.priceAtBooking || currentServicePrice).toFixed(2)}
                        </p>
                        <span className="text-[10px] text-[#796758] dark:text-[#CDB196] block mt-0.5">
                          Serviço completo
                        </span>
                      </div>
                    </div>

                    {/* Detalhes da Chave Pix */}
                    <div className="p-6 bg-[#FAF5ED] dark:bg-[#251C16] border border-[#E5D7C5] dark:border-[#382A21] rounded-3xl text-left text-xs sm:text-sm space-y-4 shadow-sm">
                      <div className="flex items-center justify-between border-b border-[#E2D9CC] dark:border-[#382A21] pb-3">
                        <div>
                          <span className="text-xs font-black uppercase tracking-wider text-[#6B3E26] dark:text-[#E2CEBC] block">
                            Dados para Transferência do Sinal
                          </span>
                          <span className="text-[11px] text-[#796758] dark:text-[#CDB196]">
                            Tipo: {bookingSuccess.depositInfo?.pixKeyType || 'Chave Pix'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-[#796758] dark:text-[#CDB196] block">Valor a Transferir</span>
                          <span className="text-lg font-black text-emerald-700 dark:text-emerald-400">
                            {bookingSuccess.depositInfo?.depositValue}
                          </span>
                        </div>
                      </div>

                      {bookingSuccess.depositInfo?.pixRecipientName && (
                        <div className="p-3 bg-white dark:bg-[#1F1712] rounded-xl border border-[#E2D9CC] dark:border-[#382A21]">
                          <span className="text-[11px] text-[#796758] dark:text-[#CDB196] block font-medium">Titular / Favorecido:</span>
                          <strong className="text-[#2B1D15] dark:text-[#FAF7F2] text-sm block mt-0.5">
                            {bookingSuccess.depositInfo.pixRecipientName}
                          </strong>
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-[#796758] dark:text-[#CDB196] font-semibold">
                            Chave Pix ({bookingSuccess.depositInfo?.pixKeyType || 'Chave'}):
                          </span>
                          {copiedPix && (
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <Check size={14} /> Chave Pix Copiada!
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={bookingSuccess.depositInfo?.pixKey || ''}
                            className="w-full px-4 py-3 bg-white dark:bg-[#1F1712] border-2 border-[#D0C3B2] dark:border-[#4A392D] rounded-xl font-mono text-sm font-bold text-[#2B1D15] dark:text-[#FAF7F2] select-all truncate"
                          />
                          <button
                            type="button"
                            onClick={() => handleCopyPixKey(bookingSuccess.depositInfo?.pixKey)}
                            className="px-5 py-3 bg-[#6B3E26] hover:bg-[#56311D] text-white rounded-xl font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer text-xs sm:text-sm shadow-sm"
                          >
                            <Copy size={16} />
                            <span>Copiar Chave</span>
                          </button>
                        </div>
                      </div>

                      {bookingSuccess.depositInfo?.depositInstructions && (
                        <div className="p-3.5 bg-amber-50/90 dark:bg-[#1F1712] rounded-xl text-xs text-[#5A4A3E] dark:text-[#CDB196] border border-amber-200/80 dark:border-[#382A21]">
                          <strong>Instruções do Estabelecimento:</strong> {bookingSuccess.depositInfo.depositInstructions}
                        </div>
                      )}
                    </div>

                    {/* Botão de Enviar Comprovante no WhatsApp */}
                    <div className="pt-2">
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-sm sm:text-base rounded-2xl flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/20 hover:shadow-xl transition-all cursor-pointer"
                      >
                        <Phone size={20} />
                        <span>{whatsappButtonLabel}</span>
                      </a>
                      <p className="text-xs text-[#796758] dark:text-[#CDB196] mt-2">
                        Após efetuar a transferência do sinal, envie o comprovante no WhatsApp para que o estabelecimento confirme sua vaga.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* VISÃO 2: MERCADO PAGO (PAGAMENTO TOTAL VIA PIX OU CARTÃO EM ATÉ 12X) */
                  <div className="space-y-6">
                    <div className="w-20 h-20 rounded-3xl bg-[#F5EFE6] dark:bg-[#2B1F14] text-[#6B3E26] dark:text-[#E2CEBC] flex items-center justify-center mx-auto shadow-inner border border-[#E2D9CC] dark:border-[#382A21]">
                      <Clock size={40} className="animate-pulse" />
                    </div>

                    <div>
                      <span className="inline-block text-xs font-bold uppercase tracking-wider px-3.5 py-1 bg-amber-100/80 dark:bg-[#2B1F14] text-[#6B3E26] dark:text-[#E2CEBC] border border-[#CDB196] dark:border-[#4A392D] rounded-full mb-2">
                        Horário Pré-Reservado (15 minutos)
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-black text-[#2B1D15] dark:text-[#FAF7F2]">
                        Aguardando Pagamento do Serviço
                      </h2>
                      <p className="text-xs sm:text-sm text-[#796758] dark:text-[#CDB196] max-w-md mx-auto mt-2 leading-relaxed">
                        Seu horário está reservado por 15 minutos! Escolha pagar via Pix ou Cartão de Crédito abaixo para confirmar seu agendamento imediatamente.
                      </p>
                    </div>

                    {/* Alternador de Forma de Pagamento */}
                    <div className="grid grid-cols-2 gap-2 bg-[#EFE9DF] dark:bg-[#1F1712] p-1.5 rounded-2xl max-w-md mx-auto">
                      <button
                        type="button"
                        onClick={() => setBookingPaymentMethod('pix')}
                        className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          bookingPaymentMethod === 'pix'
                            ? 'bg-white dark:bg-[#2B1F14] text-[#6B3E26] dark:text-[#FAF7F2] shadow-sm'
                            : 'text-[#796758] dark:text-[#CDB196] hover:text-[#2B1D15]'
                        }`}
                      >
                        <span>Pix Instantâneo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setBookingPaymentMethod('card')}
                        className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          bookingPaymentMethod === 'card'
                            ? 'bg-white dark:bg-[#2B1F14] text-[#6B3E26] dark:text-[#FAF7F2] shadow-sm'
                            : 'text-[#796758] dark:text-[#CDB196] hover:text-[#2B1D15]'
                        }`}
                      >
                        <CreditCard size={15} />
                        <span>Cartão (Até 12x)</span>
                      </button>
                    </div>

                    {/* Card com Detalhes do Pagamento */}
                    <div className="p-6 bg-[#FAF5ED] dark:bg-[#251C16] border border-[#E5D7C5] dark:border-[#382A21] rounded-3xl text-left text-xs sm:text-sm space-y-5 shadow-sm">
                      <div className="flex items-center justify-between border-b border-[#E2D9CC] dark:border-[#382A21] pb-3">
                        <span className="text-[#6B3E26] dark:text-[#E2CEBC] font-bold uppercase tracking-wider text-xs">
                          Valor Total do Atendimento
                        </span>
                        <span className="text-2xl font-black text-[#6B3E26] dark:text-[#E2CEBC]">
                          {bookingSuccess.depositInfo?.depositValue || (`R$ ${Number(bookingSuccess.appointment?.priceAtBooking || currentServicePrice).toFixed(2)}`)}
                        </span>
                      </div>

                      {/* OPÇÃO 1: PIX */}
                      {bookingPaymentMethod === 'pix' && (
                        <div className="space-y-4">
                          {/* Exibição do QR Code Mercado Pago caso gerado */}
                          {bookingSuccess.depositInfo?.pixQrCodeBase64 && (
                            <div className="p-5 bg-white dark:bg-[#1F1712] rounded-2xl border border-[#E2D9CC] dark:border-[#382A21] text-center space-y-3 shadow-xs">
                              <span className="text-xs font-black uppercase tracking-wider text-[#6B3E26] dark:text-[#E2CEBC] block">
                                Pague pelo QR Code do seu Banco
                              </span>
                              <div className="inline-block p-2 bg-white rounded-2xl border-2 border-[#E2D9CC] dark:border-[#4A392D] shadow-sm">
                                <img
                                  src={`data:image/png;base64,${bookingSuccess.depositInfo.pixQrCodeBase64}`}
                                  alt="QR Code Pix Mercado Pago"
                                  className="w-48 h-48 mx-auto rounded-xl object-contain"
                                />
                              </div>
                              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-full text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span>Aguardando Pix... Confirmação 100% automática em tempo real</span>
                              </div>
                            </div>
                          )}

                          {bookingSuccess.depositInfo?.pixRecipientName && (
                            <div>
                              <span className="text-xs text-[#796758] dark:text-[#CDB196] block">Titular / Recebedor:</span>
                              <strong className="text-[#2B1D15] dark:text-[#FAF7F2] text-sm">
                                {bookingSuccess.depositInfo.pixRecipientName}
                              </strong>
                            </div>
                          )}

                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs text-[#796758] dark:text-[#CDB196] font-semibold">
                                Código Pix Copia e Cola:
                              </span>
                              {copiedPix && (
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                  <Check size={14} /> Código Pix Copiado!
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                readOnly
                                value={bookingSuccess.depositInfo?.pixKey || bookingSuccess.depositInfo?.pixCopiaECola || ''}
                                className="w-full px-4 py-2.5 bg-white dark:bg-[#1F1712] border-2 border-[#D0C3B2] dark:border-[#4A392D] rounded-xl font-mono text-xs font-bold text-[#2B1D15] dark:text-[#FAF7F2] select-all truncate"
                              />
                              <button
                                type="button"
                                onClick={() => handleCopyPixKey(bookingSuccess.depositInfo?.pixKey || bookingSuccess.depositInfo?.pixCopiaECola)}
                                className="px-4 py-2.5 bg-[#6B3E26] hover:bg-[#56311D] text-white rounded-xl font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer text-xs shadow-sm"
                              >
                                <Copy size={14} />
                                <span>Copiar Pix</span>
                              </button>
                            </div>
                          </div>

                          {bookingSuccess.depositInfo?.depositInstructions && (
                            <div className="p-3 bg-white/80 dark:bg-[#1F1712] rounded-xl text-xs text-[#5A4A3E] dark:text-[#CDB196] border border-[#E2D9CC] dark:border-[#382A21]">
                              <strong>Orientações:</strong> {bookingSuccess.depositInfo.depositInstructions}
                            </div>
                          )}
                        </div>
                      )}

                      {/* OPÇÃO 2: CARTÃO DE CRÉDITO */}
                      {bookingPaymentMethod === 'card' && (
                        <div className="p-5 bg-white dark:bg-[#1F1712] rounded-2xl border border-[#E2D9CC] dark:border-[#382A21] space-y-4 text-center">
                          <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-[#009EE3] flex items-center justify-center mx-auto">
                            <CreditCard size={28} />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-[#2B1D15] dark:text-[#FAF7F2] text-base">
                              Pague no Cartão pelo Mercado Pago
                            </h4>
                            <p className="text-xs text-[#796758] dark:text-[#CDB196] mt-1 max-w-sm mx-auto">
                              Parcele em até 12x no cartão de crédito ou utilize débito com a proteção e tecnologia do Mercado Pago.
                            </p>
                          </div>

                          <div className="p-3.5 bg-[#FAF8F5] dark:bg-[#251C16] rounded-xl border border-[#EFE9DF] dark:border-[#382A21] text-left text-xs space-y-2 text-[#5A4A3E] dark:text-[#CDB196]">
                            <p className="flex items-center gap-2 font-bold text-[#2B1D15] dark:text-[#FAF7F2]">
                              <Check size={14} className="text-emerald-600" />
                              <span>Aceita Visa, Mastercard, Elo, Hipercard e American Express</span>
                            </p>
                            <p className="flex items-center gap-2 font-bold text-[#2B1D15] dark:text-[#FAF7F2]">
                              <Check size={14} className="text-emerald-600" />
                              <span>Confirmação imediata do seu horário após aprovação</span>
                            </p>
                          </div>

                          {(bookingSuccess.depositInfo?.cardPaymentUrl || bookingSuccess.appointment?.cardPaymentUrl) ? (
                            <a
                              href={bookingSuccess.depositInfo?.cardPaymentUrl || bookingSuccess.appointment?.cardPaymentUrl}
                              className="w-full py-4 bg-[#009EE3] hover:bg-[#0086c2] text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2.5 shadow-lg shadow-sky-500/20 hover:shadow-xl transition-all cursor-pointer"
                            >
                              <CreditCard size={18} />
                              <span>Pagar com Cartão de Crédito</span>
                              <ExternalLink size={16} />
                            </a>
                          ) : (
                            <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-800">
                              Gerando link de pagamento com cartão... Caso não apareça, utilize o Pix acima.
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Botão de Enviar Comprovante no WhatsApp */}
                    <div className="pt-2">
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/20 hover:shadow-xl transition-all cursor-pointer"
                      >
                        <Phone size={18} />
                        <span>{whatsappButtonLabel}</span>
                      </a>
                      <p className="text-xs text-[#796758] dark:text-[#CDB196] mt-2">
                        Ao clicar, o WhatsApp abrirá com mensagem pré-formatada com todos os dados da sua reserva.
                      </p>
                    </div>
                  </div>
                )
              ) : (
                /* CASO NÃO EXIJA SINAL (CONFIRMAÇÃO DIRETA) */
                <div className="space-y-4">
                  <div className="w-20 h-20 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 size={40} />
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black text-[#2B1D15] dark:text-[#FAF7F2]">
                    Agendamento Confirmado!
                  </h2>
                  <p className="text-xs sm:text-sm text-[#796758] dark:text-[#CDB196] max-w-md mx-auto">
                    Seu horário foi agendado com sucesso no <strong>{company?.name}</strong>. Te esperamos com muito carinho!
                  </p>
                </div>
              )}

              {/* Resumo do Agendamento */}
              <div className="p-5 bg-[#FAF8F5] dark:bg-[#251C16] border border-[#E2D9CC] dark:border-[#382A21] rounded-2xl text-left text-xs sm:text-sm space-y-2 text-[#2B1D15] dark:text-[#FAF7F2]">
                <p>
                  <strong className="text-[#796758] dark:text-[#CDB196]">Serviço:</strong> {selectedService?.name}
                </p>
                <p>
                  <strong className="text-[#796758] dark:text-[#CDB196]">Profissional:</strong> {selectedProfessional?.name}
                </p>
                <p>
                  <strong className="text-[#796758] dark:text-[#CDB196]">Horário:</strong> {selectedSlot?.time}
                  {selectedSlot?.endTime ? ` até ${selectedSlot.endTime}` : ''} ({dateFormatted})
                </p>
                <p>
                  <strong className="text-[#796758] dark:text-[#CDB196]">Local:</strong> {company?.name}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <Link
                  to={`/agendamento/${bookingSuccess.appointment?.clientManagementCode}`}
                  className="block w-full py-4 bg-[#6B3E26] hover:bg-[#56311D] text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md text-center"
                >
                  Consultar ou Cancelar Agendamento
                </Link>

                <button
                  onClick={() => {
                    setStep(1);
                    setSelectedService(null);
                    setSelectedSlot(null);
                    setBookingSuccess(null);
                  }}
                  className="block w-full py-3 text-[#796758] dark:text-[#CDB196] hover:bg-[#FAF8F5] dark:hover:bg-[#251C16] rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  Fazer Outro Agendamento
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé Oficial Inova Agenda */}
        <div className="py-4 px-6 border-t border-[#EFE9DF] dark:border-[#382A21] bg-[#FAF8F5] dark:bg-[#18120D] text-center">
          <p className="text-[11px] text-[#796758] dark:text-[#CDB196]">
            Plataforma de Agendamentos por <strong className="text-[#2B1D15] dark:text-[#FAF7F2]">Inova Agenda</strong>
          </p>
        </div>
      </div>

      {/* Modal Lista de Espera */}
      {waitlistModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#120D0A]/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#1E1712] border border-[#E2D9CC] dark:border-[#382A21] rounded-3xl w-full max-w-lg p-6 sm:p-8 space-y-5 shadow-2xl relative my-8">
            <button
              type="button"
              onClick={() => setWaitlistModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-[#796758] hover:text-[#2B1D15] dark:hover:text-white hover:bg-[#FAF8F5] dark:hover:bg-[#2A2018] transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            {waitlistSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="text-xl font-black text-[#2B1D15] dark:text-[#FAF7F2]">
                  Você está na Lista de Espera!
                </h3>
                <p className="text-xs sm:text-sm text-[#796758] dark:text-[#CDB196] leading-relaxed max-w-sm mx-auto">
                  Registramos seu interesse com sucesso. Assim que um horário compatível surgir na agenda de {company?.name}, entraremos em contato imediatamente pelo WhatsApp: <strong>{waitlistPhone}</strong>.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setWaitlistModalOpen(false);
                      setWaitlistSuccess(false);
                    }}
                    className="w-full py-3 bg-[#6B3E26] hover:bg-[#54311E] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                  >
                    Entendido, Voltar aos Agendamentos
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleJoinWaitlist} className="space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-[#FAF5ED] dark:bg-[#251C16] text-[#6B3E26] dark:text-[#E2CEBC]">
                      <Clock size={20} />
                    </span>
                    <div>
                      <h3 className="text-lg font-black text-[#2B1D15] dark:text-[#FAF7F2]">
                        Lista de Espera VIP
                      </h3>
                      <p className="text-xs text-[#796758] dark:text-[#CDB196]">
                        Não encontrou vaga? Seja notificado caso surja uma desistência!
                      </p>
                    </div>
                  </div>
                </div>

                {waitlistError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{waitlistError}</span>
                  </div>
                )}

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-[#2B1D15] dark:text-[#FAF7F2] mb-1">
                      Seu Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={waitlistName}
                      onChange={(e) => setWaitlistName(e.target.value)}
                      placeholder="Como gostaria de ser chamado(a)?"
                      className="w-full p-3 bg-[#FAF8F5] dark:bg-[#251C16] border border-[#E2D9CC] dark:border-[#382A21] rounded-xl text-[#2B1D15] dark:text-[#FAF7F2] focus:outline-none focus:border-[#6B3E26]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-[#2B1D15] dark:text-[#FAF7F2] mb-1">
                        WhatsApp com DDD *
                      </label>
                      <input
                        type="tel"
                        required
                        value={waitlistPhone}
                        onChange={(e) => setWaitlistPhone(e.target.value)}
                        placeholder="(11) 99999-9999"
                        className="w-full p-3 bg-[#FAF8F5] dark:bg-[#251C16] border border-[#E2D9CC] dark:border-[#382A21] rounded-xl text-[#2B1D15] dark:text-[#FAF7F2] focus:outline-none focus:border-[#6B3E26]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#2B1D15] dark:text-[#FAF7F2] mb-1">
                        E-mail (opcional)
                      </label>
                      <input
                        type="email"
                        value={waitlistEmail}
                        onChange={(e) => setWaitlistEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="w-full p-3 bg-[#FAF8F5] dark:bg-[#251C16] border border-[#E2D9CC] dark:border-[#382A21] rounded-xl text-[#2B1D15] dark:text-[#FAF7F2] focus:outline-none focus:border-[#6B3E26]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-[#2B1D15] dark:text-[#FAF7F2] mb-1">
                        Serviço Desejado
                      </label>
                      <select
                        value={waitlistServiceId}
                        onChange={(e) => setWaitlistServiceId(e.target.value)}
                        className="w-full p-3 bg-[#FAF8F5] dark:bg-[#251C16] border border-[#E2D9CC] dark:border-[#382A21] rounded-xl text-[#2B1D15] dark:text-[#FAF7F2] focus:outline-none focus:border-[#6B3E26]"
                      >
                        <option value="">Qualquer serviço</option>
                        {company?.services?.map((s: any) => (
                          <option key={s.id} value={s.id}>
                            {s.name} (R$ {Number(s.price).toFixed(2)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-[#2B1D15] dark:text-[#FAF7F2] mb-1">
                        Profissional Preferido
                      </label>
                      <select
                        value={waitlistProfessionalId}
                        onChange={(e) => setWaitlistProfessionalId(e.target.value)}
                        className="w-full p-3 bg-[#FAF8F5] dark:bg-[#251C16] border border-[#E2D9CC] dark:border-[#382A21] rounded-xl text-[#2B1D15] dark:text-[#FAF7F2] focus:outline-none focus:border-[#6B3E26]"
                      >
                        <option value="">Qualquer profissional</option>
                        {company?.professionals?.map((p: any) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-[#2B1D15] dark:text-[#FAF7F2] mb-1">
                        Data Preferida
                      </label>
                      <input
                        type="date"
                        value={waitlistPreferredDate}
                        onChange={(e) => setWaitlistPreferredDate(e.target.value)}
                        className="w-full p-3 bg-[#FAF8F5] dark:bg-[#251C16] border border-[#E2D9CC] dark:border-[#382A21] rounded-xl text-[#2B1D15] dark:text-[#FAF7F2] focus:outline-none focus:border-[#6B3E26]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#2B1D15] dark:text-[#FAF7F2] mb-1">
                        Período de Preferência
                      </label>
                      <select
                        value={waitlistPreferredPeriod}
                        onChange={(e) => setWaitlistPreferredPeriod(e.target.value as any)}
                        className="w-full p-3 bg-[#FAF8F5] dark:bg-[#251C16] border border-[#E2D9CC] dark:border-[#382A21] rounded-xl text-[#2B1D15] dark:text-[#FAF7F2] focus:outline-none focus:border-[#6B3E26]"
                      >
                        <option value="QUALQUER">Qualquer horário</option>
                        <option value="MANHA">Manhã (08h às 12h)</option>
                        <option value="TARDE">Tarde (12h às 18h)</option>
                        <option value="NOITE">Noite (18h às 22h)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-[#2B1D15] dark:text-[#FAF7F2] mb-1">
                      Observações / Dias Específicos
                    </label>
                    <textarea
                      rows={2}
                      value={waitlistNotes}
                      onChange={(e) => setWaitlistNotes(e.target.value)}
                      placeholder="Ex: Tenho preferência para sexta-feira à tarde..."
                      className="w-full p-3 bg-[#FAF8F5] dark:bg-[#251C16] border border-[#E2D9CC] dark:border-[#382A21] rounded-xl text-[#2B1D15] dark:text-[#FAF7F2] focus:outline-none focus:border-[#6B3E26] resize-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setWaitlistModalOpen(false)}
                    className="px-4 py-3 rounded-xl border border-[#E2D9CC] dark:border-[#382A21] text-xs font-semibold text-[#796758] dark:text-[#CDB196] hover:bg-[#FAF8F5] dark:hover:bg-[#251C16] transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submittingWaitlist}
                    className="flex-1 py-3 bg-[#6B3E26] hover:bg-[#54311E] text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submittingWaitlist ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Cadastrando...</span>
                      </>
                    ) : (
                      <span>Confirmar Entrada na Lista</span>
                    )}
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
