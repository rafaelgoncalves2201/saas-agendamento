import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { UserCheck, Plus, Copy, ExternalLink, Trash2, Loader2, X, AlertCircle, Upload, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DeleteConfirmationModal } from '../../components/DeleteConfirmationModal';

export const ProfessionalsPage: React.FC = () => {
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [features, setFeatures] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Deletion state
  const [professionalToDelete, setProfessionalToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    phone: '',
    email: '',
    bio: '',
    avatarUrl: '',
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get('/professionals'),
      api.get('/subscriptions/me/features'),
      api.get('/companies/my-company'),
    ])
      .then(([profRes, featRes, compRes]) => {
        setProfessionals(profRes.data);
        setFeatures(featRes.data);
        setCompany(compRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // E-mail é 100% opcional: se vazio, envia undefined para não disparar validação
      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() ? formData.email.trim() : undefined,
        bio: formData.bio.trim() ? formData.bio.trim() : undefined,
        avatarUrl: formData.avatarUrl.trim() ? formData.avatarUrl.trim() : undefined,
      };

      await api.post('/professionals', payload);
      setModalOpen(false);
      setFormData({ name: '', slug: '', phone: '', email: '', bio: '', avatarUrl: '' });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao criar profissional');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!professionalToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/professionals/${professionalToDelete.id}`);
      setProfessionalToDelete(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao excluir profissional');
    } finally {
      setDeleting(false);
    }
  };

  const handleCopyLink = (professionalSlug: string, profId: string) => {
    const url = `${window.location.origin}/empresa/${company?.slug}/profissional/${professionalSlug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(profId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isLimitReached =
    features &&
    features.usage?.currentProfessionals >= features.features?.maxProfessionals;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profissionais</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Gerencie sua equipe e links individuais de agendamento.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {features && (
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300">
              Uso do Plano: {features.usage?.currentProfessionals} / {features.features?.maxProfessionals} prof.
            </div>
          )}

          <button
            onClick={() => setModalOpen(true)}
            disabled={isLimitReached}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              isLimitReached
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 dark:shadow-none cursor-pointer'
            }`}
          >
            <Plus size={16} />
            <span>Novo Profissional</span>
          </button>
        </div>
      </div>

      {/* Plan limit warning banner */}
      {isLimitReached && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-200">
            <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              Você atingiu o limite máximo de <strong>{features.features.maxProfessionals} profissional(is)</strong> do plano {features.plan}.
            </span>
          </div>
          <Link
            to="/subscription"
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shrink-0 transition-colors"
          >
            Fazer Upgrade
          </Link>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {professionals.map((prof) => {
            const publicLink = `/empresa/${company?.slug}/profissional/${prof.slug}`;
            return (
              <div
                key={prof.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3.5 overflow-hidden">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                        {prof.name.charAt(0)}
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">{prof.name}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{prof.phone}</p>
                        {prof.email ? (
                          <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{prof.email}</p>
                        ) : (
                          <span className="inline-block text-[10px] text-slate-400 dark:text-slate-500 italic">Sem e-mail cadastrado</span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => setProfessionalToDelete(prof)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Excluir Profissional"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 line-clamp-2">
                    {prof.bio || 'Sem biografia cadastrada.'}
                  </p>
                </div>

                {/* Individual Link Section */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Link de Agendamento Individual:
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopyLink(prof.slug, prof.id)}
                      className="flex-1 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Copy size={13} />
                      <span>{copiedId === prof.id ? 'Link Copiado! ✅' : 'Copiar Link'}</span>
                    </button>

                    <a
                      href={publicLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
                      title="Abrir Página Pública"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Novo Profissional */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Novo Profissional</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Barbeiro"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]/g, '-');
                    setFormData({ ...formData, name, slug });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Slug (Identificador do Link) *</label>
                <input
                  type="text"
                  required
                  placeholder="carlos-barbeiro"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">WhatsApp *</label>
                  <input
                    type="text"
                    required
                    placeholder="11999990000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 dark:text-slate-300 font-semibold">E-mail</label>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">Opcional</span>
                  </div>
                  <input
                    type="email"
                    placeholder="carlos@empresa.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Biografia / Apresentação (Opcional)</label>
                <textarea
                  rows={2}
                  placeholder="Especialidades e experiência do profissional..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Foto de Perfil (Avatar) */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Foto de Perfil (Avatar)</label>
                <div className="flex items-center gap-2 mb-2">
                  <label className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl font-bold cursor-pointer transition-colors text-xs shadow-xs">
                    <Upload size={14} />
                    <span>Anexar Foto do Arquivo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormData({ ...formData, avatarUrl: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
                <input
                  type="url"
                  placeholder="Ou cole a URL da foto (https://...)"
                  value={formData.avatarUrl.startsWith('data:') ? '' : formData.avatarUrl}
                  onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {formData.avatarUrl && (
                  <div className="mt-2 flex items-center gap-2.5 p-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 rounded-xl">
                    <img
                      src={formData.avatarUrl}
                      alt="Preview Avatar"
                      className="w-10 h-10 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                      onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                    />
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Prévia da foto carregada</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-2 shadow-sm shadow-indigo-200 dark:shadow-none cursor-pointer disabled:opacity-50"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  <span>Salvar Profissional</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Caixa Personalizada para Exclusão de Profissional */}
      <DeleteConfirmationModal
        isOpen={!!professionalToDelete}
        onClose={() => setProfessionalToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir Profissional"
        description="Tem certeza que deseja excluir este profissional da sua equipe? Se houver agendamentos associados a ele, o cadastro será inativado para preservar o histórico financeiro."
        itemName={professionalToDelete ? `${professionalToDelete.name} (${professionalToDelete.phone})` : undefined}
        loading={deleting}
        confirmButtonText="Sim, Excluir Profissional"
      />
    </div>
  );
};
