import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import {
  Users,
  UserPlus,
  Search,
  Shield,
  Building2,
  Mail,
  Phone,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export const SuperAdminUsersPage: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'COMPANY_ADMIN',
    isActive: true,
    companyId: '',
  });

  const [userToDelete, setUserToDelete] = useState<any | null>(null);

  const fetchUsers = () => {
    setLoading(true);
    Promise.all([
      api.get('/admin/users'),
      api.get('/admin/companies'),
    ])
      .then(([usersRes, compRes]) => {
        setUsers(usersRes.data);
        setCompanies(compRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/admin/users', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password.trim(),
        phone: formData.phone.trim() || undefined,
        role: formData.role,
        companyId: formData.companyId || undefined,
      });

      setCreateModalOpen(false);
      resetForm();
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Falha ao criar usuário.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id) return;
    setSubmitting(true);
    try {
      await api.patch(`/admin/users/${formData.id}`, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password.trim() ? formData.password.trim() : undefined,
        phone: formData.phone.trim() || undefined,
        role: formData.role,
        isActive: formData.isActive,
        companyId: formData.companyId || undefined,
      });

      setEditModalOpen(false);
      resetForm();
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Falha ao atualizar usuário.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    setSubmitting(true);
    try {
      await api.delete(`/admin/users/${userToDelete.id}`);
      setDeleteModalOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Falha ao excluir usuário.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (u: any) => {
    const currentCompanyId = u.memberships?.[0]?.company?.id || '';
    setFormData({
      id: u.id,
      name: u.name,
      email: u.email,
      password: '',
      phone: u.phone || '',
      role: u.role,
      isActive: u.isActive,
      companyId: currentCompanyId,
    });
    setEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      email: '',
      password: '',
      phone: '',
      role: 'COMPANY_ADMIN',
      isActive: true,
      companyId: '',
    });
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    const companyName = u.memberships?.[0]?.company?.name?.toLowerCase() || '';
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      companyName.includes(q)
    );
  });

  const totalSuperAdmins = users.filter((u) => u.role === 'SUPER_ADMIN').length;
  const totalCompanyAdmins = users.filter((u) => u.role === 'COMPANY_ADMIN').length;
  const totalProfessionals = users.filter((u) => u.role === 'PROFESSIONAL').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Users className="text-amber-400" size={26} />
            <span>Gestão de Usuários da Plataforma</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Controle global de acessos, permissões, criação e exclusão de contas do SaaS.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Buscar por nome, e-mail ou cargo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            onClick={() => {
              resetForm();
              setCreateModalOpen(true);
            }}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer"
          >
            <UserPlus size={16} />
            <span>Novo Usuário</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-400 font-semibold block">Total de Usuários</span>
          <span className="text-2xl font-black text-white mt-1 block">{users.length}</span>
        </div>
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
          <span className="text-xs text-amber-400 font-semibold block">Super Admins</span>
          <span className="text-2xl font-black text-amber-300 mt-1 block">{totalSuperAdmins}</span>
        </div>
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
          <span className="text-xs text-indigo-400 font-semibold block">Gestores de Empresas</span>
          <span className="text-2xl font-black text-indigo-300 mt-1 block">{totalCompanyAdmins}</span>
        </div>
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
          <span className="text-xs text-blue-400 font-semibold block">Profissionais / Staff</span>
          <span className="text-2xl font-black text-blue-300 mt-1 block">{totalProfessionals}</span>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-amber-500" size={32} />
        </div>
      ) : (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Usuário</th>
                  <th className="px-6 py-4">Cargo / Nível</th>
                  <th className="px-6 py-4">Empresa Vinculada</th>
                  <th className="px-6 py-4">Telefone</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredUsers.map((u) => {
                  const company = u.memberships?.[0]?.company;
                  const isSelf = currentUser?.id === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 font-bold flex items-center justify-center shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-white flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isSelf && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  Você
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                              <Mail size={12} /> {u.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg border inline-flex items-center gap-1 ${
                            u.role === 'SUPER_ADMIN'
                              ? 'bg-amber-950/80 text-amber-300 border-amber-800/80'
                              : u.role === 'COMPANY_ADMIN'
                              ? 'bg-indigo-950/80 text-indigo-300 border-indigo-800/80'
                              : u.role === 'PROFESSIONAL'
                              ? 'bg-blue-950/80 text-blue-300 border-blue-800/80'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {u.role === 'SUPER_ADMIN' && <Shield size={12} />}
                          {u.role}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-xs">
                        {company ? (
                          <div className="flex items-center gap-1.5 text-slate-200">
                            <Building2 size={13} className="text-slate-400 shrink-0" />
                            <span className="font-medium">{company.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Sem empresa vinculada</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-xs text-slate-400">
                        {u.phone ? (
                          <span className="flex items-center gap-1">
                            <Phone size={12} /> {u.phone}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                            u.isActive
                              ? 'bg-emerald-950 text-emerald-400'
                              : 'bg-red-950 text-red-400'
                          }`}
                        >
                          {u.isActive ? (
                            <>
                              <CheckCircle2 size={12} /> Ativo
                            </>
                          ) : (
                            <>
                              <XCircle size={12} /> Bloqueado
                            </>
                          )}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Editar Usuário"
                          >
                            <Edit2 size={15} />
                          </button>
                          {!isSelf && (
                            <button
                              onClick={() => {
                                setUserToDelete(u);
                                setDeleteModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
                              title="Excluir Usuário"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Criar Novo Usuário */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <UserPlus size={18} className="text-amber-400" />
                <span>Cadastrar Novo Usuário</span>
              </h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Carlos Silva"
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">E-mail para Login *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="carlos@exemplo.com"
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Senha de Acesso (Mín. 6 caracteres) *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">WhatsApp / Telefone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="11999998888"
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Cargo / Permissão *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-amber-500"
                  >
                    <option value="COMPANY_ADMIN">COMPANY_ADMIN (Gestor)</option>
                    <option value="PROFESSIONAL">PROFESSIONAL (Atendente)</option>
                    <option value="STAFF">STAFF (Recepção)</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN (Global)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Empresa Vinculada</label>
                <select
                  value={formData.companyId}
                  onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-amber-500"
                >
                  <option value="">Nenhuma empresa (acesso global ou sem vínculo)</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white border border-slate-800 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
                  <span>Cadastrar Usuário</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Usuário */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Edit2 size={18} className="text-amber-400" />
                <span>Editar Dados do Usuário</span>
              </h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">E-mail para Login *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Redefinir Senha (opcional, deixe em branco para manter)
                </label>
                <input
                  type="password"
                  placeholder="Digite nova senha (mín. 6 caracteres)"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">WhatsApp / Telefone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Cargo / Permissão *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-amber-500"
                  >
                    <option value="COMPANY_ADMIN">COMPANY_ADMIN (Gestor)</option>
                    <option value="PROFESSIONAL">PROFESSIONAL (Atendente)</option>
                    <option value="STAFF">STAFF (Recepção)</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN (Global)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Empresa Vinculada</label>
                <select
                  value={formData.companyId}
                  onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-amber-500"
                >
                  <option value="">Nenhuma empresa (acesso global ou sem vínculo)</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                <span className="text-slate-300 font-semibold">Status do Usuário</span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    formData.isActive
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-red-950 text-red-400 border border-red-800'
                  }`}
                >
                  {formData.isActive ? 'Conta Ativa' : 'Conta Bloqueada'}
                </button>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white border border-slate-800 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Exclusão */}
      {deleteModalOpen && userToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-950/60 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-white text-base">Excluir Usuário?</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Você está prestes a remover o usuário <strong>{userToDelete.name}</strong> ({userToDelete.email}). Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setUserToDelete(null);
                }}
                className="flex-1 py-2 rounded-xl text-slate-400 hover:text-white border border-slate-800 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting}
                className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Excluindo...' : 'Confirmar Exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

