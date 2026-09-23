import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Trash2,
  CheckCircle2,
  Tag,
} from 'lucide-react';
import { ActionConfirmationModal } from '../../components/ActionConfirmationModal';
import { DeleteConfirmationModal } from '../../components/DeleteConfirmationModal';

export const AppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Action modals states
  const [appointmentToApprove, setAppointmentToApprove] = useState<any | null>(null);
  const [approving, setApproving] = useState(false);

  const [appointmentToCancel, setAppointmentToCancel] = useState<any | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const [appointmentToComplete, setAppointmentToComplete] = useState<any | null>(null);
  const [completing, setCompleting] = useState(false);

  const [appointmentToDelete, setAppointmentToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Reschedule state
  const [appointmentToReschedule, setAppointmentToReschedule] = useState<any | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleProfId, setRescheduleProfId] = useState('');
  const [rescheduling, setRescheduling] = useState(false);

  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const fetchAppointments = () => {
    setLoading(true);
    const query = statusFilter !== 'ALL' ? `?status=${statusFilter}` : '';
    Promise.all([
      api.get(`/appointments${query}`),
      api.get('/professionals'),
    ])
      .then(([appRes, profRes]) => {
        setAppointments(appRes.data);
        setProfessionals(profRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter]);

  const handleOpenReschedule = (app: any) => {
    setAppointmentToReschedule(app);
    const start = new Date(app.startDateTime);
    const yyyy = start.getFullYear();
    const mm = String(start.getMonth() + 1).padStart(2, '0');
    const dd = String(start.getDate()).padStart(2, '0');
    const hh = String(start.getHours()).padStart(2, '0');
    const min = String(start.getMinutes()).padStart(2, '0');
    setRescheduleDate(`${yyyy}-${mm}-${dd}`);
    setRescheduleTime(`${hh}:${min}`);
    setRescheduleProfId(app.professionalId);
  };

  const handleConfirmReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentToReschedule || !rescheduleDate || !rescheduleTime) return;
    setRescheduling(true);

    try {
      const combinedDateTime = new Date(`${rescheduleDate}T${rescheduleTime}:00`).toISOString();
      await api.patch(`/appointments/${appointmentToReschedule.id}/reschedule`, {
        startDateTime: combinedDateTime,
        professionalId: rescheduleProfId || undefined,
      });

      setAppointmentToReschedule(null);
      showFeedback('success', 'Atendimento reagendado com sucesso! O cliente foi notificado no WhatsApp com o novo horário.');
      fetchAppointments();
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'Erro ao reagendar atendimento.');
    } finally {
      setRescheduling(false);
    }
  };

  const handleConfirmApprove = async () => {
    if (!appointmentToApprove) return;
    setApproving(true);
    try {
      await api.patch(`/appointments/${appointmentToApprove.id}/status`, {
        status: 'CONFIRMED',
      });
      setAppointmentToApprove(null);
      showFeedback(
        'success',
        'Sinal via Pix aprovado com sucesso! O agendamento está confirmado e o cliente foi notificado no WhatsApp.',
      );
      fetchAppointments();
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'Erro ao aprovar sinal do agendamento.');
    } finally {
      setApproving(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!appointmentToCancel) return;
    setCancelling(true);
    try {
      await api.patch(`/appointments/${appointmentToCancel.id}/status`, {
        status: 'CANCELLED',
        cancellationReason: cancellationReason.trim() || undefined,
      });
      setAppointmentToCancel(null);
      setCancellationReason('');
      showFeedback('success', 'Agendamento cancelado com sucesso. Horário liberado na agenda.');
      fetchAppointments();
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'Erro ao cancelar o agendamento.');
    } finally {
      setCancelling(false);
    }
  };

  const handleConfirmComplete = async () => {
    if (!appointmentToComplete) return;
    setCompleting(true);
    try {
      await api.patch(`/appointments/${appointmentToComplete.id}/status`, {
        status: 'COMPLETED',
      });
      setAppointmentToComplete(null);
      showFeedback('success', 'Atendimento concluído com sucesso! Registro salvo no histórico e faturamento.');
      fetchAppointments();
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'Erro ao concluir o agendamento.');
    } finally {
      setCompleting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!appointmentToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/appointments/${appointmentToDelete.id}`);
      setAppointmentToDelete(null);
      showFeedback('success', 'Registro de agendamento excluído com sucesso.');
      fetchAppointments();
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'Erro ao excluir agendamento.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Agendamentos</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Gerencie, aprove sinais via Pix e atualize os atendimentos da sua equipe.
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-x-auto">
          {[
            { key: 'ALL', label: 'Todos' },
            { key: 'PENDING', label: 'Aguardando Sinal' },
            { key: 'CONFIRMED', label: 'Confirmados' },
            { key: 'COMPLETED', label: 'Concluídos' },
            { key: 'CANCELLED', label: 'Cancelados' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === tab.key
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-slate-600 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-xs">
          <CalendarIcon className="mx-auto text-slate-300 dark:text-slate-600 mb-3" size={48} />
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base">Nenhum agendamento encontrado</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {statusFilter === 'ALL'
              ? 'Compartilhe o link da sua página pública para que seus clientes comecem a agendar horários online.'
              : `Nenhum agendamento com status "${statusFilter}".`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {appointments.map((app) => {
            const start = new Date(app.startDateTime);
            const end = new Date(app.endDateTime);
            const dateStr = start.toLocaleDateString('pt-BR');
            const timeStr = start.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            });
            const endTimeStr = end.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={app.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          app.status === 'PENDING'
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : app.status === 'CONFIRMED'
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900'
                            : app.status === 'COMPLETED'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900'
                            : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-900'
                        }`}
                      >
                        {app.status === 'PENDING'
                          ? 'Aguardando Sinal'
                          : app.status === 'CONFIRMED'
                          ? 'Confirmado'
                          : app.status === 'COMPLETED'
                          ? 'Concluído'
                          : 'Cancelado'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 dark:text-slate-100 text-sm">
                        R$ {Number(app.priceAtBooking).toFixed(2)}
                      </span>
                      <button
                        onClick={() => setAppointmentToDelete(app)}
                        className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Excluir este agendamento do histórico"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-2">{app.service?.name}</h3>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 mb-4">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-slate-400" />
                      <span>
                        {dateStr} das <strong>{timeStr}</strong> às <strong>{endTimeStr}</strong> ({app.durationMinutes} min)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <User size={14} className="text-slate-400" />
                      <span>
                        <strong>Cliente:</strong> {app.client?.name} ({app.client?.phone})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <User size={14} className="text-indigo-500" />
                      <span>
                        <strong>Profissional:</strong> {app.professional?.name}
                      </span>
                    </div>

                    {app.couponCode && (
                      <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-lg w-fit text-[11px] font-semibold mt-1">
                        <Tag size={12} className="text-emerald-600 shrink-0" />
                        <span>Cupom: <strong>{app.couponCode}</strong> {app.discountAmount ? `(-R$ ${Number(app.discountAmount).toFixed(2)})` : ''}</span>
                      </div>
                    )}

                    {app.notes && (
                      <p className="mt-2 p-2 bg-slate-50 rounded-lg text-slate-500 italic text-[11px]">
                        Obs: "{app.notes}"
                      </p>
                    )}

                    {app.cancellationReason && (
                      <p className="mt-2 p-2 bg-red-50 border border-red-100 rounded-lg text-red-600 text-[11px]">
                        Motivo do cancelamento: {app.cancellationReason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {app.status === 'PENDING' && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setAppointmentToCancel(app);
                          setCancellationReason('Sinal Pix não enviado no prazo estipulado');
                        }}
                        className="px-2.5 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                      >
                        Recusar
                      </button>
                      <button
                        onClick={() => handleOpenReschedule(app)}
                        className="px-2.5 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors cursor-pointer flex items-center gap-1 border border-indigo-200 dark:border-indigo-800"
                        title="Reagendar horário"
                      >
                        <Clock size={12} />
                        <span>Reagendar</span>
                      </button>
                    </div>
                    <button
                      onClick={() => setAppointmentToApprove(app)}
                      className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs shadow-emerald-200 dark:shadow-none cursor-pointer"
                    >
                      <CheckCircle2 size={14} />
                      <span>Aprovar Sinal</span>
                    </button>
                  </div>
                )}

                {app.status === 'CONFIRMED' && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setAppointmentToCancel(app);
                          setCancellationReason('');
                        }}
                        className="px-2.5 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleOpenReschedule(app)}
                        className="px-2.5 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors cursor-pointer flex items-center gap-1 border border-indigo-200 dark:border-indigo-800"
                        title="Reagendar horário"
                      >
                        <Clock size={12} />
                        <span>Reagendar</span>
                      </button>
                    </div>
                    <button
                      onClick={() => setAppointmentToComplete(app)}
                      className="px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs shadow-indigo-200 dark:shadow-none cursor-pointer"
                    >
                      <CheckCircle size={14} />
                      <span>Concluir</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Caixa Personalizada para Aprovação do Sinal */}
      <ActionConfirmationModal
        isOpen={!!appointmentToApprove}
        onClose={() => setAppointmentToApprove(null)}
        onConfirm={handleConfirmApprove}
        title="Aprovar Sinal via Pix"
        description="Você confirma que conferiu o recebimento do Pix referente ao sinal deste agendamento? O horário será confirmado e o cliente receberá a confirmação definitiva no WhatsApp."
        itemName={
          appointmentToApprove
            ? `${appointmentToApprove.service?.name} com ${appointmentToApprove.professional?.name} — Cliente: ${appointmentToApprove.client?.name}`
            : undefined
        }
        loading={approving}
        confirmText="Sim, Aprovar e Confirmar Horário"
        cancelText="Voltar"
        variant="success"
      />

      {/* Caixa Personalizada para Cancelamento de Agendamento */}
      <ActionConfirmationModal
        isOpen={!!appointmentToCancel}
        onClose={() => setAppointmentToCancel(null)}
        onConfirm={handleConfirmCancel}
        title="Cancelar / Recusar Agendamento"
        description="Tem certeza que deseja cancelar este agendamento? O horário voltará a ficar vago para outros clientes no link público."
        itemName={
          appointmentToCancel
            ? `${appointmentToCancel.service?.name} com ${appointmentToCancel.professional?.name} — Cliente: ${appointmentToCancel.client?.name}`
            : undefined
        }
        loading={cancelling}
        confirmText="Sim, Cancelar Horário"
        cancelText="Voltar"
        variant="danger"
        showReasonInput={true}
        reasonValue={cancellationReason}
        onReasonChange={setCancellationReason}
        reasonPlaceholder="Ex: Sinal não enviado, imprevisto do cliente..."
      />

      {/* Caixa Personalizada para Conclusão de Agendamento */}
      <ActionConfirmationModal
        isOpen={!!appointmentToComplete}
        onClose={() => setAppointmentToComplete(null)}
        onConfirm={handleConfirmComplete}
        title="Concluir Atendimento"
        description="Confirmar que o atendimento foi realizado com sucesso? O valor será contabilizado no faturamento do seu painel."
        itemName={
          appointmentToComplete
            ? `${appointmentToComplete.service?.name} (R$ ${Number(appointmentToComplete.priceAtBooking).toFixed(2)}) — Cliente: ${appointmentToComplete.client?.name}`
            : undefined
        }
        loading={completing}
        confirmText="Confirmar Atendimento Concluído"
        cancelText="Voltar"
        variant="success"
      />

      {/* Caixa Personalizada para Exclusão Definitiva de Registro */}
      <DeleteConfirmationModal
        isOpen={!!appointmentToDelete}
        onClose={() => setAppointmentToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir Registro de Agendamento"
        description="Deseja remover permanentemente este registro da sua listagem de agendamentos?"
        itemName={
          appointmentToDelete
            ? `${appointmentToDelete.service?.name} (${appointmentToDelete.client?.name})`
            : undefined
        }
        loading={deleting}
        confirmButtonText="Excluir Permanentemente"
      />

      {/* Modal de Reagendamento de Atendimento */}
      {appointmentToReschedule && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <CalendarIcon size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Reagendar Atendimento</h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    {appointmentToReschedule.client?.name} — {appointmentToReschedule.service?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAppointmentToReschedule(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmReschedule} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                <p>
                  <strong>Horário Atual:</strong> {new Date(appointmentToReschedule.startDateTime).toLocaleDateString('pt-BR')} às{' '}
                  {new Date(appointmentToReschedule.startDateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p>
                  <strong>Duração do Procedimento:</strong> {appointmentToReschedule.service?.durationMinutes} min
                </p>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Nova Data *</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().slice(0, 10)}
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Novo Horário de Início *</label>
                <input
                  type="time"
                  required
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                />
              </div>

              {professionals.length > 1 && (
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Profissional Responsável</label>
                  <select
                    value={rescheduleProfId}
                    onChange={(e) => setRescheduleProfId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {professionals.map((prof) => (
                      <option key={prof.id} value={prof.id}>
                        {prof.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAppointmentToReschedule(null)}
                  className="px-3.5 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={rescheduling}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm shadow-indigo-200 dark:shadow-none cursor-pointer disabled:opacity-50"
                >
                  {rescheduling ? <Loader2 className="animate-spin" size={14} /> : 'Confirmar Reagendamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
