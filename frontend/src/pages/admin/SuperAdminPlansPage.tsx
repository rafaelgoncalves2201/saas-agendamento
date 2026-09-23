import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Layers, Check, Edit2, Loader2, Save, X } from 'lucide-react';

export const SuperAdminPlansPage: React.FC = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);

  const fetchPlans = () => {
    setLoading(true);
    api.get('/admin/plans')
      .then((res) => setPlans(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.patch(`/admin/plans/${editingPlan.id}`, {
        name: editingPlan.name,
        description: editingPlan.description,
        priceMonthly: Number(editingPlan.priceMonthly),
        priceYearly: Number(editingPlan.priceYearly),
        maxProfessionals: Number(editingPlan.maxProfessionals),
        maxAppointmentsPerMonth: Number(editingPlan.maxAppointmentsPerMonth),
        maxWhatsappMessages: Number(editingPlan.maxWhatsappMessages),
      });
      setEditingPlan(null);
      fetchPlans();
    } catch (err) {
      alert('Erro ao salvar alterações no plano');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Planos & Preços</h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure preços, limites e recursos disponíveis para as empresas assinantes.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-amber-500" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => (
            <div
              key={p.id}
              className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-white">{p.name}</h3>
                  <button
                    onClick={() => setEditingPlan({ ...p })}
                    className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-900 transition-colors"
                    title="Editar Plano"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>

                <p className="text-xs text-slate-400 mb-4 min-h-[36px]">{p.description}</p>

                <div className="mb-4 p-3 rounded-xl bg-slate-900 border border-slate-800/80">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-white">
                      R$ {Number(p.priceMonthly).toFixed(2)}
                    </span>
                    <span className="text-xs text-slate-400">/mês</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    ou R$ {Number(p.priceYearly).toFixed(2)} /ano
                  </p>
                </div>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-400" />
                    <span>Até <strong>{p.maxProfessionals}</strong> profissionais</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-400" />
                    <span>Até <strong>{p.maxAppointmentsPerMonth}</strong> agendamentos/mês</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-400" />
                    <span>Até <strong>{p.maxWhatsappMessages}</strong> disparos de WhatsApp</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.features?.inventoryControl || p.slug === 'professional' || p.slug === 'business' ? (
                      <>
                        <Check size={14} className="text-emerald-400" />
                        <span className="text-emerald-300 font-medium">Controle de Estoque & Reposição</span>
                      </>
                    ) : (
                      <>
                        <X size={14} className="text-slate-500" />
                        <span className="text-slate-500 line-through">Sem controle de estoque</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Assinantes ativos:</span>
                <span className="font-bold text-amber-400">{p._count?.subscriptions || 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Edição */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-white text-base">Editar Plano {editingPlan.name}</h3>
              <button
                onClick={() => setEditingPlan(null)}
                className="text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Preço Mensal (R$)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editingPlan.priceMonthly}
                  onChange={(e) => setEditingPlan({ ...editingPlan, priceMonthly: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Preço Anual (R$)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editingPlan.priceYearly}
                  onChange={(e) => setEditingPlan({ ...editingPlan, priceYearly: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Máx. Profissionais</label>
                  <input
                    type="number"
                    value={editingPlan.maxProfessionals}
                    onChange={(e) => setEditingPlan({ ...editingPlan, maxProfessionals: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Máx. Agendamentos/Mês</label>
                  <input
                    type="number"
                    value={editingPlan.maxAppointmentsPerMonth}
                    onChange={(e) => setEditingPlan({ ...editingPlan, maxAppointmentsPerMonth: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Máx. Mensagens WhatsApp/Mês</label>
                <input
                  type="number"
                  value={editingPlan.maxWhatsappMessages}
                  onChange={(e) => setEditingPlan({ ...editingPlan, maxWhatsappMessages: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl flex items-center gap-1.5"
                >
                  <Save size={14} />
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

