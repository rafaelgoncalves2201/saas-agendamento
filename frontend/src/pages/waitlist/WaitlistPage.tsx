import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import {
  Clock,
  User,
  Calendar,
  CheckCircle2,
  XCircle,
  Phone,
  MessageCircle,
  Trash2,
  Loader2,
  AlertCircle,
  Scissors,
  Filter,
  Check,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const WaitlistPage: React.FC = () => {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [company, setCompany] = useState<any>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchEntries = () => {
    setLoading(true);
    const params = statusFilter !== 'ALL' ? { status: statusFilter } : {};
    Promise.all([
      api.get('/waitlist', { params }),
      api.get('/companies/my-company'),
    ])
      .then(([waitlistRes, companyRes]) => {
        setEntries(waitlistRes.data);
        setCompany(companyRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEntries();
  }, [statusFilter]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      await api.patch(`/waitlist/${id}/status`, { status: newStatus });
      fetchEntries();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao atualizar status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Deseja realmente remover este cliente da lista de espera?')) return;
    try {
      await api.delete(`/waitlist/${id}`);
      fetchEntries();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao remover');
    }
  };

  const handleOpenWhatsApp = (entry: any) => {
    const phone = entry.clientPhone.replace(/\D/g, '');
    const serviceName = entry.service?.name ? `o procedimento "${entry.service.name}"` : 'seu atendimento';
    const companyName = company?.name || 'Inova Agenda';
    const text = encodeURIComponent(
      `Olá ${entry.clientName}, tudo bem? Aqui é da ${companyName}! Vimos que você estava na nossa lista de espera. Abriu uma vaga para ${serviceName}! Gostaria de aproveitar esse horário?`,
    );
    window.open(`https://wa.me/55${phone}?text=${text}`, '_blank');
    // Automaticamente sugere marcar como Notificado se estiver pendente
    if (entry.status === 'PENDING') {
      handleUpdateStatus(entry.id, 'NOTIFIED');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FAF5ED] dark:bg-[#34241B] text-[#6B3E26] dark:text-[#E2CEBC] border border-[#CDB196] dark:border-[#523A2C]">
            Aguardando Vaga
          </span>
        );
      case 'NOTIFIED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Cliente Notificado
          </span>
        );
      case 'BOOKED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Agendamento Realizado
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200">
            Desistência / Cancelado
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2B1D15] dark:text-[#F8F5EE]">Lista de Espera</h1>
          <p className="text-sm text-[#796758] dark:text-[#CDB196] mt-0.5">
            Gerencie clientes aguardando vagas ou desistências de horários e acione pelo WhatsApp com 1 clique.
          </p>
        </div>

        {/* Filtros de Status */}
        <div className="flex items-center gap-1.5 p-1 bg-[#FAF8F5] dark:bg-[#261E18] rounded-xl border border-[#E2D9CC] dark:border-[#3D2C22] overflow-x-auto">
          {[
            { id: 'ALL', label: 'Todos' },
            { id: 'PENDING', label: 'Pendentes' },
            { id: 'NOTIFIED', label: 'Notificados' },
            { id: 'BOOKED', label: 'Agendados' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === f.id
                  ? 'bg-[#6B3E26] text-white shadow-xs'
                  : 'text-[#796758] dark:text-[#CDB196] hover:text-[#2B1D15] dark:hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Clientes */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-[#6B3E26]" size={32} />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#1F1712] rounded-3xl border border-[#E2D9CC] dark:border-[#382A21] p-8 shadow-xs">
          <Clock size={40} className="mx-auto text-[#796758] dark:text-[#CDB196] mb-3 opacity-60" />
          <h3 className="font-bold text-[#2B1D15] dark:text-[#F8F5EE] text-base">Nenhum cliente na lista de espera</h3>
          <p className="text-xs text-[#796758] dark:text-[#CDB196] mt-1 max-w-sm mx-auto">
            Quando seus horários estiverem concorridos, os clientes poderão solicitar entrada na fila diretamente pela sua página pública.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {entries.map((entry) => {
            const isUpdating = updatingId === entry.id;
            return (
              <div
                key={entry.id}
                className="bg-white dark:bg-[#1F1712] border border-[#E2D9CC] dark:border-[#382A21] rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-[#2B1D15] dark:text-[#F8F5EE] text-base">{entry.clientName}</h3>
                      <span className="flex items-center gap-1.5 text-xs text-[#796758] dark:text-[#CDB196] mt-0.5">
                        <Phone size={12} className="text-[#6B3E26]" /> {entry.clientPhone}
                      </span>
                    </div>
                    {getStatusBadge(entry.status)}
                  </div>

                  <div className="p-3 bg-[#FAF8F5] dark:bg-[#251C16] rounded-xl border border-[#E2D9CC] dark:border-[#382A21] text-xs space-y-1.5">
                    {entry.service && (
                      <div className="flex items-center justify-between text-[#2B1D15] dark:text-[#FAF7F2]">
                        <span className="text-[#796758] dark:text-[#CDB196] flex items-center gap-1">
                          <Scissors size={13} /> Procedimento:
                        </span>
                        <strong className="truncate max-w-[150px]">{entry.service.name}</strong>
                      </div>
                    )}

                    {entry.professional && (
                      <div className="flex items-center justify-between text-[#2B1D15] dark:text-[#FAF7F2]">
                        <span className="text-[#796758] dark:text-[#CDB196] flex items-center gap-1">
                          <User size={13} /> Especialista:
                        </span>
                        <strong>{entry.professional.name}</strong>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[#2B1D15] dark:text-[#FAF7F2]">
                      <span className="text-[#796758] dark:text-[#CDB196] flex items-center gap-1">
                        <Calendar size={13} /> Preferência:
                      </span>
                      <strong>
                        {entry.preferredDate
                          ? format(new Date(entry.preferredDate), "dd 'de' MMM", { locale: ptBR })
                          : 'Qualquer data'}{' '}
                        ({entry.preferredPeriod || 'Qualquer'})
                      </strong>
                    </div>

                    {entry.notes && (
                      <p className="text-[11px] text-[#796758] dark:text-[#CDB196] pt-1.5 border-t border-[#E2D9CC] dark:border-[#382A21] italic">
                        "{entry.notes}"
                      </p>
                    )}
                  </div>

                  <span className="text-[10px] text-[#796758] dark:text-[#CDB196] block">
                    Cadastrado em:{' '}
                    {format(new Date(entry.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>

                {/* Ações */}
                <div className="pt-4 mt-4 border-t border-[#EFE9DF] dark:border-[#33251D] flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenWhatsApp(entry)}
                    className="flex-1 py-2 px-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <MessageCircle size={15} />
                    <span>Chamar no WhatsApp</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {entry.status !== 'BOOKED' && (
                      <button
                        onClick={() => handleUpdateStatus(entry.id, 'BOOKED')}
                        disabled={isUpdating}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl transition-colors cursor-pointer border border-[#E2D9CC] dark:border-[#382A21]"
                        title="Marcar como Agendado"
                      >
                        <Check size={16} />
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="p-2 text-[#796758] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors cursor-pointer border border-[#E2D9CC] dark:border-[#382A21]"
                      title="Excluir da lista"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

