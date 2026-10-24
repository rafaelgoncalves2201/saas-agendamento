import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Flower2,
  User,
  CalendarDays,
  Clock,
  Check,
  ChevronRight,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  UserRound,
  Copy,
  ArrowRight,
  Sparkles,
  Phone,
  MapPin,
  Tag,
  CreditCard,
  QrCode,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Avatar } from '../../components/ui/Avatar';
import { ThemeToggle } from '../../components/ThemeToggle';
import { DatePicker } from '../../components/site/DatePicker';

const STEPS = [
  { title: 'Procedimento', icon: Flower2 },
  { title: 'Profissional', icon: User },
  { title: 'Data', icon: CalendarDays },
  { title: 'Horário', icon: Clock },
  { title: 'Seus dados', icon: UserRound },
  { title: 'Confirmação', icon: Check },
];

export const PublicBookingPage: React.FC = () => {
  const { companySlug, professionalSlug } = useParams<{
    companySlug: string;
    professionalSlug?: string;
  }>();

  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stepper: 0 a 5 (Procedimento, Profissional, Data, Horário, Seus dados, Confirmação)
  const [step, setStep] = useState<number>(0);

  // Seleções do fluxo Alvore
  const [serviceId, setServiceId] = useState<string>('');
  const [professionalSel, setProfessionalSel] = useState<string>('any');
  const [date, setDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return format(tomorrow, 'yyyy-MM-dd');
  });
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Formulário do cliente
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
  });

  // Cupom de Desconto
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Submissão & Resultado
  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<any | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // 1. Carregar dados da empresa
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
            setProfessionalSel(prof.id);
          }
        }
      })
      .catch(() => setError('Estabelecimento não encontrado ou temporariamente inativo.'))
      .finally(() => setLoading(false));
  }, [companySlug, professionalSlug]);

  const services = useMemo(() => company?.services || [], [company]);
  const professionals = useMemo(() => company?.professionals || [], [company]);

  const service = useMemo(
    () => services.find((s: any) => s.id === serviceId),
    [services, serviceId]
  );

  const effectiveProfessional = useMemo(() => {
    if (professionalSel === 'any') {
      return professionals[0] || null;
    }
    return professionals.find((b: any) => b.id === professionalSel) || null;
  }, [professionals, professionalSel]);

  // Navegar entre etapas
  function go(next: number) {
    setError(null);
    setStep(next);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // Validação para habilitar o botão Continuar
  const canNext = useMemo(() => {
    if (step === 0) return !!serviceId;
    if (step === 1) return true;
    if (step === 2) return !!date;
    if (step === 3) return !!selectedSlot;
    if (step === 4) return form.name.trim().length >= 3 && form.phone.trim().length >= 8;
    return true;
  }, [step, serviceId, date, selectedSlot, form]);

  // 2. Carregar horários disponíveis da etapa 3
  async function loadSlots() {
    if (!company || !serviceId || !date) return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    const targetProfId = professionalSel === 'any' ? effectiveProfessional?.id : professionalSel;
    if (!targetProfId) {
      setSlots([]);
      setLoadingSlots(false);
      return;
    }

    try {
      const res = await axios.get(`${apiUrl}/public/companies/${company.slug}/availability`, {
        params: {
          professionalId: targetProfId,
          serviceId,
          date,
        },
      });
      setSlots(res.data.availableSlots || []);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }

  useEffect(() => {
    if (step === 3) {
      loadSlots();
    }
  }, [step, date, professionalSel, serviceId]);

  // Validação do Cupom
  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !company || !service) return;
    setValidatingCoupon(true);
    setCouponError(null);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    try {
      const res = await axios.post(`${apiUrl}/public/companies/${company.slug}/validate-coupon`, {
        code: couponCode.trim(),
        serviceId: service.id,
        professionalId: effectiveProfessional?.id,
      });
      setAppliedCoupon(res.data);
    } catch (err: any) {
      setAppliedCoupon(null);
      setCouponError(err.response?.data?.message || 'Cupom inválido ou expirado.');
    } finally {
      setValidatingCoupon(false);
    }
  };

  // Submeter Agendamento
  const handleSubmitBooking = async () => {
    if (!company || !service || !selectedSlot) return;
    setSubmitting(true);
    setError(null);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    const targetProfId = professionalSel === 'any' ? effectiveProfessional?.id : professionalSel;

    try {
      const res = await axios.post(`${apiUrl}/public/companies/${company.slug}/appointments`, {
        professionalId: targetProfId,
        serviceId: service.id,
        startDateTime: selectedSlot.start,
        clientName: form.name.trim(),
        clientPhone: form.phone.trim(),
        clientEmail: form.email.trim() || undefined,
        notes: form.notes.trim() || undefined,
        couponCode: appliedCoupon?.coupon?.code || undefined,
      });

      setBookingResult(res.data);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Este horário acabou de ser reservado por outro cliente. Por favor, selecione outro horário.'
      );
      if (err.response?.status === 409) {
        go(3);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Polling em tempo real para pagamentos Pix
  useEffect(() => {
    const mgmtCode = bookingResult?.appointment?.clientManagementCode;
    const currentStatus = bookingResult?.appointment?.status;

    if (!bookingResult || !mgmtCode || currentStatus === 'CONFIRMED') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const res = await axios.get(`${apiUrl}/public/appointments/${mgmtCode}`);
        if (res.data?.status === 'CONFIRMED') {
          setBookingResult((prev: any) => ({
            ...prev,
            requiresDeposit: false,
            appointment: {
              ...(prev?.appointment || {}),
              ...res.data,
              status: 'CONFIRMED',
            },
          }));
        }
      } catch {
        // Silencioso
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [bookingResult]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={36} />
      </div>
    );
  }

  if (error && !company) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 text-center">
        <div className="card p-8 max-w-md shadow-elevated">
          <h2 className="text-xl font-bold text-foreground mb-2">Ops!</h2>
          <p className="text-sm text-foreground-muted">{error}</p>
          <Link to="/" className="btn-outline mt-6">
            Voltar ao Início
          </Link>
        </div>
      </div>
    );
  }

  const finalPrice = appliedCoupon ? appliedCoupon.finalPrice : Number(service?.price || 0);

  // TELA DE SUCESSO (Confirmado)
  if (bookingResult) {
    const app = bookingResult.appointment;
    const trackingUrl = `${window.location.origin}/agendamento/${app.clientManagementCode}`;

    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
        {/* Header público */}
        <header className="border-b border-border bg-surface/80 backdrop-blur-xl sticky top-0 z-40">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5 sm:px-8">
            <div className="flex items-center gap-3">
              {company?.logoUrl ? (
                <img src={company.logoUrl} alt={company.name} className="h-9 w-9 rounded-xl object-cover ring-1 ring-border" />
              ) : (
                <Avatar name={company?.name || 'Inovae Agenda'} size="sm" />
              )}
              <span className="font-display font-bold text-base text-foreground tracking-tight">
                {company?.name}
              </span>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="mx-auto max-w-lg px-5 py-12 text-center sm:px-8 flex-1 animate-scale-in">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/15 text-success mb-6 shadow-soft">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {bookingResult.requiresDeposit ? 'Reserva Realizada!' : 'Agendamento Confirmado!'}
          </h1>
          <p className="mt-2 text-sm text-foreground-muted">
            {bookingResult.requiresDeposit
              ? 'Efetue o pagamento do sinal para confirmar o horário instantaneamente.'
              : 'Enviamos todos os dados e a confirmação para seu WhatsApp.'}
          </p>

          <div className="card mt-6 p-6 text-left space-y-4">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-soft">
                <Flower2 className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-foreground text-sm">{service?.name}</p>
                <p className="text-xs text-foreground-muted">
                  {service?.durationMinutes} min · R$ {Number(finalPrice).toFixed(2)}
                </p>
              </div>
            </div>

            <dl className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <dt className="text-foreground-muted">Profissional:</dt>
                <dd className="font-semibold text-foreground">
                  {effectiveProfessional?.name || 'Primeiro disponível'}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-foreground-muted">Data:</dt>
                <dd className="font-semibold text-foreground">
                  {format(parseISO(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-foreground-muted">Horário:</dt>
                <dd className="font-semibold text-foreground">{selectedSlot?.time}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-foreground-muted">Cliente:</dt>
                <dd className="font-semibold text-foreground">{form.name}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-foreground-muted">Código de Consulta:</dt>
                <dd className="font-mono font-bold text-accent">{app.clientManagementCode}</dd>
              </div>
            </dl>

            {/* Se houver cobrança de sinal Pix */}
            {bookingResult.requiresDeposit && (app.pixQrCodeBase64 || app.pixCopiaECola) && (
              <div className="mt-4 pt-4 border-t border-border space-y-3">
                <div className="bg-surface-2 p-3 rounded-xl border border-border text-center">
                  <span className="text-[11px] font-semibold text-foreground-muted block mb-1">
                    Sinal de Reserva
                  </span>
                  <span className="text-xl font-black text-accent block">
                    R$ {Number(app.depositAmount || finalPrice).toFixed(2)}
                  </span>
                </div>

                {app.pixQrCodeBase64 && (
                  <div className="bg-white p-3 rounded-2xl border border-border inline-block mx-auto shadow-soft text-center w-full">
                    <img
                      src={`data:image/png;base64,${app.pixQrCodeBase64}`}
                      alt="Pix QR Code"
                      className="w-44 h-44 mx-auto"
                    />
                    <span className="text-[11px] text-stone-500 font-medium block mt-1">
                      Escaneie no app do seu banco
                    </span>
                  </div>
                )}

                {app.pixCopiaECola && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(app.pixCopiaECola);
                      setCopiedPix(true);
                      setTimeout(() => setCopiedPix(false), 2500);
                    }}
                    className="btn-outline w-full py-2.5 text-xs font-semibold"
                  >
                    {copiedPix ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                    <span>{copiedPix ? 'Chave Pix Copiada!' : 'Copiar Chave Pix Copia e Cola'}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => {
                navigator.clipboard.writeText(trackingUrl);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2500);
              }}
              className="btn-outline text-xs"
            >
              {copiedLink ? <Check size={14} className="text-success" /> : <Copy size={14} />}
              <span>{copiedLink ? 'Link copiado!' : 'Copiar link de confirmação'}</span>
            </button>

            <Link to={`/agendamento/${app.clientManagementCode}`} className="btn-primary text-xs">
              <span>Acompanhar agendamento</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <button
            onClick={() => {
              setBookingResult(null);
              setStep(0);
              setServiceId('');
              setSelectedSlot(null);
            }}
            className="mt-6 inline-block text-xs font-medium text-accent hover:underline cursor-pointer"
          >
            Fazer outro agendamento
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      {/* Top Navbar Luxury */}
      <header className="border-b border-border bg-surface/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3">
            {company?.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={company.name}
                className="h-10 w-10 rounded-xl object-cover ring-1 ring-border shadow-xs"
              />
            ) : (
              <Avatar name={company?.name || 'Inovae Agenda'} size="md" className="rounded-xl shadow-xs" />
            )}
            <div>
              <h1 className="font-display font-bold text-base text-foreground leading-tight">
                {company?.name}
              </h1>
              {company?.phone && (
                <span className="text-[11px] text-foreground-muted flex items-center gap-1">
                  <Phone size={11} className="text-accent" /> {company.phone}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Flow Container */}
      <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 flex-1 w-full animate-fade-in">
        {/* Stepper Alvore (6 passos) */}
        <div className="flex items-center justify-between gap-1 mb-8">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isCompleted = i < step;
            const isCurrent = i === step;

            return (
              <div key={s.title} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition ${
                      isCompleted
                        ? 'border-accent bg-accent text-accent-foreground shadow-soft'
                        : isCurrent
                        ? 'border-accent bg-accent-soft text-accent ring-2 ring-accent/30'
                        : 'border-border text-foreground-subtle bg-surface'
                    }`}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span
                    className={`hidden text-[11px] font-medium sm:block text-center ${
                      i <= step ? 'text-foreground font-semibold' : 'text-foreground-subtle'
                    }`}
                  >
                    {s.title}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`mx-1 h-px flex-1 transition ${
                      i < step ? 'bg-accent' : 'bg-border'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Views */}
        <div className="mt-8">
          {/* ETAPA 0: PROCEDIMENTO */}
          {step === 0 && (
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
                Qual procedimento você quer?
              </h2>
              <p className="mt-1 text-sm text-foreground-muted">
                Escolha o atendimento desejado para continuar.
              </p>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-6">
                {services.map((s: any) => {
                  const isSelected = serviceId === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setServiceId(s.id)}
                      className={`card flex flex-col items-start p-5 text-left transition hover:-translate-y-0.5 hover:shadow-elevated cursor-pointer ${
                        isSelected ? 'border-accent ring-2 ring-accent/30 bg-accent-soft/20' : ''
                      }`}
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent shadow-xs mb-3">
                        <Flower2 className="h-5 w-5" />
                      </span>
                      <h3 className="font-semibold text-foreground text-base">{s.name}</h3>
                      {s.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-foreground-muted leading-relaxed">
                          {s.description}
                        </p>
                      )}
                      <div className="mt-4 flex w-full items-center justify-between border-t border-border pt-3">
                        <span className="font-display font-bold text-foreground text-base">
                          R$ {Number(s.price).toFixed(2)}
                        </span>
                        <span className="text-xs text-foreground-subtle">
                          {s.durationMinutes} min
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ETAPA 1: PROFISSIONAL */}
          {step === 1 && (
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
                Com quem você prefere?
              </h2>
              <p className="mt-1 text-sm text-foreground-muted">
                Selecione um profissional ou deixe conosco.
              </p>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-6">
                <button
                  type="button"
                  onClick={() => setProfessionalSel('any')}
                  className={`card flex flex-col items-center justify-center p-6 text-center transition hover:-translate-y-0.5 hover:shadow-elevated cursor-pointer ${
                    professionalSel === 'any' ? 'border-accent ring-2 ring-accent/30 bg-accent-soft/20' : ''
                  }`}
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-foreground-muted mb-3 shadow-xs">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <h3 className="font-semibold text-foreground text-sm">Qualquer profissional</h3>
                  <p className="mt-1 text-xs text-foreground-muted">O primeiro disponível na agenda</p>
                </button>

                {professionals.map((b: any) => {
                  const isSelected = professionalSel === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setProfessionalSel(b.id)}
                      className={`card flex flex-col items-center p-5 text-center transition hover:-translate-y-0.5 hover:shadow-elevated cursor-pointer ${
                        isSelected ? 'border-accent ring-2 ring-accent/30 bg-accent-soft/20' : ''
                      }`}
                    >
                      <Avatar name={b.name} src={b.photoUrl} size="lg" className="mb-2" />
                      <h3 className="mt-2 text-sm font-semibold text-foreground">{b.name}</h3>
                      {b.bio && (
                        <p className="mt-1 text-xs text-foreground-muted line-clamp-2">
                          {b.bio}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ETAPA 2: DATA */}
          {step === 2 && (
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
                Escolha a data
              </h2>
              <p className="mt-1 text-sm text-foreground-muted">
                Selecione o melhor dia para o seu atendimento.
              </p>

              <div className="mx-auto max-w-sm mt-6">
                <DatePicker value={date} onChange={setDate} />
              </div>
            </div>
          )}

          {/* ETAPA 3: HORÁRIO */}
          {step === 3 && (
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
                Horários disponíveis
              </h2>
              <p className="mt-1 text-sm text-foreground-muted">
                {service?.name} · {format(parseISO(date), "dd 'de' MMMM", { locale: ptBR })}
              </p>

              <div className="mt-6">
                {loadingSlots ? (
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="skeleton h-11 rounded-xl" />
                    ))}
                  </div>
                ) : slots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                    {slots.map((s: any) => {
                      const isSelected = selectedSlot?.time === s.time;
                      return (
                        <button
                          key={s.time}
                          type="button"
                          onClick={() => setSelectedSlot(s)}
                          className={`rounded-xl border py-3 text-sm font-semibold transition cursor-pointer ${
                            isSelected
                              ? 'border-accent bg-accent text-accent-foreground shadow-soft'
                              : 'border-border bg-surface text-foreground hover:border-accent hover:text-accent'
                          }`}
                        >
                          {s.time}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="card p-10 text-center space-y-3">
                    <Clock className="mx-auto h-8 w-8 text-foreground-subtle" />
                    <p className="font-semibold text-foreground text-sm">
                      Sem horários disponíveis nesta data
                    </p>
                    <p className="text-xs text-foreground-muted max-w-sm mx-auto">
                      Tente escolher outro dia ou selecione outro profissional.
                    </p>
                    <div className="flex justify-center gap-2 pt-2">
                      <button onClick={() => go(2)} className="btn-outline text-xs">
                        Trocar data
                      </button>
                      <button onClick={() => go(1)} className="btn-ghost text-xs">
                        Trocar profissional
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ETAPA 4: SEUS DADOS */}
          {step === 4 && (
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
                Seus dados
              </h2>
              <p className="mt-1 text-sm text-foreground-muted">
                Para confirmarmos e enviarmos lembretes pelo WhatsApp.
              </p>

              <div className="mx-auto max-w-md space-y-4 mt-6">
                <div>
                  <label className="label">Nome completo *</label>
                  <input
                    className="input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Como prefere ser chamado(a)?"
                    required
                  />
                </div>

                <div>
                  <label className="label">Telefone / WhatsApp *</label>
                  <input
                    className="input font-mono"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="(11) 99999-0000"
                    required
                  />
                </div>

                <div>
                  <label className="label">E-mail (opcional)</label>
                  <input
                    type="email"
                    className="input"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="voce@email.com"
                  />
                </div>

                <div>
                  <label className="label">Observações (opcional)</label>
                  <input
                    className="input"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Alguma preferência ou detalhe específico?"
                  />
                </div>

                {/* Cupom de desconto */}
                <div className="pt-2">
                  <label className="label">Cupom de Desconto</label>
                  <div className="flex gap-2">
                    <input
                      className="input uppercase font-mono text-xs"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="INSIRA SEU CUPOM"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={validatingCoupon || !couponCode.trim()}
                      className="btn-outline text-xs px-4"
                    >
                      {validatingCoupon ? <Loader2 size={13} className="animate-spin" /> : 'Aplicar'}
                    </button>
                  </div>
                  {appliedCoupon && (
                    <p className="text-xs text-success font-medium mt-1.5 flex items-center gap-1">
                      <Check size={12} /> Cupom aplicado! Desconto de R$ {Number(appliedCoupon.discountValue || 0).toFixed(2)}
                    </p>
                  )}
                  {couponError && (
                    <p className="text-xs text-danger font-medium mt-1.5">
                      {couponError}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ETAPA 5: CONFIRMAÇÃO */}
          {step === 5 && service && (
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
                Confira seu agendamento
              </h2>
              <p className="mt-1 text-sm text-foreground-muted">
                Tudo certo antes de confirmar.
              </p>

              <div className="mx-auto max-w-md mt-6">
                <div className="card p-6 shadow-soft">
                  <div className="flex items-center gap-3 border-b border-border pb-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-soft">
                      <Flower2 className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{service.name}</p>
                      <p className="text-xs text-foreground-muted">
                        {service.durationMinutes} min · R$ {Number(finalPrice).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <dl className="mt-4 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <dt className="text-foreground-muted">Profissional:</dt>
                      <dd className="font-semibold text-foreground">
                        {effectiveProfessional?.name || 'Primeiro disponível'}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-foreground-muted">Data:</dt>
                      <dd className="font-semibold text-foreground">
                        {format(parseISO(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-foreground-muted">Horário:</dt>
                      <dd className="font-semibold text-foreground">{selectedSlot?.time}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-foreground-muted">Cliente:</dt>
                      <dd className="font-semibold text-foreground">{form.name}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-foreground-muted">WhatsApp:</dt>
                      <dd className="font-semibold text-foreground font-mono">{form.phone}</dd>
                    </div>
                  </dl>

                  {company?.settings?.address && (
                    <div className="mt-4 pt-3 border-t border-border flex items-start gap-2 text-[11px] text-foreground-muted">
                      <MapPin size={13} className="text-accent shrink-0 mt-0.5" />
                      <span>{company.settings.address}</span>
                    </div>
                  )}
                </div>

                {error && (
                  <p className="mt-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-xs text-danger font-medium text-center">
                    {error}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation Buttons */}
        <div className="mt-10 flex items-center justify-between border-t border-border pt-6">
          <button
            type="button"
            onClick={() => go(Math.max(0, step - 1))}
            className={`btn-ghost text-xs ${step === 0 ? 'invisible pointer-events-none' : ''}`}
          >
            <ChevronLeft className="h-4 w-4" /> Voltar
          </button>

          {step < 5 ? (
            <button
              type="button"
              onClick={() => go(step + 1)}
              disabled={!canNext}
              className="btn-primary px-6 text-xs"
            >
              <span>Continuar</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmitBooking}
              disabled={submitting}
              className="btn-primary px-6 text-xs"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Confirmando...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Confirmar Agendamento</span>
                </>
              )}
            </button>
          )}
        </div>
      </main>

      {/* Public Footer */}
      <footer className="border-t border-border bg-surface mt-16 py-8">
        <div className="mx-auto max-w-5xl px-5 sm:px-8 text-center text-xs text-foreground-muted space-y-2">
          <p className="font-semibold text-foreground">{company?.name}</p>
          {company?.settings?.address && <p>{company.settings.address}</p>}
          <p className="text-[11px] text-foreground-subtle">
            Sistema de Agendamento Online powered by Inovae Agenda
          </p>
        </div>
      </footer>
    </div>
  );
};
