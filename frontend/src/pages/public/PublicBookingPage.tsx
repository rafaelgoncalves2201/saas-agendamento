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

  // 1. Carregar dados públicos da empresa
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
  }, [companySlug, professionalSlug]);

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

  const handleCopyPixKey = (key: string) => {
    if (!key) return;
    navigator.clipboard.writeText(key);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={36} />
      </div>
    );
  }

  if (error && !company) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-center">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 max-w-md shadow-sm">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Ops!</h2>
          <p className="text-sm text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  const primaryColor = company?.settings?.primaryColor || '#4F46E5';
  const companySettings = company?.settings || {};
  const nextDays = Array.from({ length: 7 }).map((_, i) => addDays(new Date(), i + 1));

  // WhatsApp link preparation for Step 5
  const companyPhoneRaw = (bookingSuccess?.depositInfo?.companyPhone || company?.phone || '').replace(/\D/g, '');
  const cleanPhone = companyPhoneRaw.startsWith('55') ? companyPhoneRaw : `55${companyPhoneRaw}`;
  const depositVal = bookingSuccess?.depositInfo?.depositValue || companySettings.depositValue || 'R$ 20,00';
  const dateFormatted = format(new Date(selectedDate + 'T12:00:00'), 'dd/MM/yyyy');
  const timeLabel = selectedSlot?.endTime
    ? `${selectedSlot.time} até ${selectedSlot.endTime}`
    : selectedSlot?.time;

  const whatsappMessage = encodeURIComponent(
    `Olá! Acabei de fazer um agendamento no *${company?.name}*:\n\n` +
      `*Serviço:* ${selectedService?.name}\n` +
      `*Profissional:* ${selectedProfessional?.name}\n` +
      `*Horário:* ${timeLabel} de ${dateFormatted}\n` +
      `*Cliente:* ${clientName}\n` +
      (bookingSuccess?.requiresDeposit
        ? `*Sinal via Pix:* ${depositVal}\n\nEstou enviando o comprovante do sinal via Pix para confirmação da minha vaga!`
        : `\nGostaria de confirmar que meu agendamento foi realizado com sucesso!`)
  );

  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${whatsappMessage}`;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-start p-3 sm:p-6 md:py-10 transition-colors">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/60 dark:shadow-none border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Banner de Capa + Header da Empresa */}
        <div
          className="relative text-white p-6 sm:p-8 bg-cover bg-center overflow-hidden"
          style={{
            backgroundColor: primaryColor,
            backgroundImage: company?.coverUrl
              ? `linear-gradient(to bottom, rgba(15, 23, 42, 0.45), rgba(15, 23, 42, 0.85)), url(${company.coverUrl})`
              : undefined,
          }}
        >
          <div className="flex items-start gap-4 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-bold text-2xl shadow-lg shrink-0 overflow-hidden">
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

            <div className="min-w-0">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white inline-block mb-1">
                Agendamento Online
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white leading-tight truncate">
                {company?.name}
              </h1>
              {companySettings.bio && (
                <p className="text-xs text-white/80 mt-1 line-clamp-2">{companySettings.bio}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-white/90">
                <span className="flex items-center gap-1">
                  <Phone size={12} /> {company?.phone}
                </span>
                {companySettings.instagram && (
                  <span className="flex items-center gap-1">
                    <InstagramIcon size={12} /> {companySettings.instagram}
                  </span>
                )}
                {companySettings.address && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} /> {companySettings.address}
                  </span>
                )}
              </div>
            </div>
          </div>

          {selectedProfessional && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-white relative z-10 shadow-xs">
              <User size={14} />
              <span>Atendimento com {selectedProfessional.name}</span>
            </div>
          )}
        </div>

        {/* Mensagem de Boas-Vindas */}
        {step === 1 && companySettings.welcomeMessage && (
          <div className="px-6 pt-4 pb-1 text-xs text-slate-500 dark:text-slate-400 italic bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
            "{companySettings.welcomeMessage}"
          </div>
        )}

        {/* Barra de Progresso do Agendamento */}
        {step < 5 && (
          <div className="flex items-center justify-between px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span style={{ color: step >= 1 ? primaryColor : undefined }}>1. Serviço</span>
            <span>&rarr;</span>
            <span style={{ color: step >= 2 ? primaryColor : undefined }}>2. Profissional</span>
            <span>&rarr;</span>
            <span style={{ color: step >= 3 ? primaryColor : undefined }}>3. Horário</span>
            <span>&rarr;</span>
            <span style={{ color: step >= 4 ? primaryColor : undefined }}>4. Dados</span>
          </div>
        )}

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="p-6 sm:p-8">
          {/* PASSO 1: SELECIONAR SERVIÇO COM FOTOS */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-bold text-slate-900 dark:text-white text-base">Escolha o Serviço</h2>
              <div className="space-y-2.5">
                {company?.services?.map((srv: any) => {
                  const isSelected = selectedService?.id === srv.id;
                  return (
                    <button
                      key={srv.id}
                      onClick={() => {
                        setSelectedService(srv);
                        setStep(selectedProfessional ? 3 : 2);
                      }}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                      style={{
                        borderColor: isSelected ? primaryColor : undefined,
                        backgroundColor: isSelected ? `${primaryColor}10` : undefined,
                      }}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {srv.imageUrl ? (
                          <img
                            src={srv.imageUrl}
                            alt={srv.name}
                            className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700 shadow-xs"
                            onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                          />
                        ) : (
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                          >
                            <Scissors size={20} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate">{srv.name}</h3>
                          {srv.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{srv.description}</p>
                          )}
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{srv.durationMinutes} minutos</p>
                        </div>
                      </div>
                      <div className="text-right pl-3 shrink-0">
                        <span className="font-black text-slate-900 dark:text-white text-sm">
                          R$ {Number(srv.price).toFixed(2)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* PASSO 2: SELECIONAR PROFISSIONAL */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-slate-900 dark:text-white text-base">Escolha o Profissional</h2>
                <button
                  onClick={() => setStep(1)}
                  className="text-xs hover:underline flex items-center gap-1 font-semibold"
                  style={{ color: primaryColor }}
                >
                  <ChevronLeft size={14} /> Voltar
                </button>
              </div>

              <div className="space-y-2.5">
                {company?.professionals?.map((prof: any) => {
                  const isSelected = selectedProfessional?.id === prof.id;
                  return (
                    <button
                      key={prof.id}
                      onClick={() => {
                        setSelectedProfessional(prof);
                        setStep(3);
                      }}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center gap-3.5 cursor-pointer ${
                        isSelected
                          ? 'shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                      style={{
                        borderColor: isSelected ? primaryColor : undefined,
                        backgroundColor: isSelected ? `${primaryColor}10` : undefined,
                      }}
                    >
                      {prof.avatarUrl ? (
                        <img
                          src={prof.avatarUrl}
                          alt={prof.name}
                          className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700 shadow-xs"
                        />
                      ) : (
                        <div
                          className="w-12 h-12 rounded-xl font-bold text-base flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                        >
                          {prof.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">{prof.name}</h3>
                        {prof.bio && <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{prof.bio}</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* PASSO 3: SELECIONAR DATA E HORÁRIO */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-slate-900 dark:text-white text-base">Selecione Data e Horário</h2>
                <button
                  onClick={() => setStep(selectedProfessional && !professionalSlug ? 2 : 1)}
                  className="text-xs hover:underline flex items-center gap-1 font-semibold"
                  style={{ color: primaryColor }}
                >
                  <ChevronLeft size={14} /> Voltar
                </button>
              </div>

              {/* Dias da semana scrolláveis */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {nextDays.map((d) => {
                  const dateStr = format(d, 'yyyy-MM-dd');
                  const isSelected = selectedDate === dateStr;
                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`flex-shrink-0 px-4 py-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'text-white shadow-md'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                      style={{
                        backgroundColor: isSelected ? primaryColor : undefined,
                        borderColor: isSelected ? primaryColor : undefined,
                      }}
                    >
                      <p className="text-[10px] uppercase font-bold tracking-wider">
                        {format(d, 'EEE', { locale: ptBR })}
                      </p>
                      <p className="text-base font-black mt-0.5">{format(d, 'dd')}</p>
                    </button>
                  );
                })}
              </div>

              {/* Lista de Slots Vagos */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                  Horários Disponíveis ({format(new Date(selectedDate + 'T12:00:00'), 'dd/MM/yyyy')})
                </h3>

                {loadingSlots ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin" style={{ color: primaryColor }} size={24} />
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="p-6 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
                    Nenhum horário disponível para esta data. Por favor, selecione outro dia acima.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
                    {availableSlots.map((slot) => {
                      const isChosen = selectedSlot?.time === slot.time;
                      return (
                        <button
                          key={slot.time}
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-2 px-2 rounded-xl border font-bold transition-all cursor-pointer flex flex-col items-center justify-center ${
                            isChosen
                              ? 'text-white shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                          }`}
                          style={{
                            backgroundColor: isChosen ? primaryColor : undefined,
                            borderColor: isChosen ? primaryColor : undefined,
                          }}
                        >
                          <span className="text-xs">{slot.time}</span>
                          {slot.endTime && (
                            <span
                              className={`text-[10px] font-normal tracking-tight ${
                                isChosen ? 'text-white/90' : 'text-slate-500 dark:text-slate-400'
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
              </div>

              {selectedSlot && (
                <button
                  onClick={() => setStep(4)}
                  className="w-full py-3.5 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                  style={{ backgroundColor: primaryColor }}
                >
                  <span>Continuar para Dados Pessoais</span>
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          )}

          {/* PASSO 4: DADOS DO CLIENTE */}
          {step === 4 && (
            <form onSubmit={handleConfirmBooking} className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-bold text-slate-900 dark:text-white text-base">Seus Dados de Contato</h2>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="text-xs hover:underline flex items-center gap-1 font-semibold"
                  style={{ color: primaryColor }}
                >
                  <ChevronLeft size={14} /> Voltar
                </button>
              </div>

              {/* Resumo do Agendamento */}
              <div
                className="p-4 rounded-2xl border text-xs space-y-1.5"
                style={{
                  backgroundColor: `${primaryColor}0C`,
                  borderColor: `${primaryColor}30`,
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{selectedService?.name}</p>
                    <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                      Com <strong>{selectedProfessional?.name}</strong> às{' '}
                      <strong>
                        {selectedSlot?.time}
                        {selectedSlot?.endTime ? ` até ${selectedSlot.endTime}` : ''}
                      </strong>{' '}
                      do dia {format(new Date(selectedDate + 'T12:00:00'), 'dd/MM/yyyy')}
                    </p>
                  </div>
                </div>

                {appliedCoupon ? (
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-baseline justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 dark:text-slate-500 line-through text-xs font-semibold">
                          R$ {Number(selectedService?.price).toFixed(2)}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                          Cupom {appliedCoupon.coupon.code}: -R$ {appliedCoupon.discountAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <p className="font-black text-base text-emerald-600 dark:text-emerald-400">
                      R$ {appliedCoupon.finalPrice.toFixed(2)}
                    </p>
                  </div>
                ) : (
                  <div className="pt-1 flex items-baseline justify-between">
                    <span className="text-slate-500 dark:text-slate-400 text-xs">Valor Total:</span>
                    <p className="font-black text-sm" style={{ color: primaryColor }}>
                      R$ {Number(selectedService?.price).toFixed(2)}
                    </p>
                  </div>
                )}
              </div>

              {/* Aviso de Sinal se configurado */}
              {companySettings.requiresDeposit && (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                  <AlertCircle className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" size={16} />
                  <div>
                    <p className="font-bold">Aviso: Reserva mediante sinal via Pix</p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                      Este estabelecimento exige o pagamento de um sinal de{' '}
                      <strong>{companySettings.depositValue || 'R$ 20,00'}</strong> para confirmar seu horário. Após clicar em confirmar, você terá acesso à chave Pix e ao botão direto de envio do comprovante pelo WhatsApp.
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Seu Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Como gostaria de ser chamado(a)?"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:outline-none"
                  style={{ '--tw-ring-color': primaryColor } as any}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  WhatsApp com DDD (para confirmação e lembretes) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="11999998888"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:outline-none"
                  style={{ '--tw-ring-color': primaryColor } as any}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  E-mail (Opcional)
                </label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:outline-none"
                  style={{ '--tw-ring-color': primaryColor } as any}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Observações (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Alguma preferência ou detalhe especial?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:outline-none"
                  style={{ '--tw-ring-color': primaryColor } as any}
                />
              </div>

              {/* Cupom de Desconto */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Cupom de Desconto
                </label>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs">
                    <div className="flex items-center gap-2">
                      <Tag className="text-emerald-600 dark:text-emerald-400" size={15} />
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
                      className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 font-bold p-1 cursor-pointer transition-colors"
                      title="Remover cupom"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" size={14} />
                        <input
                          type="text"
                          placeholder="Ex: VERAO10"
                          value={couponCodeInput}
                          onChange={(e) => {
                            setCouponCodeInput(e.target.value.toUpperCase());
                            setCouponError(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleApplyCoupon();
                            }
                          }}
                          className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs uppercase font-mono font-semibold focus:ring-2 focus:outline-none"
                          style={{ '--tw-ring-color': primaryColor } as any}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={validatingCoupon || !couponCodeInput.trim()}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
                      >
                        {validatingCoupon ? <Loader2 size={13} className="animate-spin" /> : 'Aplicar'}
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-[11px] text-red-500 dark:text-red-400 mt-1 font-medium">{couponError}</p>
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-60 transition-all"
                style={{ backgroundColor: primaryColor }}
              >
                {submitting ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>{companySettings.requiresDeposit ? 'Pré-Reservar Horário com Sinal' : 'Confirmar Agendamento'}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* PASSO 5: TELA DE SUCESSO / PAGAMENTO DO SINAL PIX */}
          {step === 5 && bookingSuccess && (
            <div className="text-center py-4 space-y-4">
              {bookingSuccess.requiresDeposit || bookingSuccess.appointment?.status === 'PENDING' ? (
                /* CASO EXIJA SINAL */
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                    <Clock size={36} />
                  </div>

                  <div>
                    <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-3 py-1 bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 rounded-full mb-2">
                      Aguardando Confirmação
                    </span>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">Aguardando Confirmação</h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto mt-1">
                      Seu horário está pré-reservado. Para confirmação da sua vaga, envie o comprovante do sinal via Pix abaixo.
                    </p>
                  </div>

                  {/* Card com Detalhes do Pix */}
                  <div className="p-5 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl text-left text-xs space-y-3 shadow-xs">
                    <div className="flex items-center justify-between border-b border-amber-200/70 dark:border-amber-900/40 pb-2.5">
                      <span className="text-amber-900 dark:text-amber-300 font-bold uppercase tracking-wider text-[11px]">
                        Dados para Pagamento do Sinal
                      </span>
                      <span className="text-base font-black text-amber-800 dark:text-amber-300">
                        {bookingSuccess.depositInfo?.depositValue || companySettings.depositValue || 'R$ 20,00'}
                      </span>
                    </div>

                    {bookingSuccess.depositInfo?.pixRecipientName && (
                      <div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Favorecido / Titular:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {bookingSuccess.depositInfo.pixRecipientName}
                        </span>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Chave Pix ({bookingSuccess.depositInfo?.pixKeyType || 'Chave'}):
                        </span>
                        {copiedPix && (
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Check size={12} /> Copiado!
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={bookingSuccess.depositInfo?.pixKey || ''}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700/60 rounded-xl font-mono text-xs font-semibold text-slate-800 dark:text-white select-all"
                        />
                        <button
                          type="button"
                          onClick={() => handleCopyPixKey(bookingSuccess.depositInfo?.pixKey)}
                          className="px-3 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer text-xs"
                        >
                          <Copy size={13} />
                          <span>Copiar</span>
                        </button>
                      </div>
                    </div>

                    {bookingSuccess.depositInfo?.depositInstructions && (
                      <div className="p-2.5 bg-white/80 dark:bg-slate-800/80 rounded-xl text-[11px] text-slate-600 dark:text-slate-300 border border-amber-100 dark:border-amber-900/30">
                        <strong>Orientações:</strong> {bookingSuccess.depositInfo.depositInstructions}
                      </div>
                    )}
                  </div>

                  {/* Botão de Enviar Comprovante no WhatsApp */}
                  <div className="pt-1">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-200 dark:shadow-none transition-all cursor-pointer"
                    >
                      <Phone size={16} />
                      <span>Enviar Comprovante pelo WhatsApp</span>
                    </a>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                      Ao clicar, o WhatsApp abrirá com mensagem pronta e o resumo do seu agendamento.
                    </p>
                  </div>
                </div>
              ) : (
                /* CASO NÃO EXIJA SINAL (CONFIRMAÇÃO DIRETA) */
                <div className="space-y-3">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 size={36} />
                  </div>

                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">Agendamento Confirmado!</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Enviamos os detalhes da sua reserva para o seu WhatsApp. Te esperamos com carinho!
                  </p>
                </div>
              )}

              {/* Resumo do Agendamento */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-left text-xs space-y-1.5 my-3 text-slate-700 dark:text-slate-300">
                <p>
                  <strong className="text-slate-900 dark:text-white">Serviço:</strong> {selectedService?.name}
                </p>
                <p>
                  <strong className="text-slate-900 dark:text-white">Profissional:</strong> {selectedProfessional?.name}
                </p>
                <p>
                  <strong className="text-slate-900 dark:text-white">Horário:</strong> {selectedSlot?.time}
                  {selectedSlot?.endTime ? ` até ${selectedSlot.endTime}` : ''} ({dateFormatted})
                </p>
                <p>
                  <strong className="text-slate-900 dark:text-white">Local:</strong> {company?.name}
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <Link
                  to={`/agendamento/${bookingSuccess.appointment.clientManagementCode}`}
                  className="block w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold rounded-xl text-xs transition-colors"
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
                  className="block w-full py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Fazer Outro Agendamento
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
