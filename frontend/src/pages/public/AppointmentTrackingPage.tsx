import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Calendar,
  Clock,
  User,
  Scissors,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Phone,
  Loader2,
  X,
  Star,
  Copy,
  Check,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const AppointmentTrackingPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const [appointment, setAppointment] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);

  // Avaliação
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchAppointment = () => {
    if (!code) return;
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    axios
      .get(`${apiUrl}/public/appointments/${code}`)
      .then((res) => setAppointment(res.data))
      .catch(() => setError('Agendamento não encontrado.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setLoading(true);
    fetchAppointment();
  }, [code]);

  // Polling em tempo real se o agendamento estiver aguardando pagamento
  useEffect(() => {
    if (!code) return;
    if (appointment?.status !== 'PENDING' && appointment?.status !== 'PENDING_PAYMENT') return;

    const interval = setInterval(() => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      axios
        .get(`${apiUrl}/public/appointments/${code}`)
        .then((res) => {
          if (res.data?.status === 'CONFIRMED') {
            setAppointment(res.data);
          }
        })
        .catch(() => {});
    }, 3500);

    return () => clearInterval(interval);
  }, [code, appointment?.status]);

  const handleCopyPix = (key: string) => {
    if (!key) return;
    navigator.clipboard.writeText(key);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  const handleSubmitReview = async () => {
    if (!code) return;
    setSubmittingReview(true);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    try {
      await axios.post(`${apiUrl}/public/appointments/${code}/review`, {
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });
      fetchAppointment();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Falha ao enviar avaliação');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    setCancelling(true);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    try {
      await axios.post(`${apiUrl}/public/appointments/${code}/cancel`, {
        reason: cancelReason,
      });
      setCancelModalOpen(false);
      fetchAppointment();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Falha ao cancelar agendamento');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#6B3E26]" size={36} />
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#1A120D] flex items-center justify-center p-4 text-center">
        <div className="bg-white dark:bg-[#261E18] p-8 rounded-2xl border border-[#E2D9CC] dark:border-[#3D2C22] max-w-md shadow-sm">
          <AlertCircle className="mx-auto text-red-500 mb-3" size={40} />
          <h2 className="text-xl font-bold text-[#2B1D15] dark:text-[#F8F5EE] mb-1">Agendamento Não Encontrado</h2>
          <p className="text-xs text-[#6B3E26] dark:text-[#CDB196]">
            Verifique se o link está correto ou se o agendamento já expirou.
          </p>
        </div>
      </div>
    );
  }

  const start = new Date(appointment.startDateTime);
  const end = new Date(appointment.endDateTime);
  const dateFormatted = format(start, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const timeFormatted = format(start, 'HH:mm');
  const endTimeFormatted = format(end, 'HH:mm');
  const isDark = appointment.company?.settings?.publicTheme !== 'light';
  const primaryColor = appointment.company?.settings?.primaryColor || '#6B3E26';

  return (
    <div className="min-h-screen bg-[#F8F5EE] text-[#2B1D15] flex flex-col items-center justify-start p-4 py-12">
      <div className="w-full max-w-md bg-white border border-[#E2D9CC] rounded-3xl shadow-xl p-6 sm:p-8 space-y-6">
        <div className="text-center">
          <span
            className={`inline-block text-xs font-bold px-4 py-1.5 rounded-full mb-3 border ${
              appointment.status === 'PENDING' || appointment.status === 'PENDING_PAYMENT'
                ? 'bg-[#F5EFE6] border-[#CDB196] text-[#6B3E26]'
                : appointment.status === 'CONFIRMED'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : appointment.status === 'COMPLETED'
                ? 'bg-[#F0E6DC] border-[#6B3E26] text-[#6B3E26]'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            {appointment.status === 'PENDING' || appointment.status === 'PENDING_PAYMENT'
              ? 'Aguardando Pagamento do Sinal'
              : appointment.status === 'CONFIRMED'
              ? 'Agendamento Confirmado'
              : appointment.status === 'COMPLETED'
              ? 'Atendimento Concluído'
              : 'Agendamento Cancelado'}
          </span>

          <h1 className="text-2xl font-black text-[#2B1D15]">{appointment.company.name}</h1>
          <p className="text-xs text-[#796758] mt-0.5 font-mono">Código: {appointment.clientManagementCode.slice(0, 8)}</p>
        </div>

        {/* Alerta quando Aguardando Confirmação do Sinal / Pix */}
        {(appointment.status === 'PENDING' || appointment.status === 'PENDING_PAYMENT') && (
          <div className="p-5 bg-[#FAF5ED] border border-[#E5D7C5] rounded-3xl text-xs space-y-4 shadow-xs">
            <div className="flex items-center gap-2 font-bold text-[#6B3E26]">
              <Clock size={18} className="text-[#6B3E26] shrink-0" />
              <span className="text-sm font-extrabold">Aguardando Pagamento do Sinal</span>
            </div>
            <p className="text-xs text-[#5A4A3E] leading-relaxed">
              Seu horário está reservado temporariamente. Efetue o pagamento do sinal via Pix abaixo para que a sua vaga seja confirmada imediatamente.
            </p>

            {/* QR Code Pix Mercado Pago se disponível */}
            {appointment.pixQrCodeBase64 && (
              <div className="p-4 bg-white rounded-2xl border border-[#E2D9CC] text-center space-y-2.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#6B3E26] block">
                  QR Code Pix Mercado Pago
                </span>
                <img
                  src={`data:image/png;base64,${appointment.pixQrCodeBase64}`}
                  alt="QR Code Pix"
                  className="w-44 h-44 mx-auto rounded-xl object-contain border border-[#E2D9CC] p-1"
                />
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-[10px] font-bold text-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Aguardando Pix... Confirmação automática</span>
                </div>
              </div>
            )}

            {/* Chave Pix ou Copia e Cola */}
            {(appointment.pixCopiaECola || appointment.company.settings?.pixKey) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#796758] font-bold uppercase tracking-wider text-[10px]">
                    {appointment.pixCopiaECola ? 'Código Pix Copia e Cola:' : 'Chave Pix:'}
                  </span>
                  {appointment.depositAmount ? (
                    <span className="text-xs font-black text-[#6B3E26] bg-[#F5EFE6] px-2.5 py-0.5 rounded-md border border-[#E2CEBC]">
                      Sinal: R$ {Number(appointment.depositAmount).toFixed(2)}
                    </span>
                  ) : appointment.company.settings?.depositValue ? (
                    <span className="text-xs font-black text-[#6B3E26] bg-[#F5EFE6] px-2.5 py-0.5 rounded-md border border-[#E2CEBC]">
                      Sinal: {appointment.company.settings.depositValue}
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={appointment.pixCopiaECola || appointment.company.settings?.pixKey || ''}
                    className="w-full px-3 py-2 bg-white border border-[#D0C3B2] rounded-xl font-mono text-xs font-bold text-[#2B1D15] select-all truncate"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyPix(appointment.pixCopiaECola || appointment.company.settings?.pixKey)}
                    className="px-3.5 py-2 bg-[#6B3E26] hover:bg-[#56311D] text-white rounded-xl font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer text-xs"
                  >
                    {copiedPix ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedPix ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Detalhes do Atendimento */}
        <div className="p-5 bg-[#FAF8F5] rounded-2xl border border-[#E2D9CC] space-y-3.5 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#F0E6DC] text-[#6B3E26] flex items-center justify-center shrink-0">
              <Scissors size={16} />
            </div>
            <div>
              <p className="text-[#796758] text-[10px] uppercase font-bold tracking-wider">Serviço</p>
              <p className="font-bold text-[#2B1D15] text-sm">{appointment.service.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#F0E6DC] text-[#6B3E26] flex items-center justify-center shrink-0">
              <User size={16} />
            </div>
            <div>
              <p className="text-[#796758] text-[10px] uppercase font-bold tracking-wider">Profissional</p>
              <p className="font-bold text-[#2B1D15]">{appointment.professional.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#F0E6DC] text-[#6B3E26] flex items-center justify-center shrink-0">
              <Calendar size={16} />
            </div>
            <div>
              <p className="text-[#796758] text-[10px] uppercase font-bold tracking-wider">Data & Horário</p>
              <p className="font-bold text-[#2B1D15]">
                {dateFormatted} das {timeFormatted} às {endTimeFormatted} ({appointment.durationMinutes} min)
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E2D9CC] flex items-center justify-between">
            <div>
              <p className="text-[#796758] text-[10px] uppercase font-bold">Valor do Serviço</p>
              <div className="flex items-baseline gap-2 flex-wrap">
                {appointment.originalPrice && Number(appointment.originalPrice) > Number(appointment.priceAtBooking) && (
                  <span className="text-[#9C8B7D] line-through text-xs font-semibold">
                    R$ {Number(appointment.originalPrice).toFixed(2)}
                  </span>
                )}
                <p className="font-black text-[#2B1D15] text-lg">
                  R$ {Number(appointment.priceAtBooking).toFixed(2)}
                </p>
              </div>
            </div>
            {appointment.couponCode && (
              <span className="text-[11px] font-bold text-[#6B3E26] bg-[#F0E6DC] border border-[#CDB196] px-2.5 py-1 rounded-full">
                Cupom: {appointment.couponCode}
              </span>
            )}
          </div>
        </div>

        {/* Avaliação do Atendimento */}
        {appointment.status !== 'CANCELLED' && (
          <div className="p-5 bg-[#FAF8F5] rounded-2xl border border-[#E2D9CC] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[#2B1D15] text-sm flex items-center gap-1.5">
                <Star size={16} className="text-[#6B3E26] fill-[#6B3E26]" />
                {appointment.review ? 'Sua Avaliação' : 'Avalie seu Atendimento'}
              </h3>
              {appointment.review && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Avaliado
                </span>
              )}
            </div>

            {appointment.review ? (
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={18}
                      className={
                        star <= appointment.review.rating
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-[#D0C3B2]'
                      }
                    />
                  ))}
                  <span className="ml-2 font-bold text-xs text-[#2B1D15]">
                    {appointment.review.rating}.0 / 5
                  </span>
                </div>
                {appointment.review.comment && (
                  <p className="text-xs text-[#5A4A3E] italic bg-white p-3 rounded-xl border border-[#E2D9CC]">
                    "{appointment.review.comment}"
                  </p>
                )}
                <p className="text-[11px] text-[#796758]">Obrigado pelo seu feedback! Ele nos ajuda a manter a excelência.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-[#796758]">
                  Como foi ou está sendo sua experiência com {appointment.company.name}?
                </p>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 rounded-lg hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        size={24}
                        className={
                          star <= reviewRating
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-[#D0C3B2]'
                        }
                      />
                    </button>
                  ))}
                  <span className="ml-1 text-xs font-bold text-[#6B3E26]">
                    {reviewRating === 5
                      ? 'Excelente (5 estrelas)'
                      : reviewRating === 4
                      ? 'Muito Bom (4 estrelas)'
                      : reviewRating === 3
                      ? 'Bom (3 estrelas)'
                      : reviewRating === 2
                      ? 'Regular (2 estrelas)'
                      : 'Ruim (1 estrela)'}
                  </span>
                </div>

                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Escreva um comentário sobre o atendimento (opcional)..."
                  rows={2}
                  className="w-full text-xs p-3 bg-white border border-[#E2D9CC] rounded-xl text-[#2B1D15] placeholder:text-[#9C8B7D] focus:outline-none focus:border-[#6B3E26] focus:ring-1 focus:ring-[#6B3E26] transition-all resize-none"
                />

                <button
                  type="button"
                  onClick={handleSubmitReview}
                  disabled={submittingReview}
                  className="w-full py-2.5 bg-[#6B3E26] hover:bg-[#54311E] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {submittingReview ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Enviando avaliação...</span>
                    </>
                  ) : (
                    <>
                      <Star size={14} />
                      <span>Enviar Minha Avaliação</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* WhatsApp do Estabelecimento */}
        <a
          href={`https://wa.me/55${appointment.company.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
            appointment.status === 'PENDING'
              ? `Olá! Gostaria de confirmar meu agendamento no *${appointment.company.name}*:\n\n*Serviço:* ${appointment.service.name}\n*Profissional:* ${appointment.professional.name}\n*Horário:* das ${timeFormatted} às ${endTimeFormatted} de ${dateFormatted}\n\nEstou enviando o comprovante do sinal via Pix para confirmação da minha vaga!`
              : `Olá! Gostaria de tirar uma dúvida sobre meu agendamento no *${appointment.company.name}* para o dia ${dateFormatted} das ${timeFormatted} às ${endTimeFormatted}.`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg cursor-pointer"
        >
          <Phone size={16} />
          <span>{appointment.status === 'PENDING' ? 'Enviar Comprovante pelo WhatsApp' : 'Falar com Estabelecimento no WhatsApp'}</span>
        </a>

        {/* Cancel Action */}
        {appointment.status === 'CONFIRMED' && (
          <div className="pt-2 text-center">
            <button
              onClick={() => setCancelModalOpen(true)}
              className="text-xs text-red-600 hover:underline font-semibold cursor-pointer"
            >
              Cancelar este agendamento
            </button>
          </div>
        )}
      </div>

      {/* Modal Cancelar */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#120D0A]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2D9CC] rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-[#2B1D15] text-base">Confirmar Cancelamento</h3>
            <p className="text-xs text-[#796758]">
              Por favor informe o motivo do cancelamento para avisarmos o profissional:
            </p>

            <form onSubmit={handleCancel} className="space-y-3">
              <textarea
                required
                rows={3}
                placeholder="Ex: Tive um imprevisto no trabalho..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-3 bg-[#FAF8F5] border border-[#E2D9CC] text-[#2B1D15] rounded-xl text-xs focus:ring-2 focus:ring-[#6B3E26] focus:outline-none"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  className="px-4 py-2 text-[#796758] hover:bg-[#F8F5EE] rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={cancelling}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {cancelling ? <Loader2 className="animate-spin" size={14} /> : 'Sim, Cancelar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

