import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Building2, CheckCircle2, XCircle, Loader2, Search, AlertCircle } from 'lucide-react';

export const SuperAdminCompaniesPage: React.FC = () => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchCompanies = () => {
    setLoading(true);
    api.get('/admin/companies')
      .then((res) => setCompanies(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

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
                      <button
                        onClick={() => handleToggleStatus(c.id, c.isActive)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                          c.isActive
                            ? 'border-red-800 text-red-400 hover:bg-red-950'
                            : 'border-emerald-800 text-emerald-400 hover:bg-emerald-950'
                        }`}
                      >
                        {c.isActive ? 'Suspender' : 'Reativar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

