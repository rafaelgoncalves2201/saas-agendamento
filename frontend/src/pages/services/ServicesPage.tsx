import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import {
  Scissors,
  Plus,
  Trash2,
  Clock,
  Loader2,
  X,
  Image as ImageIcon,
  Sparkles,
  Upload,
  Pencil,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { DeleteConfirmationModal } from '../../components/DeleteConfirmationModal';

const SERVICE_IMAGE_PRESETS = [
  { label: 'Corte Masculino', url: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=500' },
  { label: 'Barba & Bigode', url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=500' },
  { label: 'Manicure / Unhas', url: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=500' },
  { label: 'Extensão de Cílios (Lash)', url: 'https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=500' },
  { label: 'Sobrancelhas', url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500' },
  { label: 'Corte & Mega Hair', url: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?w=500' },
  { label: 'Massagem & Relaxamento', url: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=500' },
  { label: 'Estética Facial', url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500' },
  { label: 'Maquiagem', url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=500' },
];

const DURATION_PRESETS = [
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1 hora (60 min)', value: 60 },
  { label: '1h 30m (90 min)', value: 90 },
  { label: '2 horas (120 min)', value: 120, badge: 'Turno da Tarde' },
  { label: '2h 30m (150 min)', value: 150 },
  { label: '3 horas (180 min)', value: 180, badge: 'Turno Fechado (ex: 09:30 às 12:30)' },
  { label: '4 horas (240 min)', value: 240 },
];

export const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Edição
  const [editingService, setEditingService] = useState<any | null>(null);

  // Deletion state
  const [serviceToDelete, setServiceToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Feedback notification
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    durationMinutes: 30,
    price: 50.0,
    category: '',
    imageUrl: '',
  });

  const fetchServices = () => {
    setLoading(true);
    api.get('/services')
      .then((res) => setServices(res.data))
      .catch((err) => {
        console.error(err);
        showNotification('error', 'Erro ao carregar serviços.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      durationMinutes: 60,
      price: 50.0,
      category: '',
      imageUrl: '',
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (service: any) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      durationMinutes: service.durationMinutes,
      price: Number(service.price),
      category: service.category || '',
      imageUrl: service.imageUrl || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category.trim() || undefined,
        imageUrl: formData.imageUrl.trim() || undefined,
        durationMinutes: Number(formData.durationMinutes),
        price: Number(formData.price),
      };

      if (editingService) {
        // Atualização
        await api.patch(`/services/${editingService.id}`, payload);
        showNotification('success', `Serviço "${formData.name}" atualizado com sucesso!`);
      } else {
        // Criação
        await api.post('/services', payload);
        showNotification('success', `Serviço "${formData.name}" cadastrado com sucesso!`);
      }

      setModalOpen(false);
      setEditingService(null);
      fetchServices();
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Erro ao salvar serviço');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!serviceToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/services/${serviceToDelete.id}`);
      showNotification('success', `Serviço "${serviceToDelete.name}" excluído.`);
      setServiceToDelete(null);
      fetchServices();
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Erro ao excluir serviço');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Serviços</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Cadastre e edite procedimentos, valores, fotos e defina durações fechadas para seus horários.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-200 dark:shadow-none cursor-pointer"
        >
          <Plus size={16} />
          <span>Novo Serviço</span>
        </button>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-semibold shadow-sm transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle size={18} className="text-red-600 dark:text-red-400 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Grid de Serviços */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={32} />
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <Scissors size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="font-bold text-slate-700 dark:text-slate-200 text-base">Nenhum serviço cadastrado</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
            Cadastre os procedimentos para que seus clientes possam agendar online pela sua página pública.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            Adicionar Primeiro Serviço
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {services.map((srv) => (
            <div
              key={srv.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Imagem do Serviço */}
                {srv.imageUrl ? (
                  <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <img
                      src={srv.imageUrl}
                      alt={srv.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <span className="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full bg-black/60 text-white backdrop-blur-xs">
                      {srv.category || 'Geral'}
                    </span>

                    {/* Botões de Ação na Imagem */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(srv)}
                        className="p-1.5 bg-black/60 hover:bg-indigo-600 text-white rounded-xl backdrop-blur-xs transition-colors cursor-pointer"
                        title="Editar Serviço"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setServiceToDelete(srv)}
                        className="p-1.5 bg-black/60 hover:bg-red-600 text-white rounded-xl backdrop-blur-xs transition-colors cursor-pointer"
                        title="Excluir Serviço"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 pb-0 flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {srv.category || 'Geral'}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(srv)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Editar Serviço"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setServiceToDelete(srv)}
                        className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Excluir Serviço"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}

                <div className="p-5 pt-3">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-1">{srv.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
                    {srv.description || 'Sem descrição cadastrada.'}
                  </p>
                </div>
              </div>

              {/* Rodapé do Card */}
              <div className="p-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs bg-slate-50/50 dark:bg-slate-850/50">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                  <Clock size={14} className="text-slate-400 dark:text-slate-500" />
                  <span>
                    {srv.durationMinutes} min
                    {srv.durationMinutes >= 180 && ' (3h fechadas)'}
                    {srv.durationMinutes === 120 && ' (2h)'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-black text-slate-900 dark:text-slate-100 text-sm">
                    R$ {Number(srv.price).toFixed(2)}
                  </span>
                  <button
                    onClick={() => handleOpenEditModal(srv)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold cursor-pointer"
                  >
                    Editar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Criar / Editar Serviço */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl my-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  {editingService ? <Pencil size={16} /> : <Scissors size={16} />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                    {editingService ? 'Editar Serviço' : 'Novo Serviço'}
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    {editingService ? 'Modifique os dados e horários deste procedimento.' : 'Adicione um novo procedimento ao catálogo.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Nome do Serviço *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Cílios Kim Kardashian"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Duração com Presets Inteligentes */}
              <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1.5">
                    <Clock size={14} className="text-indigo-600 dark:text-indigo-400" />
                    <span>Duração do Atendimento *</span>
                  </label>
                  <span className="text-xs font-black text-indigo-700 dark:text-indigo-300">
                    {formData.durationMinutes} minutos ({Math.floor(formData.durationMinutes / 60)}h {formData.durationMinutes % 60 > 0 ? `${formData.durationMinutes % 60}m` : ''})
                  </span>
                </div>

                {/* Chips de Duração Rápida */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {DURATION_PRESETS.map((preset) => {
                    const isSelected = formData.durationMinutes === preset.value;
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, durationMinutes: preset.value })}
                        className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold transition-all text-center cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                        }`}
                      >
                        <span>{preset.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 shrink-0">Ou digite em minutos:</span>
                  <input
                    type="number"
                    required
                    min="5"
                    step="5"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                    className="w-28 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {formData.durationMinutes >= 180 ? (
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                    ★ Turno de 3h Fechado: Atende a mesma cliente das 09:30 às 12:30. O sistema bloqueia automaticamente qualquer horário concorrente dentro desse período.
                  </p>
                ) : formData.durationMinutes >= 120 ? (
                  <p className="text-[11px] text-indigo-700 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/40 p-2 rounded-xl border border-indigo-200 dark:border-indigo-800/60">
                    ★ Turno de 2h: Bloqueia o intervalo inteiro (ex: 13:30 às 15:30) para a mesma cliente.
                  </p>
                ) : null}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Preço (R$) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.5"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Categoria (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: Cílios, Cabelo, Unhas..."
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Descrição (Opcional)</label>
                <textarea
                  rows={2}
                  placeholder="Explique detalhes, benefícios ou orientações prévias..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Foto do Serviço */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                    <ImageIcon size={14} className="text-indigo-600 dark:text-indigo-400" />
                    <span>Foto do Serviço</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Anexe um arquivo ou cole uma URL</span>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <label className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl font-bold cursor-pointer transition-colors text-xs shadow-xs">
                    <Upload size={14} />
                    <span>Anexar Foto dos Arquivos</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormData({ ...formData, imageUrl: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>

                <input
                  type="url"
                  placeholder="Ou cole a URL da imagem (https://...)"
                  value={formData.imageUrl.startsWith('data:') ? '' : formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
                />

                {/* Sugestões rápidas de fotos */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Ou escolha uma sugestão profissional:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {SERVICE_IMAGE_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setFormData({ ...formData, imageUrl: preset.url })}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          formData.imageUrl === preset.url
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {formData.imageUrl && (
                  <div className="mt-3 relative w-full h-32 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                    <img src={formData.imageUrl} alt="Prévia" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, imageUrl: '' })}
                      className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded-lg hover:bg-red-600 transition-colors cursor-pointer"
                      title="Remover Imagem"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-xl font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm shadow-indigo-200 dark:shadow-none transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : editingService ? (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Salvar Alterações</span>
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      <span>Cadastrar Serviço</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Exclusão */}
      <DeleteConfirmationModal
        isOpen={Boolean(serviceToDelete)}
        onClose={() => setServiceToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir Serviço"
        description={`Tem certeza que deseja excluir o serviço "${serviceToDelete?.name}"? Esta ação removerá o serviço da lista e ele não poderá mais ser agendado por clientes.`}
        loading={deleting}
      />
    </div>
  );
};
