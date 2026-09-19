import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { ShoppingBag, Plus, Trash2, Loader2, X, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DeleteConfirmationModal } from '../../components/DeleteConfirmationModal';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [features, setFeatures] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Deletion state
  const [productToDelete, setProductToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 45.0,
    promotionalPrice: '',
    category: '',
    stock: 20,
    sku: '',
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get('/products'),
      api.get('/subscriptions/me/features'),
    ])
      .then(([prodRes, featRes]) => {
        setProducts(prodRes.data);
        setFeatures(featRes.data);
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
      await api.post('/products', {
        ...formData,
        price: Number(formData.price),
        promotionalPrice: formData.promotionalPrice ? Number(formData.promotionalPrice) : undefined,
        stock: formData.stock !== undefined ? Number(formData.stock) : undefined,
      });
      setModalOpen(false);
      setFormData({
        name: '',
        description: '',
        price: 45.0,
        promotionalPrice: '',
        category: '',
        stock: 20,
        sku: '',
      });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao cadastrar produto');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/products/${productToDelete.id}`);
      setProductToDelete(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao excluir produto');
    } finally {
      setDeleting(false);
    }
  };

  const isFeatureAllowed = features?.features?.products;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Produtos</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Gerencie o catálogo de produtos para venda no seu estabelecimento.
          </p>
        </div>

        {isFeatureAllowed && (
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-sm shadow-indigo-200 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Novo Produto</span>
          </button>
        )}
      </div>

      {!isFeatureAllowed && (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-900">Recurso Indisponível no seu Plano</h4>
              <p className="text-xs text-amber-700 mt-0.5">
                O catálogo e controle de produtos está disponível a partir do plano <strong>Professional</strong>.
              </p>
            </div>
          </div>
          <Link
            to="/subscription"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0"
          >
            Fazer Upgrade Agora
          </Link>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <ShoppingBag size={40} className="mx-auto text-slate-300 mb-3" />
          <h3 className="font-bold text-slate-700 text-base">Nenhum produto cadastrado</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Cadastre pomadas, shampoos, óleos e outros produtos que você vende para seus clientes.
          </p>
          {isFeatureAllowed && (
            <button
              onClick={() => setModalOpen(true)}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              Adicionar Primeiro Produto
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((prod) => (
            <div
              key={prod.id}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {prod.category || 'Geral'}
                  </span>
                  <button
                    onClick={() => setProductToDelete(prod)}
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                    title="Excluir Produto"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <h3 className="font-bold text-slate-900 text-sm mb-1">{prod.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                  {prod.description || 'Sem descrição.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 text-[11px]">Estoque: </span>
                  <strong className="text-slate-700">{prod.stock || 0} un</strong>
                </div>
                <div className="font-black text-slate-900 text-sm">
                  R$ {Number(prod.price).toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Novo Produto */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base">Novo Produto</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nome do Produto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pomada Modeladora Matte 150g"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Preço de Venda (R$) *</label>
                  <input
                    type="number"
                    required
                    step="0.5"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Estoque Inicial</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Categoria (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Barba, Cuidados Diários..."
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Descrição</label>
                <textarea
                  rows={2}
                  placeholder="Instruções de uso e benefícios..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="animate-spin" size={14} /> : 'Salvar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Caixa Personalizada para Exclusão de Produto */}
      <DeleteConfirmationModal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir Produto"
        description="Tem certeza que deseja excluir este produto do seu catálogo de vendas?"
        itemName={productToDelete ? `${productToDelete.name} (R$ ${Number(productToDelete.price).toFixed(2)})` : undefined}
        loading={deleting}
        confirmButtonText="Sim, Excluir Produto"
      />
    </div>
  );
};
