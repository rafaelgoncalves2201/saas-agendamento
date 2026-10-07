import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import {
  Package,
  Plus,
  Trash2,
  Loader2,
  X,
  AlertTriangle,
  ArrowUpDown,
  Edit2,
  Archive,
  RotateCcw,
  Clock,
  Search,
  CheckCircle2,
  Boxes,
  ArrowUpRight,
  ArrowDownRight,
  SlidersHorizontal,
  MessageSquare,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { DeleteConfirmationModal } from '../../components/DeleteConfirmationModal';

interface ProductItem {
  id: string;
  name: string;
  type: string;
  unit: string;
  sku?: string | null;
  stock: number;
  minStock: number;
  cost: number | string;
  price?: number | string;
  notes?: string | null;
  description?: string | null;
  isArchived: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface StockMovement {
  id: string;
  type: 'ENTRY' | 'EXIT' | 'ADJUSTMENT';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string | null;
  cost?: number | string | null;
  createdAt: string;
  product?: {
    id: string;
    name: string;
    unit: string;
    type: string;
  };
}

export const ProductsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stock' | 'history'>('stock');
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [stats, setStats] = useState({ totalActive: 0, lowStock: 0, totalArchived: 0 });
  const [features, setFeatures] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [showArchived, setShowArchived] = useState(false);

  // Modals
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProductItem | null>(null);
  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [selectedItemForMovement, setSelectedItemForMovement] = useState<ProductItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Deletion
  const [productToDelete, setProductToDelete] = useState<ProductItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // WhatsApp Alert States
  const [alertingProductId, setAlertingProductId] = useState<string | null>(null);
  const [alertingAll, setAlertingAll] = useState(false);
  const [alertSuccessMsg, setAlertSuccessMsg] = useState<string | null>(null);

  // Item Form Data (Matching image media_1790196496721.png)
  const [formData, setFormData] = useState({
    name: '',
    type: 'Insumo atendimento',
    unit: 'un',
    sku: '',
    stock: 0,
    minStock: 0,
    cost: 0,
    notes: '',
  });

  // Movement Form Data
  const [movementData, setMovementData] = useState<{
    type: 'ENTRY' | 'EXIT' | 'ADJUSTMENT';
    quantity: number;
    reason: string;
  }>({
    type: 'ENTRY',
    quantity: 1,
    reason: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, statsRes, featRes] = await Promise.all([
        api.get('/products', {
          params: {
            isArchived: showArchived ? 'true' : 'false',
            search: searchTerm || undefined,
            type: selectedType !== 'ALL' ? selectedType : undefined,
          },
        }),
        api.get('/products/stats'),
        api.get('/subscriptions/me/features'),
      ]);

      setProducts(prodRes.data);
      setStats(statsRes.data);
      setFeatures(featRes.data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setFeatures((prev: any) => ({
          ...prev,
          features: { ...prev?.features, inventory: false, inventoryControl: false },
        }));
      }
      console.error('Erro ao carregar dados do estoque:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMovements = async () => {
    try {
      const res = await api.get('/products/movements');
      setMovements(res.data);
    } catch (err) {
      console.error('Erro ao buscar histórico de movimentações:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [showArchived, selectedType]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchMovements();
    }
  }, [activeTab]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      type: 'Insumo atendimento',
      unit: 'un',
      sku: '',
      stock: 0,
      minStock: 0,
      cost: 0,
      notes: '',
    });
    setItemModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item: ProductItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      type: item.type || 'Insumo atendimento',
      unit: item.unit || 'un',
      sku: item.sku || '',
      stock: item.stock || 0,
      minStock: item.minStock || 0,
      cost: Number(item.cost || 0),
      notes: item.notes || '',
    });
    setItemModalOpen(true);
  };

  // Open Movement Modal
  const handleOpenMovementModal = (item: ProductItem) => {
    setSelectedItemForMovement(item);
    setMovementData({
      type: 'ENTRY',
      quantity: 1,
      reason: '',
    });
    setMovementModalOpen(true);
  };

  // Submit Create or Edit Item
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Por favor, informe o nome do item.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingItem) {
        await api.patch(`/products/${editingItem.id}`, {
          name: formData.name,
          type: formData.type,
          unit: formData.unit,
          sku: formData.sku || null,
          stock: Number(formData.stock),
          minStock: Number(formData.minStock),
          cost: Number(formData.cost),
          notes: formData.notes || null,
        });
      } else {
        await api.post('/products', {
          name: formData.name,
          type: formData.type,
          unit: formData.unit,
          sku: formData.sku || null,
          stock: Number(formData.stock),
          minStock: Number(formData.minStock),
          cost: Number(formData.cost),
          notes: formData.notes || null,
        });
      }
      setItemModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao salvar item no estoque');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Movement
  const handleSaveMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForMovement) return;

    if (movementData.quantity <= 0) {
      alert('A quantidade deve ser maior que zero.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/products/${selectedItemForMovement.id}/movements`, {
        type: movementData.type,
        quantity: Number(movementData.quantity),
        reason: movementData.reason || undefined,
      });
      setMovementModalOpen(false);
      fetchData();
      if (activeTab === 'history') fetchMovements();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao registrar movimentação');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Archive
  const handleToggleArchive = async (item: ProductItem) => {
    try {
      await api.patch(`/products/${item.id}/archive`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao alterar arquivamento do item.');
    }
  };

  // Delete Item
  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/products/${productToDelete.id}`);
      setProductToDelete(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao excluir item do estoque');
    } finally {
      setDeleting(false);
    }
  };

  // Disparar alerta individual para os profissionais via WhatsApp
  const handleSendProductAlert = async (item: ProductItem) => {
    setAlertingProductId(item.id);
    try {
      const res = await api.post(`/products/${item.id}/alert`);
      const sentCount = res.data?.sentCount ?? 0;
      setAlertSuccessMsg(
        `Alerta de reposição de "${item.name}" enviado via WhatsApp com sucesso para os profissionais (${sentCount} enviados)!`,
      );
      setTimeout(() => setAlertSuccessMsg(null), 6000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao disparar alerta via WhatsApp');
    } finally {
      setAlertingProductId(null);
    }
  };

  // Disparar alerta consolidado de todos os itens com estoque baixo
  const handleSendAllLowStockAlerts = async () => {
    if (stats.lowStock === 0) {
      alert('Não há itens com estoque baixo no momento.');
      return;
    }

    if (
      !confirm(
        `Deseja enviar uma notificação no WhatsApp de todos os profissionais com os ${stats.lowStock} itens em falta?`,
      )
    ) {
      return;
    }

    setAlertingAll(true);
    try {
      const res = await api.post('/products/alert-all');
      const sentCount = res.data?.sentCount ?? 0;
      setAlertSuccessMsg(
        `Relatório consolidado de reposição (${stats.lowStock} itens) enviado via WhatsApp para os profissionais!`,
      );
      setTimeout(() => setAlertSuccessMsg(null), 6000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao enviar alerta via WhatsApp');
    } finally {
      setAlertingAll(false);
    }
  };

  const isFeatureAllowed =
    Boolean(features?.features?.inventoryControl || features?.features?.inventory || features?.features?.products);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-white">
            Controle de Estoque & Insumos
          </h1>
          <p className="text-sm text-stone-500 dark:text-slate-400 mt-0.5">
            Gerencie os insumos de atendimento, materiais de trabalho e estoque da sua empresa.
          </p>
        </div>

        {isFeatureAllowed && (
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E6D4B0] hover:bg-[#DAC295] text-stone-900 font-bold shadow-xs text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer shrink-0"
          >
            <Plus size={16} />
            <span>Novo item</span>
          </button>
        )}
      </div>

      {/* Upgrade Banner if not allowed */}
      {!isFeatureAllowed && !loading && (
        <div className="p-6 rounded-3xl bg-[#E6D4B0]/25 dark:bg-slate-800 border border-[#EAE1D2] dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-stone-900 dark:text-white text-base flex items-center gap-2">
              <Boxes className="text-stone-900 dark:text-[#E6D4B0]" size={20} />
              <span>Controle de Estoque & Insumos não habilitado</span>
            </h3>
            <p className="text-xs text-stone-500 dark:text-slate-400">
              O controle de estoque e alertas de reposição está disponível exclusivamente nos planos{' '}
              <strong>Profissional</strong> (R$ 59,90) e <strong>Premium</strong> (R$ 99,90).
            </p>
          </div>
          <Link
            to="/subscription"
            className="px-5 py-2.5 bg-[#E6D4B0] hover:bg-[#DAC295] text-stone-900 font-bold shadow-xs text-xs font-bold rounded-xl shrink-0 transition-all text-center"
          >
            Fazer Upgrade do Plano
          </Link>
        </div>
      )}

      {/* Alert Success Banner */}
      {alertSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{alertSuccessMsg}</span>
          </div>
          <button
            onClick={() => setAlertSuccessMsg(null)}
            className="text-emerald-700 dark:text-emerald-300 hover:opacity-80 p-1 cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* KPI Cards (Matches image media_1790196496722.png) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Ativos */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#EAE1D2] dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
              ATIVOS
            </span>
            <div className="text-3xl font-black text-stone-900 dark:text-white mt-1">
              {stats.totalActive}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#E6D4B0]/25 dark:bg-[#1E1713] border border-[#EAE1D2] dark:border-slate-800 flex items-center justify-center text-stone-900 dark:text-[#E6D4B0]">
            <Package size={20} />
          </div>
        </div>

        {/* Baixo */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#EAE1D2] dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                BAIXO
              </span>
              <div className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {stats.lowStock}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <AlertTriangle size={20} />
            </div>
          </div>
          {stats.lowStock > 0 && (
            <button
              type="button"
              onClick={handleSendAllLowStockAlerts}
              disabled={alertingAll}
              className="mt-3 pt-2 border-t border-[#EAE1D2] dark:border-slate-800 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Disparar aviso no WhatsApp dos profissionais para todos os itens em falta"
            >
              {alertingAll ? <Loader2 size={12} className="animate-spin text-emerald-600" /> : <MessageSquare size={12} />}
              <span>Alertar equipe no WhatsApp</span>
            </button>
          )}
        </div>

        {/* Arquivados */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#EAE1D2] dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
              ARQUIVADOS
            </span>
            <div className="text-3xl font-black text-stone-500 dark:text-slate-400 mt-1">
              {stats.totalArchived}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#E6D4B0]/25 dark:bg-[#1E1713] border border-[#EAE1D2] dark:border-slate-800 flex items-center justify-center text-stone-500 dark:text-slate-400">
            <Archive size={20} />
          </div>
        </div>
      </div>

      {/* Tabs Navigation (Estoque | Histórico) */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab('stock')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'stock'
              ? 'bg-[#1C1917] dark:bg-[#FAF8F5] text-white dark:text-stone-900 shadow-sm'
              : 'bg-white dark:bg-slate-800 text-stone-500 dark:text-slate-400 border border-[#EAE1D2] dark:border-slate-800 hover:text-stone-900 dark:hover:text-white'
          }`}
        >
          <Package size={15} />
          <span>Estoque</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-[#1C1917] dark:bg-[#FAF8F5] text-white dark:text-stone-900 shadow-sm'
              : 'bg-white dark:bg-slate-800 text-stone-500 dark:text-slate-400 border border-[#EAE1D2] dark:border-slate-800 hover:text-stone-900 dark:hover:text-white'
          }`}
        >
          <Clock size={15} />
          <span>Histórico</span>
        </button>
      </div>

      {/* TAB 1: ESTOQUE */}
      {activeTab === 'stock' && (
        <div className="space-y-4">
          {/* Filter Bar (Matches media_1790196496722.png) */}
          <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-[#EAE1D2] dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500 dark:text-slate-400"
              />
              <input
                type="text"
                placeholder="Buscar por nome ou SKU"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#FAF8F5] dark:bg-[#1E1713] border border-[#EAE1D2] dark:border-slate-800 rounded-xl text-xs text-stone-900 dark:text-white placeholder-[#78716C] dark:placeholder-[#E6D4B0]/60 focus:outline-none focus:ring-2 focus:ring-[#E6D4B0]"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 bg-[#FAF8F5] dark:bg-[#1E1713] border border-[#EAE1D2] dark:border-slate-800 rounded-xl text-xs font-semibold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E6D4B0] cursor-pointer"
              >
                <option value="ALL">Todos os tipos</option>
                <option value="Insumo atendimento">Insumo atendimento</option>
                <option value="Revenda">Revenda</option>
                <option value="Uso interno">Uso interno</option>
                <option value="Equipamento / Ferramenta">Equipamento / Ferramenta</option>
              </select>

              <button
                type="button"
                onClick={() => setShowArchived(!showArchived)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0 ${
                  showArchived
                    ? 'bg-[#E6D4B0] text-stone-900 font-bold shadow-xs border-[#E6D4B0]'
                    : 'bg-[#FAF8F5] dark:bg-[#1E1713] text-stone-500 dark:text-slate-400 border-[#EAE1D2] dark:border-slate-800 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                <Archive size={14} />
                <span>{showArchived ? 'Ver Ativos' : 'Arquivados'}</span>
              </button>
            </div>
          </div>

          {/* List of Items */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-stone-900 dark:text-[#E6D4B0]" size={32} />
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-[#EAE1D2] dark:border-slate-800 shadow-xs space-y-3">
              <div className="w-14 h-14 bg-[#E6D4B0]/25 dark:bg-[#1E1713] rounded-2xl flex items-center justify-center mx-auto text-stone-900 dark:text-[#E6D4B0]">
                <Package size={28} />
              </div>
              <h3 className="font-bold text-stone-900 dark:text-white text-base">
                {showArchived
                  ? 'Nenhum item arquivado'
                  : 'Nenhum insumo ou produto cadastrado'}
              </h3>
              <p className="text-xs text-stone-500 dark:text-slate-400 max-w-sm mx-auto">
                {showArchived
                  ? 'Você não possui itens arquivados no momento.'
                  : 'Cadastre os insumos e materiais utilizados nos seus atendimentos para controlar reposição e custos.'}
              </p>
              {!showArchived && isFeatureAllowed && (
                <button
                  onClick={handleOpenCreateModal}
                  className="px-5 py-2.5 bg-[#E6D4B0] hover:bg-[#DAC295] text-stone-900 font-bold shadow-xs text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                >
                  <Plus size={15} />
                  <span>Cadastrar Primeiro Item</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {products.map((item) => {
                const isLow = item.stock <= item.minStock;
                const costNumber = Number(item.cost || 0);

                return (
                  <div
                    key={item.id}
                    className={`bg-white dark:bg-slate-800 rounded-2xl p-4 border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs ${
                      isLow
                        ? 'border-amber-300 dark:border-amber-800/80 bg-amber-50/20 dark:bg-amber-950/10'
                        : 'border-[#EAE1D2] dark:border-slate-800'
                    }`}
                  >
                    {/* Left: Icon & Info */}
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-[#E6D4B0]/25 dark:bg-[#1E1713] border border-[#EAE1D2] dark:border-slate-800 flex items-center justify-center text-stone-900 dark:text-[#E6D4B0] shrink-0">
                        <Package size={22} />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-stone-900 dark:text-white text-sm">
                            {item.name}
                          </h3>
                          <span className="px-2.5 py-0.5 bg-[#E6D4B0]/25 dark:bg-[#1E1713] border border-[#EAE1D2] dark:border-slate-800 rounded-full text-[10px] font-bold text-stone-900 dark:text-[#E6D4B0]">
                            {item.type || 'Insumo de atendimento'}
                          </span>
                          {isLow && (
                            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded-full text-[10px] font-bold flex items-center gap-1">
                              <AlertTriangle size={11} />
                              <span>Estoque Baixo</span>
                            </span>
                          )}
                          {item.isArchived && (
                            <span className="px-2 py-0.5 bg-[#EAE1D2] dark:bg-[#1E293B] text-stone-500 dark:text-slate-400 rounded-full text-[10px] font-bold">
                              Arquivado
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-xs flex-wrap">
                          <div className="flex items-baseline gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                              SALDO:
                            </span>
                            <span
                              className={`font-black text-sm ${
                                isLow
                                  ? 'text-amber-700 dark:text-amber-400'
                                  : 'text-stone-900 dark:text-white'
                              }`}
                            >
                              {item.stock} {item.unit || 'un'}
                            </span>
                          </div>

                          {item.minStock > 0 && (
                            <span className="text-stone-500 dark:text-slate-400">
                              Mínimo: <strong>{item.minStock} {item.unit}</strong>
                            </span>
                          )}

                          {costNumber > 0 && (
                            <span className="text-stone-500 dark:text-slate-400">
                              Custo: <strong>R$ {costNumber.toFixed(2)}</strong>
                            </span>
                          )}

                          {item.sku && (
                            <span className="text-stone-500 dark:text-slate-400 font-mono text-[11px]">
                              SKU: {item.sku}
                            </span>
                          )}
                        </div>

                        {item.notes && (
                          <p className="text-[11px] text-stone-500 dark:text-slate-400 italic">
                            Nota: {item.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-[#EAE1D2] dark:border-slate-800 shrink-0 justify-end flex-wrap">
                      {isLow && (
                        <button
                          type="button"
                          onClick={() => handleSendProductAlert(item)}
                          disabled={alertingProductId === item.id}
                          title="Enviar alerta de reposição via WhatsApp para a equipe de profissionais"
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                        >
                          {alertingProductId === item.id ? (
                            <Loader2 size={13} className="animate-spin text-emerald-600" />
                          ) : (
                            <MessageSquare size={13} className="text-emerald-600 dark:text-emerald-400" />
                          )}
                          <span>Avisar no WhatsApp</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenMovementModal(item)}
                        className="px-3.5 py-1.5 bg-[#E6D4B0]/25 hover:bg-[#FAF8F5] dark:bg-[#201812] dark:hover:bg-[#2C211A] text-stone-900 dark:text-[#E6D4B0] border border-[#EAE1D2] dark:border-[#4A3728] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <ArrowUpDown size={13} />
                        <span>Movimentar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(item)}
                        className="px-3 py-1.5 bg-white hover:bg-[#FAF8F5] dark:bg-slate-800 dark:hover:bg-[#1E1713] text-stone-900 dark:text-white border border-[#EAE1D2] dark:border-slate-800 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Edit2 size={13} />
                        <span>Editar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleArchive(item)}
                        title={item.isArchived ? 'Desarquivar item' : 'Arquivar item'}
                        className="p-2 text-stone-500 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-[#FAF8F5] dark:hover:bg-[#1E1713] transition-all cursor-pointer"
                      >
                        {item.isArchived ? <RotateCcw size={15} /> : <Archive size={15} />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setProductToDelete(item)}
                        title="Excluir item permanentemente"
                        className="p-2 text-red-500 hover:text-red-700 dark:hover:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: HISTÓRICO DE MOVIMENTAÇÕES */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-[#EAE1D2] dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-[#EAE1D2] dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-white">
                Histórico de Movimentações
              </h2>
              <p className="text-xs text-stone-500 dark:text-slate-400">
                Registro de todas as entradas, saídas e ajustes de saldo realizados no estoque.
              </p>
            </div>
            <button
              onClick={fetchMovements}
              className="text-xs font-bold text-stone-900 dark:text-[#E6D4B0] hover:underline cursor-pointer"
            >
              Atualizar
            </button>
          </div>

          {movements.length === 0 ? (
            <div className="p-12 text-center text-xs text-stone-500 dark:text-slate-400">
              Nenhuma movimentação registrada até o momento.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F5] dark:bg-[#1E1713] text-stone-500 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#EAE1D2] dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Data / Hora</th>
                    <th className="py-3 px-4">Insumo / Item</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4 text-center">Quantidade</th>
                    <th className="py-3 px-4 text-center">Saldo (Antes → Depois)</th>
                    <th className="py-3 px-4">Motivo / Observação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE1D2] dark:divide-[#1E293B] text-stone-900 dark:text-white">
                  {movements.map((m) => {
                    const isEntry = m.type === 'ENTRY';
                    const isExit = m.type === 'EXIT';
                    const dateFormatted = new Date(m.createdAt).toLocaleString('pt-BR', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    });

                    return (
                      <tr key={m.id} className="hover:bg-[#FAF8F5] dark:hover:bg-[#1E1713]/60 transition-colors">
                        <td className="py-3 px-4 text-stone-500 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">
                          {dateFormatted}
                        </td>
                        <td className="py-3 px-4 font-bold">
                          {m.product?.name || 'Item do estoque'}
                          {m.product?.unit ? ` (${m.product.unit})` : ''}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              isEntry
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : isExit
                                ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                            }`}
                          >
                            {isEntry ? <ArrowUpRight size={11} /> : isExit ? <ArrowDownRight size={11} /> : <SlidersHorizontal size={11} />}
                            <span>
                              {isEntry ? 'Entrada' : isExit ? 'Saída' : 'Ajuste'}
                            </span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold">
                          <span
                            className={
                              isEntry
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : isExit
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-blue-600 dark:text-blue-400'
                            }
                          >
                            {isEntry ? `+${m.quantity}` : isExit ? `-${m.quantity}` : `=${m.quantity}`}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-stone-500 dark:text-slate-400 font-mono">
                          {m.previousStock} → <strong className="text-stone-900 dark:text-white">{m.newStock}</strong>
                        </td>
                        <td className="py-3 px-4 text-stone-500 dark:text-slate-400">
                          {m.reason || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: NOVO ITEM / EDITAR ITEM (Matches media_1790196496721.png) */}
      {itemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#EAE1D2] dark:border-slate-800 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE1D2] dark:border-slate-800">
              <h2 className="text-lg font-bold text-stone-900 dark:text-white">
                {editingItem ? 'Editar item' : 'Novo item'}
              </h2>
              <button
                onClick={() => setItemModalOpen(false)}
                className="text-stone-500 hover:text-stone-900 dark:hover:text-white p-1 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-5">
              {/* SECTION: IDENTIFICAÇÃO */}
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 dark:text-slate-400">
                  IDENTIFICAÇÃO
                </span>

                <div>
                  <label className="block text-xs font-bold text-stone-900 dark:text-white mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex.: Gel base"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] dark:bg-[#1E1713] border border-[#EAE1D2] dark:border-slate-800 rounded-xl text-xs text-stone-900 dark:text-white focus:ring-2 focus:ring-[#E6D4B0] focus:outline-none font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-900 dark:text-white mb-1">
                      Tipo
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2.5 bg-[#FAF8F5] dark:bg-[#1E1713] border border-[#EAE1D2] dark:border-slate-800 rounded-xl text-xs text-stone-900 dark:text-white focus:ring-2 focus:ring-[#E6D4B0] focus:outline-none cursor-pointer font-medium"
                    >
                      <option value="Insumo atendimento">Insumo atendimento</option>
                      <option value="Revenda">Revenda</option>
                      <option value="Uso interno">Uso interno</option>
                      <option value="Equipamento / Ferramenta">Equipamento / Ferramenta</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-900 dark:text-white mb-1">
                      Unidade
                    </label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-3 py-2.5 bg-[#FAF8F5] dark:bg-[#1E1713] border border-[#EAE1D2] dark:border-slate-800 rounded-xl text-xs text-stone-900 dark:text-white focus:ring-2 focus:ring-[#E6D4B0] focus:outline-none cursor-pointer font-medium"
                    >
                      <option value="un">un (Unidade)</option>
                      <option value="ml">ml (Mililitros)</option>
                      <option value="g">g (Gramas)</option>
                      <option value="kg">kg (Quilos)</option>
                      <option value="cx">cx (Caixa)</option>
                      <option value="pct">pct (Pacote)</option>
                      <option value="par">par (Pares)</option>
                      <option value="frasco">frasco</option>
                      <option value="rolo">rolo</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-900 dark:text-white mb-1">
                    SKU opcional
                  </label>
                  <input
                    type="text"
                    placeholder="Código interno"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] dark:bg-[#1E1713] border border-[#EAE1D2] dark:border-slate-800 rounded-xl text-xs text-stone-900 dark:text-white focus:ring-2 focus:ring-[#E6D4B0] focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* SECTION: CONTROLE */}
              <div className="space-y-3 pt-2 border-t border-[#EAE1D2] dark:border-slate-800">
                <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 dark:text-slate-400">
                  CONTROLE
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-900 dark:text-white mb-1">
                      {editingItem ? 'Saldo atual' : 'Saldo inicial'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F5] dark:bg-[#1E1713] border border-[#EAE1D2] dark:border-slate-800 rounded-xl text-xs text-stone-900 dark:text-white focus:ring-2 focus:ring-[#E6D4B0] focus:outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-900 dark:text-white mb-1">
                      Estoque mínimo
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.minStock}
                      onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F5] dark:bg-[#1E1713] border border-[#EAE1D2] dark:border-slate-800 rounded-xl text-xs text-stone-900 dark:text-white focus:ring-2 focus:ring-[#E6D4B0] focus:outline-none font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-900 dark:text-white mb-1">
                    Custo
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-500 dark:text-slate-400">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] dark:bg-[#1E1713] border border-[#EAE1D2] dark:border-slate-800 rounded-xl text-xs text-stone-900 dark:text-white focus:ring-2 focus:ring-[#E6D4B0] focus:outline-none font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION: NOTAS */}
              <div className="space-y-2 pt-2 border-t border-[#EAE1D2] dark:border-slate-800">
                <label className="block text-xs font-bold text-stone-900 dark:text-white">
                  Notas
                </label>
                <textarea
                  rows={2}
                  placeholder="Fornecedor, referência ou observação interna"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] dark:bg-[#1E1713] border border-[#EAE1D2] dark:border-slate-800 rounded-xl text-xs text-stone-900 dark:text-white focus:ring-2 focus:ring-[#E6D4B0] focus:outline-none resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EAE1D2] dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setItemModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-stone-500 hover:text-stone-900 dark:hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-[#E6D4B0] hover:bg-[#DAC295] text-stone-900 font-bold shadow-xs text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  <span>{editingItem ? 'Salvar alterações' : 'Salvar item'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: MOVIMENTAR ESTOQUE (Entrada, Saída, Ajuste) */}
      {movementModalOpen && selectedItemForMovement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#EAE1D2] dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE1D2] dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-stone-900 dark:text-white">
                  Movimentar Estoque
                </h2>
                <p className="text-xs text-stone-500 dark:text-slate-400">
                  {selectedItemForMovement.name} (Saldo atual:{' '}
                  <strong>
                    {selectedItemForMovement.stock} {selectedItemForMovement.unit}
                  </strong>
                  )
                </p>
              </div>
              <button
                onClick={() => setMovementModalOpen(false)}
                className="text-stone-500 hover:text-stone-900 dark:hover:text-white p-1 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveMovement} className="space-y-4">
              {/* Type Selection */}
              <div>
                <label className="block text-xs font-bold text-stone-900 dark:text-white mb-2">
                  Tipo de Movimentação
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMovementData({ ...movementData, type: 'ENTRY' })}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      movementData.type === 'ENTRY'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-200'
                        : 'border-[#EAE1D2] dark:border-slate-800 text-stone-500 dark:text-slate-400'
                    }`}
                  >
                    <ArrowUpRight size={16} />
                    <span>Entrada (+)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMovementData({ ...movementData, type: 'EXIT' })}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      movementData.type === 'EXIT'
                        ? 'bg-red-50 dark:bg-red-950/60 border-red-500 text-red-800 dark:text-red-200'
                        : 'border-[#EAE1D2] dark:border-slate-800 text-stone-500 dark:text-slate-400'
                    }`}
                  >
                    <ArrowDownRight size={16} />
                    <span>Saída (-)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMovementData({ ...movementData, type: 'ADJUSTMENT' })}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      movementData.type === 'ADJUSTMENT'
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-800 dark:text-blue-200'
                        : 'border-[#EAE1D2] dark:border-slate-800 text-stone-500 dark:text-slate-400'
                    }`}
                  >
                    <SlidersHorizontal size={16} />
                    <span>Ajuste (=)</span>
                  </button>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-bold text-stone-900 dark:text-white mb-1">
                  {movementData.type === 'ADJUSTMENT'
                    ? 'Novo Saldo Total'
                    : 'Quantidade a Movimentar'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    required
                    value={movementData.quantity}
                    onChange={(e) =>
                      setMovementData({ ...movementData, quantity: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] dark:bg-[#1E1713] border border-[#EAE1D2] dark:border-slate-800 rounded-xl text-sm font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-[#E6D4B0] focus:outline-none"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-500 dark:text-slate-400">
                    {selectedItemForMovement.unit}
                  </span>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-stone-900 dark:text-white mb-1">
                  Motivo / Observação
                </label>
                <input
                  type="text"
                  placeholder="Ex: Uso em atendimento de Lash, Compra NF 1234, etc."
                  value={movementData.reason}
                  onChange={(e) =>
                    setMovementData({ ...movementData, reason: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] dark:bg-[#1E1713] border border-[#EAE1D2] dark:border-slate-800 rounded-xl text-xs text-stone-900 dark:text-white focus:ring-2 focus:ring-[#E6D4B0] focus:outline-none"
                />
              </div>

              {/* Dynamic Restock WhatsApp Notice */}
              {(() => {
                const qty = Number(movementData.quantity || 0);
                const currentStock = selectedItemForMovement.stock;
                let estimated = currentStock;
                if (movementData.type === 'ENTRY') estimated = currentStock + qty;
                else if (movementData.type === 'EXIT') estimated = currentStock - qty;
                else if (movementData.type === 'ADJUSTMENT') estimated = qty;

                const willBeCritical =
                  movementData.type !== 'ENTRY' &&
                  ((selectedItemForMovement.minStock > 0 && estimated <= selectedItemForMovement.minStock) ||
                    (currentStock > 0 && estimated === 0));

                if (!willBeCritical) return null;

                return (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                    <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="font-bold block">Aviso de Estoque Crítico</span>
                      <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-400">
                        O novo saldo será de <strong>{estimated} {selectedItemForMovement.unit}</strong> (mínimo: {selectedItemForMovement.minStock} {selectedItemForMovement.unit}). Um alerta de reposição será enviado via WhatsApp para a equipe de profissionais.
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EAE1D2] dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setMovementModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-stone-500 hover:text-stone-900 dark:hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-[#E6D4B0] hover:bg-[#DAC295] text-stone-900 font-bold shadow-xs text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  <span>Confirmar Movimentação</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <DeleteConfirmationModal
          isOpen={true}
          title="Excluir Item do Estoque"
          description={`Deseja realmente excluir "${productToDelete.name}"? Todo o histórico de movimentações deste insumo será removido permanentemente.`}
          onConfirm={handleConfirmDelete}
          onClose={() => setProductToDelete(null)}
          loading={deleting}
        />
      )}
    </div>
  );
};
