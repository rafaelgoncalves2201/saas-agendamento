import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import {
  Tag,
  Plus,
  Trash2,
  Calendar,
  Percent,
  DollarSign,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Copy,
  Check,
  ToggleLeft,
  ToggleRight,
  Pencil,
} from 'lucide-react';
import { DeleteConfirmationModal } from '../../components/DeleteConfirmationModal';

export const CouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Edição
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null);

  // Deletion state
  const [couponToDelete, setCouponToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Feedback notification
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minOrderValue: '',
    maxUses: '',
    professionalId: '',
    validUntil: '',
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([api.get('/coupons'), api.get('/professionals')])
      .then(([couponsRes, profRes]) => {
        setCoupons(couponsRes.data);
        setProfessionals(profRes.data);
      })
      .catch((err) => {
        console.error(err);
        showNotification('error', 'Erro ao carregar cupons do estabelecimento.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleOpenCreateModal = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderValue: '',
      maxUses: '',
      professionalId: '',
      validUntil: '',
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (coupon: any) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
      minOrderValue: coupon.minOrderValue ? String(coupon.minOrderValue) : '',
      maxUses: coupon.maxUses ? String(coupon.maxUses) : '',
      professionalId: coupon.professionalId || '',
      validUntil: coupon.validUntil ? coupon.validUntil.slice(0, 10) : '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload: any = {
        code: formData.code.trim().toUpperCase().replace(/\s+/g, ''),
        description: formData.description.trim() || undefined,
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        minOrderValue: formData.minOrderValue ? Number(formData.minOrderValue) : undefined,
        maxUses: formData.maxUses ? Number(formData.maxUses) : undefined,
        professionalId: formData.professionalId || undefined,
        validUntil: formData.validUntil ? new Date(`${formData.validUntil}T23:59:59.000Z`).toISOString() : undefined,
      };

      if (editingCoupon) {
        await api.patch(`/coupons/${editingCoupon.id}`, payload);
        showNotification('success', `Cupom "${payload.code}" atualizado com sucesso!`);
      } else {
        await api.post('/coupons', payload);
        showNotification('success', `Cupom "${payload.code}" criado com sucesso!`);
      }

      setModalOpen(false);
      setEditingCoupon(null);
      fetchData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Erro ao salvar cupom de desconto.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (coupon: any) => {
    try {
      await api.patch(`/coupons/${coupon.id}/toggle`);
      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, isActive: !c.isActive } : c))
      );
      showNotification(
        'success',
        `Cupom ${coupon.code} ${coupon.isActive ? 'desativado' : 'ativado'} com sucesso.`
      );
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Erro ao alterar status do cupom.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!couponToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/coupons/${couponToDelete.id}`);
      showNotification('success', `Cupom "${couponToDelete.code}" excluído com sucesso.`);
      setCouponToDelete(null);
      fetchData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Erro ao excluir cupom.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Cupons de Desconto</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Crie campanhas promocionais, cupons em % ou R$ fixos e limite por data ou profissional.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-200 dark:shadow-none cursor-pointer"
        >
          <Plus size={16} />
          <span>Novo Cupom</span>
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

      {/* Grid de Cupons */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={32} />
        </div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <Tag size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="font-bold text-slate-700 dark:text-slate-200 text-base">Nenhum cupom cadastrado</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
            Crie seu primeiro cupom para incentivar novos agendamentos e fidelizar clientes.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            Criar Primeiro Cupom
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {coupons.map((coupon) => {
            const isExpired = coupon.validUntil && new Date() > new Date(coupon.validUntil);
            const isMaxReached = coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses;
            const isInactive = !coupon.isActive || isExpired || isMaxReached;

            return (
              <div
                key={coupon.id}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 transition-all shadow-xs flex flex-col justify-between ${
                  isInactive
                    ? 'border-slate-200 dark:border-slate-800 opacity-80'
                    : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md'
                }`}
              >
                <div>
                  {/* Header do Card */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(coupon.code)}
                        className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-mono font-black text-sm rounded-xl border border-indigo-200/60 dark:border-indigo-800/60 flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Clique para copiar código"
                      >
                        <Tag size={13} className="text-indigo-600 dark:text-indigo-400" />
                        <span>{coupon.code}</span>
                        {copiedCode === coupon.code ? (
                          <Check size={13} className="text-emerald-600" />
                        ) : (
                          <Copy size={13} className="opacity-40" />
                        )}
                      </button>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          !coupon.isActive
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            : isExpired
                            ? 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                            : isMaxReached
                            ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        }`}
                      >
                        {!coupon.isActive
                          ? 'Inativo'
                          : isExpired
                          ? 'Expirado'
                          : isMaxReached
                          ? 'Esgotado'
                          : 'Ativo'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(coupon)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Editar Cupom"
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        onClick={() => handleToggle(coupon)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
                        title={coupon.isActive ? 'Desativar Cupom' : 'Ativar Cupom'}
                      >
                        {coupon.isActive ? (
                          <ToggleRight size={22} className="text-emerald-600" />
                        ) : (
                          <ToggleLeft size={22} className="text-slate-300 dark:text-slate-600" />
                        )}
                      </button>

                      <button
                        onClick={() => setCouponToDelete(coupon)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Excluir Cupom"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Valor do Desconto em Destaque */}
                  <div className="mb-2">
                    <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                      {coupon.discountType === 'PERCENTAGE'
                        ? `${coupon.discountValue}% OFF`
                        : `R$ ${Number(coupon.discountValue).toFixed(2)} OFF`}
                    </span>
                    {coupon.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{coupon.description}</p>
                    )}
                  </div>

                  {/* Informações e Regras */}
                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {coupon.minOrderValue && (
                      <p className="flex items-center gap-1.5">
                        <DollarSign size={13} className="text-slate-400" />
                        <span>Válido para serviços a partir de <strong>R$ {Number(coupon.minOrderValue).toFixed(2)}</strong></span>
                      </p>
                    )}

                    {coupon.professional && (
                      <p className="flex items-center gap-1.5">
                        <User size={13} className="text-indigo-500" />
                        <span>Exclusivo para: <strong>{coupon.professional.name}</strong></span>
                      </p>
                    )}

                    {coupon.validUntil && (
                      <p className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-slate-400" />
                        <span>
                          Válido até <strong>{new Date(coupon.validUntil).toLocaleDateString('pt-BR')}</strong>
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Rodapé: Contador de Usos */}
                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Utilizações:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {coupon.usedCount} {coupon.maxUses ? `/ ${coupon.maxUses} max` : 'usos'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Criar / Editar Cupom */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl my-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  {editingCoupon ? <Pencil size={16} /> : <Tag size={16} />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                    {editingCoupon ? 'Editar Cupom de Desconto' : 'Novo Cupom de Desconto'}
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    {editingCoupon ? 'Atualize as regras e descontos deste cupom.' : 'Configure descontos e regras para sua clientela.'}
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
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Código do Cupom * (letras maiúsculas e números)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: VERAO10, CLIENTEVIP"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase tracking-wider"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Descrição Interna (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Campanha de Dia dos Namorados"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Tipo e Valor de Desconto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Tipo de Desconto *
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  >
                    <option value="PERCENTAGE">Porcentagem (%)</option>
                    <option value="FIXED">Valor Fixo (R$)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Valor do Desconto * ({formData.discountType === 'PERCENTAGE' ? '%' : 'R$'})
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={formData.discountType === 'PERCENTAGE' ? 100 : 9999}
                    step={formData.discountType === 'PERCENTAGE' ? '1' : '0.5'}
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Regras Avançadas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Valor Mínimo do Serviço (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Sem mínimo"
                    value={formData.minOrderValue}
                    onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Limite Máximo de Usos
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Ilimitado"
                    value={formData.maxUses}
                    onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Exclusivo para Profissional
                  </label>
                  <select
                    value={formData.professionalId}
                    onChange={(e) => setFormData({ ...formData, professionalId: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Qualquer profissional</option>
                    {professionals.map((prof) => (
                      <option key={prof.id} value={prof.id}>
                        {prof.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Válido até (Data Limite)
                  </label>
                  <input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
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
                  ) : editingCoupon ? (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Salvar Alterações</span>
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      <span>Criar Cupom</span>
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
        isOpen={Boolean(couponToDelete)}
        onClose={() => setCouponToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir Cupom"
        description={`Tem certeza que deseja excluir o cupom "${couponToDelete?.code}"? Clientes que tentarem usá-lo não receberão mais desconto.`}
        loading={deleting}
      />
    </div>
  );
};
