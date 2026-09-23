import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Building2, CheckCircle2, XCircle, Loader2, Search, AlertCircle, Layers, X, Edit3 } from 'lucide-react';

export const SuperAdminCompaniesPage: React.FC = () => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Plan modal
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);
  const [targetPlanId, setTargetPlanId] = useState('');
  const [targetStatus, setTargetStatus] = useState('ACTIVE');
  const [targetMonths, setTargetMonths] = useState(1);
  const [savingPlan, setSavingPlan] = useState(false);

  const fetchCompanies = () => {
    setLoading(true);
    Promise.all([
      api.get('/admin/companies'),
      api.get('/admin/plans'),
    ])
      .then(([compRes, plansRes]) => {
        setCompanies(compRes.data);
        setPlans(plansRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const openPlanModal = (company: any) => {
    setSelectedCompany(company);
    setTargetPlanId(company.subscription?.planId || (plans[0]?.id || ''));
    setTargetStatus(company.subscription?.status || 'ACTIVE');
    setTargetMonths(1);
    setPlanModalOpen(true);
  };

  const handleChangePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany || !targetPlanId) return;
    setSavingPlan(true);
    try {
      await api.patch(`/admin/companies/${selectedCompany.id}/plan`, {
        planId: targetPlanId,
        status: targetStatus,
        months: Number(targetMonths),
      });
      setPlanModalOpen(false);
      setSelectedCompany(null);
      fetchCompanies();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao alterar plano da empresa.');
    } finally {
      setSavingPlan(false);
    }
  };

  const handleToggleStatus = async (companyId: string, currentStatus: boolean) => {
    try {
      await api.patch(`/admin/companies/${companyId}/status`, {
        isActive: !currentStatus,
      });
      fetchCompanies();
    } catch (err) {
      alert('Erro ao atualizar status da empresa');
    }
  };

  const filtered = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Empresas Cadastradas</h1>
          <p className="text-sm text-slate-400 mt-1">
            Gerenciamento geral e controle de suspensão de tenants da plataforma.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Buscar por nome, slug ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-amber-500" size={32} />
        </div>
      ) : (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Empresa</th>
                  <th className="px-6 py-4">Plano</th>
                  <th className="px-6 py-4">Status Assinatura</th>
                  <th className="px-6 py-4">Contadores</th>
                  <th className="px-6 py-4">Cadastrada em</th>
                  <th className="px-6 py-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-white">{c.name}</p>
                        <p className="text-xs text-slate-400">{c.slug} • {c.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800">
                        {c.subscription?.plan?.name || 'Starter'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          c.subscription?.status === 'ACTIVE'
                            ? 'bg-emerald-950 text-emerald-400'
                            : c.subscription?.status === 'TRIALING'
                            ? 'bg-amber-950 text-amber-400'
                            : 'bg-red-950 text-red-400'
                        }`}
                      >
                        {c.subscription?.status || 'SEM ASSINATURA'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {c._count?.appointments || 0} agendamentos • {c._count?.professionals || 0} prof.
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openPlanModal(c)}
                          className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-amber-800/80 text-amber-300 hover:bg-amber-950/60 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Alterar Plano da Empresa"
                        >
                          <Layers size={13} />
                          <span>Alterar Plano</span>
                        </button>

                        <button
                          onClick={() => handleToggleStatus(c.id, c.isActive)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                            c.isActive
                              ? 'border-red-800 text-red-400 hover:bg-red-950'
                              : 'border-emerald-800 text-emerald-400 hover:bg-emerald-950'
                          }`}
                        >
                          {c.isActive ? 'Suspender' : 'Reativar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Alterar Plano */}
      {planModalOpen && selectedCompany && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Layers size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Alterar Plano</h3>
                  <p className="text-xs text-slate-400">{selectedCompany.name}</p>
                </div>
              </div>
              <button
                onClick={() => setPlanModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleChangePlan} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Plano Selecionado *
                </label>
                <select
                  required
                  value={targetPlanId}
                  onChange={(e) => setTargetPlanId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — R$ {Number(p.priceMonthly).toFixed(2)}/mês ({p.maxProfessionals} prof., {p.maxAppointmentsPerMonth} agendamentos)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Status da Assinatura *
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value="ACTIVE">ACTIVE (Ativo / Pago)</option>
                  <option value="TRIALING">TRIALING (Período de Testes)</option>
                  <option value="PAST_DUE">PAST_DUE (Pagamento Atrasado)</option>
                  <option value="CANCELED">CANCELED (Cancelado)</option>
                  <option value="INCOMPLETE">INCOMPLETE (Incompleto)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Duração / Validade Inicial (Meses)
                </label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={targetMonths}
                  onChange={(e) => setTargetMonths(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Define o período contratado e a data final do ciclo atual.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPlanModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white cursor-pointer font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingPlan}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {savingPlan ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  <span>Aplicar Novo Plano</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

