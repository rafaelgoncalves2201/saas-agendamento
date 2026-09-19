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

  const fetchAppointment = () => {
    if (!code) return;
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    axios
      .get(`${apiUrl}/public/appointments/${code}`)
      .then((res) => setAppointment(res.data))
      .catch(() => setError('Agendamento não encontrado.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAppointment();
  }, [code]);

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={36} />
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-center">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 max-w-md shadow-sm">
          <AlertCircle className="mx-auto text-red-500 mb-3" size={40} />
          <h2 className="text-xl font-bold text-slate-900 mb-1">Agendamento Não Encontrado</h2>
          <p className="text-xs text-slate-500">
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

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-start p-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
        <div className="text-center">
          <span
            className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-3 ${
              appointment.status === 'PENDING'
                ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                : appointment.status === 'CONFIRMED'
                ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300'
                : appointment.status === 'COMPLETED'
                ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                : 'bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300'
            }`}
          >
            {appointment.status === 'PENDING'
              ? 'Aguardando Confirmação'
              : appointment.status === 'CONFIRMED'
              ? 'Agendamento Confirmado'
              : appointment.status === 'COMPLETED'
              ? 'Atendimento Concluído'
              : 'Agendamento Cancelado'}
          </span>

          <h1 className="text-2xl font-black text-slate-900 dark:text-white">{appointment.company.name}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Código: {appointment.clientManagementCode.slice(0, 8)}</p>
        </div>

        {/* Alerta quando Aguardando Confirmação */}
        {appointment.status === 'PENDING' && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl text-xs text-amber-900 dark:text-amber-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
              <Clock size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Aguardando Confirmação</span>
            </div>
            <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
              Seu horário está pré-reservado. Se ainda não enviou o comprovante do sinal via Pix, envie pelo botão abaixo para que o profissional confirme a sua vaga.
            </p>
            {appointment.company.settings?.pixKey && (
              <div className="pt-1 text-[11px] font-mono bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Chave Pix:</span>
                  <span className="text-slate-900 dark:text-white font-bold">{appointment.company.settings.pixKey}</span>
                </div>
                {appointment.company.settings?.depositValue && (
                  <span className="text-xs font-black text-amber-800 dark:text-amber-300">
                    {appointment.company.settings.depositValue}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Detalhes do Atendimento */}
        <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3.5 text-xs">
          <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
            <Scissors size={18} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
            <div>
              <p className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold">Serviço</p>
              <p className="font-bold text-slate-900 dark:text-white text-sm">{appointment.service.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
            <User size={18} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
            <div>
              <p className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold">Profissional</p>
              <p className="font-bold text-slate-900 dark:text-white">{appointment.professional.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
            <Calendar size={18} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
            <div>
              <p className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold">Data & Horário</p>
              <p className="font-bold text-slate-900 dark:text-white">
                {dateFormatted} das {timeFormatted} às {endTimeFormatted} ({appointment.durationMinutes} min)
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
            <p className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold mb-0.5">Valor</p>
            <div className="flex items-baseline gap-2 flex-wrap">
              {appointment.originalPrice && Number(appointment.originalPrice) > Number(appointment.priceAtBooking) && (
                <span className="text-slate-400 dark:text-slate-500 line-through text-xs font-semibold">
                  R$ {Number(appointment.originalPrice).toFixed(2)}
                </span>
              )}
              <p className="font-black text-slate-900 dark:text-white text-base">
                R$ {Number(appointment.priceAtBooking).toFixed(2)}
              </p>
              {appointment.couponCode && (
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                  Cupom: {appointment.couponCode}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* WhatsApp do Estabelecimento */}
        <a
          href={`https://wa.me/55${appointment.company.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
            appointment.status === 'PENDING'
              ? `Olá! Gostaria de confirmar meu agendamento no *${appointment.company.name}*:\n\n*Serviço:* ${appointment.service.name}\n*Profissional:* ${appointment.professional.name}\n*Horário:* das ${timeFormatted} às ${endTimeFormatted} de ${dateFormatted}\n\nEstou enviando o comprovante do sinal via Pix para confirmação da minha vaga!`
              : `Olá! Gostaria de tirar uma dúvida sobre meu agendamento no *${appointment.company.name}* para o dia ${dateFormatted} das ${timeFormatted} às ${endTimeFormatted}.`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
        >
          <Phone size={15} />
          <span>{appointment.status === 'PENDING' ? 'Enviar Comprovante pelo WhatsApp' : 'Falar com Estabelecimento no WhatsApp'}</span>
        </a>

        {/* Cancel Action */}
        {appointment.status === 'CONFIRMED' && (
          <div className="pt-2 text-center">
            <button
              onClick={() => setCancelModalOpen(true)}
              className="text-xs text-red-600 dark:text-red-400 hover:underline font-semibold cursor-pointer"
            >
              Cancelar este agendamento
            </button>
          </div>
        )}
      </div>

      {/* Modal Cancelar */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Confirmar Cancelamento</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Por favor informe o motivo do cancelamento para avisarmos o profissional:
            </p>

            <form onSubmit={handleCancel} className="space-y-3">
              <textarea
                required
                rows={3}
                placeholder="Ex: Tive um imprevisto no trabalho..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  className="px-3.5 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-medium cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={cancelling}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
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

