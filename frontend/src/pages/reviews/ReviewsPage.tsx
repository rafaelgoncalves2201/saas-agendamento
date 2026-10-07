import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import {
  Star,
  MessageSquare,
  ThumbsUp,
  Eye,
  EyeOff,
  Trash2,
  Loader2,
  Calendar,
  User,
  Scissors,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const ReviewsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchReviews = () => {
    setLoading(true);
    api.get('/reviews')
      .then((res) => setData(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleToggleApproval = async (id: string) => {
    setTogglingId(id);
    try {
      await api.patch(`/reviews/${id}/toggle`);
      fetchReviews();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao alterar visibilidade');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Deseja realmente excluir esta avaliação?')) return;
    try {
      await api.delete(`/reviews/${id}`);
      fetchReviews();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao excluir');
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1 text-amber-400">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={star <= rating ? 'fill-amber-400 text-amber-400' : 'text-[#D0C3B2] dark:text-[#334155]'}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-stone-900 dark:text-[#E6D4B0]" size={32} />
      </div>
    );
  }

  const reviews = data?.reviews || [];
  const average = Number(data?.averageRating || 5.0).toFixed(1);
  const totalCount = data?.totalCount || 0;
  const fiveStars = data?.fiveStars || 0;
  const fourStars = data?.fourStars || 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-white">Avaliações dos Clientes</h1>
        <p className="text-sm text-stone-500 dark:text-slate-400 mt-0.5">
          Acompanhe o nível de satisfação das clientes e modere os depoimentos exibidos na sua página pública.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-[#EAE1D2] dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-500 dark:text-slate-400 uppercase tracking-wider">
              Nota Média Geral
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-stone-900 dark:text-white">{average}</span>
              <span className="text-xs text-stone-500 dark:text-slate-400">de 5.0</span>
            </div>
            <div className="mt-1">{renderStars(Math.round(Number(average)))}</div>
          </div>
          <div className="p-3 bg-[#E6D4B0]/25 dark:bg-[#E6D4B0]/15 text-stone-900 dark:text-[#E6D4B0] rounded-2xl">
            <Star size={24} className="fill-[#E6D4B0] text-stone-900 dark:text-[#E6D4B0]" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-[#EAE1D2] dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-500 dark:text-slate-400 uppercase tracking-wider">
              Total de Avaliações
            </p>
            <h3 className="text-3xl font-bold text-stone-900 dark:text-white mt-1">{totalCount}</h3>
            <p className="text-xs text-stone-500 dark:text-slate-400 mt-1">Opiniões registradas</p>
          </div>
          <div className="p-3 bg-[#E6D4B0]/25 dark:bg-[#E6D4B0]/15 text-stone-900 dark:text-[#E6D4B0] rounded-2xl">
            <MessageSquare size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-[#EAE1D2] dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-500 dark:text-slate-400 uppercase tracking-wider">
              5 Estrelas (Excelente)
            </p>
            <h3 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{fiveStars}</h3>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
              {totalCount > 0 ? Math.round((fiveStars / totalCount) * 100) : 100}% de aprovação máxima
            </p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <ThumbsUp size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-[#EAE1D2] dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-500 dark:text-slate-400 uppercase tracking-wider">
              4 Estrelas (Muito Bom)
            </p>
            <h3 className="text-3xl font-bold text-stone-900 dark:text-white mt-1">{fourStars}</h3>
            <p className="text-xs text-stone-500 dark:text-slate-400 mt-1">Clientes satisfeitos</p>
          </div>
          <div className="p-3 bg-[#E6D4B0]/25 dark:bg-[#E6D4B0]/15 text-stone-900 dark:text-[#E6D4B0] rounded-2xl">
            <Star size={24} />
          </div>
        </div>
      </div>

      {/* Lista de Avaliações */}
      {reviews.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-[#EAE1D2] dark:border-slate-800 p-8 shadow-xs">
          <Star size={40} className="mx-auto text-stone-500 dark:text-slate-400 mb-3 opacity-60" />
          <h3 className="font-bold text-stone-900 dark:text-white text-base">Nenhuma avaliação recebida ainda</h3>
          <p className="text-xs text-stone-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Assim que seus clientes concluírem os atendimentos, eles poderão avaliar e deixar depoimentos na tela de acompanhamento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reviews.map((rev: any) => {
            const isToggling = togglingId === rev.id;
            return (
              <div
                key={rev.id}
                className="bg-white dark:bg-slate-900 border border-[#EAE1D2] dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-stone-900 dark:text-white text-base">{rev.clientName}</h4>
                      <span className="text-[11px] text-stone-500 dark:text-slate-400">
                        {format(new Date(rev.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </span>
                    </div>
                    {renderStars(rev.rating)}
                  </div>

                  {rev.comment ? (
                    <p className="text-xs text-stone-900 dark:text-white italic bg-[#FAF8F5] dark:bg-slate-800 p-3 rounded-xl border border-[#EAE1D2] dark:border-slate-800 leading-relaxed">
                      "{rev.comment}"
                    </p>
                  ) : (
                    <p className="text-xs text-stone-500 dark:text-slate-400 italic">Sem comentário por escrito.</p>
                  )}

                  <div className="flex items-center gap-3 text-[11px] text-stone-500 dark:text-slate-400 pt-1">
                    {rev.service && (
                      <span className="flex items-center gap-1">
                        <Scissors size={12} className="text-stone-900 dark:text-[#E6D4B0]" /> {rev.service.name}
                      </span>
                    )}
                    {rev.professional && (
                      <span className="flex items-center gap-1">
                        <User size={12} className="text-stone-900 dark:text-[#E6D4B0]" /> {rev.professional.name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-[#EAE1D2] dark:border-[#33251D] flex items-center justify-between">
                  <button
                    onClick={() => handleToggleApproval(rev.id)}
                    disabled={isToggling}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      rev.isApproved
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-[#E6D4B0]/25 dark:bg-slate-800 text-stone-500 dark:text-slate-400 border border-[#E6D4B0] dark:border-slate-800'
                    }`}
                  >
                    {rev.isApproved ? <Eye size={14} /> : <EyeOff size={14} />}
                    <span>{rev.isApproved ? 'Visível no Site' : 'Oculto do Site'}</span>
                  </button>

                  <button
                    onClick={() => handleDelete(rev.id)}
                    className="p-2 text-stone-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors cursor-pointer border border-[#EAE1D2] dark:border-slate-800"
                    title="Excluir avaliação"
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
  );
};

