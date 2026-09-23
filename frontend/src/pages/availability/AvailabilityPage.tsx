import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Clock, Save, Loader2, CheckCircle2, Plus, Trash2, AlertCircle } from 'lucide-react';
import { DeleteConfirmationModal } from '../../components/DeleteConfirmationModal';

const DAYS_OF_WEEK = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

interface ShiftInterval {
  id: string;
  startTime: string;
  endTime: string;
}

interface DayAvailability {
  dayOfWeek: number;
  isActive: boolean;
  shifts: ShiftInterval[];
}

const getDefaultDays = (): DayAvailability[] => [0, 1, 2, 3, 4, 5, 6].map((dayNum) => ({
  dayOfWeek: dayNum,
  isActive: dayNum >= 1 && dayNum <= 5,
  shifts: [
    { id: `${dayNum}-shift-1`, startTime: '08:00', endTime: '12:00' },
    { id: `${dayNum}-shift-2`, startTime: '13:00', endTime: '18:00' },
  ],
}));

export const AvailabilityPage: React.FC = () => {
  // Inicialização garantida com todos os 7 dias da semana para nunca ficar vazia
  const [days, setDays] = useState<DayAvailability[]>(getDefaultDays);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal para confirmar remoção de turno
  const [shiftToRemove, setShiftToRemove] = useState<{ dayIndex: number; shiftIndex: number; timeRange: string } | null>(null);

  const fetchAvailability = () => {
    setLoading(true);
    setErrorMessage(null);
    api.get('/availability')
      .then((res) => {
        const rawList: any[] = Array.isArray(res.data) ? res.data : [];

        // Inicializar os 7 dias da semana garantidos
        const weekDays: DayAvailability[] = [0, 1, 2, 3, 4, 5, 6].map((dayNum) => {
          const itemsForDay = rawList.filter((item) => item.dayOfWeek === dayNum);

          if (itemsForDay.length > 0) {
            // Verificar se pelo menos um registro do dia é ativo
            const hasActive = itemsForDay.some((item) => item.isActive);
            const activeItems = itemsForDay.filter((item) => item.isActive);

            if (hasActive && activeItems.length > 0) {
              const shifts: ShiftInterval[] = [];

              activeItems.forEach((item, idx) => {
                if (item.breakStart && item.breakEnd) {
                  shifts.push({
                    id: `${dayNum}-${idx}-1`,
                    startTime: item.startTime,
                    endTime: item.breakStart,
                  });
                  shifts.push({
                    id: `${dayNum}-${idx}-2`,
                    startTime: item.breakEnd,
                    endTime: item.endTime,
                  });
                } else {
                  shifts.push({
                    id: `${dayNum}-${idx}`,
                    startTime: item.startTime,
                    endTime: item.endTime,
                  });
                }
              });

              return {
                dayOfWeek: dayNum,
                isActive: true,
                shifts: shifts.length > 0 ? shifts : [
                  { id: `${dayNum}-default`, startTime: '08:00', endTime: '18:00' }
                ],
              };
            }

            // O dia tem registro no banco mas está inativo/fechado
            return {
              dayOfWeek: dayNum,
              isActive: false,
              shifts: [
                { id: `${dayNum}-shift-1`, startTime: '08:00', endTime: '12:00' },
                { id: `${dayNum}-shift-2`, startTime: '13:00', endTime: '18:00' },
              ],
            };
          }

          // Padrão caso não haja registro cadastrado
          const isDefaultWorkday = dayNum >= 1 && dayNum <= 5;
          return {
            dayOfWeek: dayNum,
            isActive: isDefaultWorkday,
            shifts: [
              { id: `${dayNum}-shift-1`, startTime: '08:00', endTime: '12:00' },
              { id: `${dayNum}-shift-2`, startTime: '13:00', endTime: '18:00' },
            ],
          };
        });

        setDays(weekDays);
      })
      .catch((err) => {
        console.error('Erro ao buscar disponibilidade:', err);
        setDays((prev) => (prev && prev.length === 7 ? prev : getDefaultDays()));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAvailability();
  }, []);

  const handleToggleDay = (dayIndex: number, isActive: boolean) => {
    setDays((prev) => {
      const next = [...prev];
      next[dayIndex] = { ...next[dayIndex], isActive };
      return next;
    });
  };

  const handleUpdateShift = (
    dayIndex: number,
    shiftIndex: number,
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    setDays((prev) => {
      const next = [...prev];
      const shifts = [...next[dayIndex].shifts];
      shifts[shiftIndex] = { ...shifts[shiftIndex], [field]: value };
      next[dayIndex] = { ...next[dayIndex], shifts };
      return next;
    });
  };

  const handleAddShift = (dayIndex: number) => {
    setDays((prev) => {
      const next = [...prev];
      const shifts = [...next[dayIndex].shifts];
      
      const lastShift = shifts[shifts.length - 1];
      let newStart = '14:00';
      let newEnd = '18:00';

      if (lastShift) {
        const [h, m] = lastShift.endTime.split(':').map(Number);
        const nextHour = Math.min(h + 1, 22);
        const finishHour = Math.min(nextHour + 2, 23);
        newStart = `${String(nextHour).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        newEnd = `${String(finishHour).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      }

      shifts.push({
        id: `${dayIndex}-shift-${Date.now()}`,
        startTime: newStart,
        endTime: newEnd,
      });

      next[dayIndex] = { ...next[dayIndex], shifts };
      return next;
    });
  };

  const handleConfirmRemoveShift = () => {
    if (!shiftToRemove) return;
    const { dayIndex, shiftIndex } = shiftToRemove;

    setDays((prev) => {
      const next = [...prev];
      const shifts = next[dayIndex].shifts.filter((_, idx) => idx !== shiftIndex);
      next[dayIndex] = { ...next[dayIndex], shifts };
      return next;
    });

    setShiftToRemove(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    setErrorMessage(null);

    try {
      const payloadAvailabilities: any[] = [];

      for (const d of days) {
        if (!d.isActive) {
          payloadAvailabilities.push({
            dayOfWeek: d.dayOfWeek,
            startTime: '08:00',
            endTime: '18:00',
            isActive: false,
          });
          continue;
        }

        // Validação dos turnos do dia
        for (const shift of d.shifts) {
          if (shift.startTime >= shift.endTime) {
            throw new Error(
              `Em ${DAYS_OF_WEEK[d.dayOfWeek]}, o horário de início (${shift.startTime}) deve ser anterior ao de término (${shift.endTime}).`
            );
          }

          payloadAvailabilities.push({
            dayOfWeek: d.dayOfWeek,
            startTime: shift.startTime,
            endTime: shift.endTime,
            isActive: true,
          });
        }
      }

      await api.post('/availability', {
        availabilities: payloadAvailabilities,
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
      fetchAvailability();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Erro ao salvar horários de funcionamento');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2B1D15] dark:text-[#FAF7F2]">Horários de Funcionamento</h1>
          <p className="text-sm text-[#796758] dark:text-[#CDB196] mt-0.5">
            Configure turnos e intervalos de atendimento por dia (ex: manhã, tarde e noite).
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#6B3E26] hover:bg-[#56311D] text-white text-sm font-bold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-60"
        >
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          <span>Salvar Horários</span>
        </button>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
          Horários de funcionamento salvos e atualizados com sucesso!
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-600 dark:text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-[#796758] hover:text-[#2B1D15] font-bold ml-2 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-[#1F1712] border border-[#E2D9CC] dark:border-[#382A21] rounded-2xl">
          <Loader2 className="animate-spin text-[#6B3E26] dark:text-[#E2CEBC]" size={32} />
          <span className="text-xs text-[#796758] dark:text-[#CDB196] mt-2 font-medium">Carregando horários cadastrados...</span>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1F1712] border border-[#E2D9CC] dark:border-[#382A21] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="text-xs text-[#6B584C] dark:text-[#CDB196] bg-[#FAF5ED] dark:bg-[#251C16] border border-[#E5D7C5] dark:border-[#382A21] p-3.5 rounded-xl flex items-center gap-2.5">
            <Clock size={16} className="text-[#6B3E26] dark:text-[#E2CEBC] shrink-0" />
            <span>
              <strong>Dica de horários fracionados:</strong> Você pode adicionar múltiplos turnos em um mesmo dia, por exemplo: 
              <span className="font-mono font-bold bg-white dark:bg-[#1F1712] text-[#2B1D15] dark:text-[#FAF7F2] px-1.5 py-0.5 rounded border border-[#E2D9CC] dark:border-[#382A21] ml-1">08:00 às 12:00</span>, 
              <span className="font-mono font-bold bg-white dark:bg-[#1F1712] text-[#2B1D15] dark:text-[#FAF7F2] px-1.5 py-0.5 rounded border border-[#E2D9CC] dark:border-[#382A21] ml-1">13:00 às 16:00</span> e 
              <span className="font-mono font-bold bg-white dark:bg-[#1F1712] text-[#2B1D15] dark:text-[#FAF7F2] px-1.5 py-0.5 rounded border border-[#E2D9CC] dark:border-[#382A21] ml-1">16:30 às 19:30</span>. 
              Os intervalos entre os turnos não serão exibidos aos clientes.
            </span>
          </div>

          {days.map((dayItem, dayIdx) => (
            <div
              key={dayItem.dayOfWeek}
              className={`p-4 rounded-xl border transition-all ${
                dayItem.isActive
                  ? 'border-[#E2D9CC] dark:border-[#382A21] bg-[#FAF8F5] dark:bg-[#251C16]'
                  : 'border-[#EFE9DF] dark:border-[#2D221A] bg-[#F8F5EE]/40 dark:bg-[#1C1510]/50 opacity-60'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                {/* Dia da semana e Toggle */}
                <div className="flex items-center gap-3 w-40 shrink-0 pt-1">
                  <input
                    type="checkbox"
                    id={`day-${dayItem.dayOfWeek}`}
                    checked={dayItem.isActive}
                    onChange={(e) => handleToggleDay(dayIdx, e.target.checked)}
                    className="w-4 h-4 accent-[#6B3E26] rounded cursor-pointer"
                  />
                  <label
                    htmlFor={`day-${dayItem.dayOfWeek}`}
                    className="text-sm font-bold text-[#2B1D15] dark:text-[#FAF7F2] cursor-pointer select-none"
                  >
                    {DAYS_OF_WEEK[dayItem.dayOfWeek]}
                  </label>
                </div>

                {/* Turnos / Intervalos */}
                {dayItem.isActive ? (
                  <div className="flex-1 space-y-2.5">
                    {dayItem.shifts.map((shift, shiftIdx) => (
                      <div
                        key={shift.id}
                        className="flex items-center flex-wrap gap-2 text-xs bg-white dark:bg-[#1F1712] p-2.5 rounded-xl border border-[#E2D9CC] dark:border-[#382A21] shadow-2xs"
                      >
                        <span className="text-[#796758] dark:text-[#CDB196] font-semibold w-16">
                          Turno {shiftIdx + 1}:
                        </span>

                        <input
                          type="time"
                          value={shift.startTime}
                          onChange={(e) =>
                            handleUpdateShift(dayIdx, shiftIdx, 'startTime', e.target.value)
                          }
                          className="px-2.5 py-1 bg-[#FAF8F5] dark:bg-[#251C16] border border-[#D0C3B2] dark:border-[#4A392D] text-[#2B1D15] dark:text-[#FAF7F2] rounded-lg text-xs font-mono font-bold focus:ring-1 focus:ring-[#6B3E26]"
                        />

                        <span className="text-[#9C8B7D] font-medium">até</span>

                        <input
                          type="time"
                          value={shift.endTime}
                          onChange={(e) =>
                            handleUpdateShift(dayIdx, shiftIdx, 'endTime', e.target.value)
                          }
                          className="px-2.5 py-1 bg-[#FAF8F5] dark:bg-[#251C16] border border-[#D0C3B2] dark:border-[#4A392D] text-[#2B1D15] dark:text-[#FAF7F2] rounded-lg text-xs font-mono font-bold focus:ring-1 focus:ring-[#6B3E26]"
                        />

                        {dayItem.shifts.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setShiftToRemove({
                                dayIndex: dayIdx,
                                shiftIndex: shiftIdx,
                                timeRange: `${shift.startTime} às ${shift.endTime}`,
                              })
                            }
                            className="p-1.5 text-[#9C8B7D] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors ml-auto cursor-pointer"
                            title="Remover este turno"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => handleAddShift(dayIdx)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#6B3E26] dark:text-[#E2CEBC] bg-[#F5EFE6] dark:bg-[#34241B] hover:bg-[#EFE4D6] dark:hover:bg-[#433024] border border-[#E2D9CC] dark:border-[#523A2C] transition-colors cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>Adicionar Turno / Intervalo</span>
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-[#9C8B7D] italic pt-1">
                    Fechado neste dia
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Caixa Personalizada para Confirmar Remoção de Turno */}
      <DeleteConfirmationModal
        isOpen={!!shiftToRemove}
        onClose={() => setShiftToRemove(null)}
        onConfirm={handleConfirmRemoveShift}
        title="Remover Turno de Horário"
        description="Tem certeza que deseja remover este período de atendimento? Clientes não poderão agendar horários neste intervalo."
        itemName={
          shiftToRemove
            ? `${DAYS_OF_WEEK[days[shiftToRemove.dayIndex]?.dayOfWeek]} — Turno das ${shiftToRemove.timeRange}`
            : undefined
        }
        confirmButtonText="Remover Turno"
      />
    </div>
  );
};
