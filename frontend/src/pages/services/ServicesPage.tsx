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
          <h1 className="text-2xl font-bold text-[#2B1D15] dark:text-[#F8F5EE]">Serviços</h1>
          <p className="text-sm text-[#796758] dark:text-[#CDB196] mt-0.5">
            Cadastre e edite procedimentos, valores, fotos e defina durações fechadas para seus horários.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#6B3E26] hover:bg-[#54311E] text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-[#6B3E26]/20 cursor-pointer"
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

      {/* Grid de Serviços Compacto e Elegante */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-[#6B3E26]" size={32} />
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#1F1712] rounded-2xl border border-[#E2D9CC] dark:border-[#382A21] p-6">
          <Scissors size={40} className="mx-auto text-[#796758] dark:text-[#CDB196] mb-3" />
          <h3 className="font-bold text-[#2B1D15] dark:text-[#F8F5EE] text-base">Nenhum serviço cadastrado</h3>
          <p className="text-xs text-[#796758] dark:text-[#CDB196] mt-1 max-w-sm mx-auto">
            Cadastre os procedimentos para que seus clientes possam agendar online pela sua página pública.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-4 px-4 py-2 bg-[#6B3E26] hover:bg-[#54311E] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Adicionar Primeiro Serviço
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
          {services.map((srv) => (
            <div
              key={srv.id}
              className="w-full max-w-[240px] bg-white dark:bg-[#1F1712] border border-[#E2D9CC] dark:border-[#382A21] rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Imagem Quadrada Compacta (1:1) */}
                {srv.imageUrl ? (
                  <div className="relative w-full aspect-square bg-[#FAF8F5] dark:bg-[#19120D] overflow-hidden">
                    <img
                      src={srv.imageUrl}
                      alt={srv.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#120D0A]/75 text-white backdrop-blur-xs">
                      {srv.category || 'Geral'}
                    </span>

                    {/* Botões Rápidos na Imagem */}
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(srv)}
                        className="p-1.5 bg-[#120D0A]/75 hover:bg-[#6B3E26] text-white rounded-lg backdrop-blur-xs transition-colors cursor-pointer"
                        title="Editar Serviço"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => setServiceToDelete(srv)}
                        className="p-1.5 bg-[#120D0A]/75 hover:bg-red-600 text-white rounded-lg backdrop-blur-xs transition-colors cursor-pointer"
                        title="Excluir Serviço"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 pb-0 flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FAF8F5] dark:bg-[#251C16] text-[#6B3E26] dark:text-[#E2CEBC] border border-[#E2D9CC] dark:border-[#382A21]">
                      {srv.category || 'Geral'}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(srv)}
                        className="p-1 text-[#796758] hover:text-[#6B3E26] dark:text-[#CDB196] dark:hover:text-[#E2CEBC] hover:bg-[#FAF8F5] dark:hover:bg-[#251C16] rounded-lg transition-colors cursor-pointer"
                        title="Editar Serviço"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => setServiceToDelete(srv)}
                        className="p-1 text-[#796758] hover:text-red-600 dark:text-[#CDB196] dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Excluir Serviço"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )}

                <div className="p-3 pt-2">
                  <h3 className="font-bold text-[#2B1D15] dark:text-[#FAF7F2] text-xs sm:text-sm mb-0.5 truncate" title={srv.name}>
                    {srv.name}
                  </h3>
                  <p className="text-[11px] text-[#796758] dark:text-[#CDB196] line-clamp-2 leading-relaxed">
                    {srv.description || 'Sem descrição cadastrada.'}
                  </p>
                </div>
              </div>

              {/* Rodapé do Card Compacto */}
              <div className="p-2.5 sm:p-3 border-t border-[#EFE9DF] dark:border-[#33251D] space-y-2 bg-[#FAF8F5] dark:bg-[#251C16]">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-[#6B584C] dark:text-[#CDB196] font-medium text-[10px] sm:text-[11px]">
                    <Clock size={12} className="text-[#9C8B7D]" />
                    <span>
                      {srv.durationMinutes} min
                      {srv.durationMinutes >= 180 && ' (3h)'}
                      {srv.durationMinutes === 120 && ' (2h)'}
                    </span>
                  </div>

                  <span className="font-black text-[#2B1D15] dark:text-[#FAF7F2] text-xs sm:text-sm">
                    R$ {Number(srv.price).toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 pt-1 border-t border-[#EFE9DF] dark:border-[#33251D]">
                  <button
                    onClick={() => handleOpenEditModal(srv)}
                    className="flex-1 py-1.5 px-2 bg-[#6B3E26] hover:bg-[#56311D] text-white font-bold rounded-xl text-[11px] sm:text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs"
                  >
                    <Pencil size={12} />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => setServiceToDelete(srv)}
                    className="p-1.5 text-[#796758] hover:text-red-600 dark:text-[#CDB196] dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors cursor-pointer border border-[#E2D9CC] dark:border-[#382A21]"
                    title="Excluir Serviço"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Criar / Editar Serviço */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#261E18] border border-[#E2D9CC] dark:border-[#382A21] rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl my-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2D9CC] dark:border-[#382A21] mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FAF5ED] dark:bg-[#34241B] text-[#6B3E26] dark:text-[#E2CEBC] flex items-center justify-center font-bold">
                  {editingService ? <Pencil size={16} /> : <Scissors size={16} />}
                </div>
                <div>
                  <h3 className="font-bold text-[#2B1D15] dark:text-[#F8F5EE] text-base">
                    {editingService ? 'Editar Serviço' : 'Novo Serviço'}
                  </h3>
                  <p className="text-[11px] text-[#796758] dark:text-[#CDB196]">
                    {editingService ? 'Modifique os dados e horários deste procedimento.' : 'Adicione um novo procedimento ao catálogo.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-[#796758] hover:text-[#2B1D15] dark:hover:text-white cursor-pointer p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#2B1D15] dark:text-[#F8F5EE] font-semibold mb-1">Nome do Serviço *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Cílios Kim Kardashian"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] dark:bg-[#1F1712] border border-[#E2D9CC] dark:border-[#382A21] rounded-xl text-xs text-[#2B1D15] dark:text-[#F8F5EE] focus:outline-none focus:ring-2 focus:ring-[#6B3E26]"
                />
              </div>

              {/* Duração com Presets Inteligentes */}
              <div className="p-3.5 bg-[#FAF5ED] dark:bg-[#201813] border border-[#E2D9CC] dark:border-[#382A21] rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[#2B1D15] dark:text-[#F8F5EE] font-bold flex items-center gap-1.5">
                    <Clock size={14} className="text-[#6B3E26] dark:text-[#CDB196]" />
                    <span>Duração do Atendimento *</span>
                  </label>
                  <span className="text-xs font-black text-[#6B3E26] dark:text-[#E2CEBC]">
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
                            ? 'bg-[#6B3E26] text-white border-[#6B3E26] shadow-xs'
                            : 'bg-white dark:bg-[#261E18] text-[#2B1D15] dark:text-[#F8F5EE] border-[#E2D9CC] dark:border-[#382A21] hover:border-[#6B3E26]'
                        }`}
                      >
                        <span>{preset.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] text-[#796758] dark:text-[#CDB196] shrink-0">Ou digite em minutos:</span>
                  <input
                    type="number"
                    required
                    min="5"
                    step="5"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                    className="w-28 px-3 py-1.5 bg-white dark:bg-[#261E18] border border-[#E2D9CC] dark:border-[#382A21] rounded-xl text-xs font-bold text-[#2B1D15] dark:text-[#F8F5EE] focus:outline-none focus:ring-2 focus:ring-[#6B3E26]"
                  />
                </div>

                {formData.durationMinutes >= 180 ? (
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                    ★ Turno de 3h Fechado: Atende a mesma cliente das 09:30 às 12:30. O sistema bloqueia automaticamente qualquer horário concorrente dentro desse período.
                  </p>
                ) : formData.durationMinutes >= 120 ? (
                  <p className="text-[11px] text-[#6B3E26] dark:text-[#E2CEBC] font-semibold bg-[#FAF5ED] dark:bg-[#34241B] p-2 rounded-xl border border-[#CDB196] dark:border-[#523A2C]">
                    ★ Turno de 2h: Bloqueia o intervalo inteiro (ex: 13:30 às 15:30) para a mesma cliente.
                  </p>
                ) : null}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#2B1D15] dark:text-[#F8F5EE] font-semibold mb-1">Preço (R$) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.5"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] dark:bg-[#1F1712] border border-[#E2D9CC] dark:border-[#382A21] rounded-xl text-xs text-[#2B1D15] dark:text-[#F8F5EE] focus:outline-none focus:ring-2 focus:ring-[#6B3E26]"
                  />
                </div>

                <div>
                  <label className="block text-[#2B1D15] dark:text-[#F8F5EE] font-semibold mb-1">Categoria (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: Cílios, Cabelo, Unhas..."
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] dark:bg-[#1F1712] border border-[#E2D9CC] dark:border-[#382A21] rounded-xl text-xs text-[#2B1D15] dark:text-[#F8F5EE] focus:outline-none focus:ring-2 focus:ring-[#6B3E26]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#2B1D15] dark:text-[#F8F5EE] font-semibold mb-1">Descrição (Opcional)</label>
                <textarea
                  rows={2}
                  placeholder="Explique detalhes, benefícios ou orientações prévias..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#FAF8F5] dark:bg-[#1F1712] border border-[#E2D9CC] dark:border-[#382A21] rounded-xl text-xs text-[#2B1D15] dark:text-[#F8F5EE] focus:outline-none focus:ring-2 focus:ring-[#6B3E26]"
                />
              </div>

              {/* Foto do Serviço */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[#2B1D15] dark:text-[#F8F5EE] font-semibold flex items-center gap-1.5">
                    <ImageIcon size={14} className="text-[#6B3E26] dark:text-[#CDB196]" />
                    <span>Foto do Serviço</span>
                  </label>
                  <span className="text-[11px] text-[#796758] dark:text-[#CDB196]">Anexe um arquivo ou cole uma URL</span>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <label className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-[#FAF5ED] hover:bg-[#EFE9DF] text-[#6B3E26] border border-[#E2D9CC] rounded-xl font-bold cursor-pointer transition-colors text-xs shadow-xs">
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
                  className="w-full px-3 py-2 bg-[#FAF8F5] dark:bg-[#1F1712] border border-[#E2D9CC] dark:border-[#382A21] rounded-xl text-xs text-[#2B1D15] dark:text-[#F8F5EE] focus:outline-none focus:ring-2 focus:ring-[#6B3E26] mb-2"
                />

                {/* Sugestões rápidas de fotos */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-[#796758] dark:text-[#CDB196] uppercase tracking-wider">
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
                            ? 'bg-[#6B3E26] text-white border-[#6B3E26]'
                            : 'bg-[#FAF8F5] dark:bg-[#1F1712] text-[#6B3E26] dark:text-[#CDB196] border-[#E2D9CC] dark:border-[#382A21] hover:bg-[#FAF5ED]'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {formData.imageUrl && (
                  <div className="mt-3 relative w-32 h-32 rounded-xl overflow-hidden border border-[#E2D9CC] dark:border-[#382A21]">
                    <img src={formData.imageUrl} alt="Prévia" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, imageUrl: '' })}
                      className="absolute top-1.5 right-1.5 p-1 bg-black/60 text-white rounded-lg hover:bg-red-600 transition-colors cursor-pointer"
                      title="Remover Imagem"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E2D9CC] dark:border-[#382A21]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 text-[#796758] dark:text-[#CDB196] hover:text-[#2B1D15] dark:hover:text-white rounded-xl font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-[#6B3E26] hover:bg-[#54311E] text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm shadow-[#6B3E26]/20 transition-colors cursor-pointer disabled:opacity-50"
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
