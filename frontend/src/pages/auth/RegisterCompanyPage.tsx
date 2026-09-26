import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { Building2, User, Mail, Lock, Phone, ArrowRight, Loader2, Check, Sparkles, X } from 'lucide-react';

const PLAN_OPTIONS = [
  {
    id: 'BASIC',
    name: 'Básico',
    price: '29,90',
    description: 'Ideal para profissionais autônomos que buscam presença online e praticidade.',
    professionalsLimit: '1 profissional',
    appointmentsLimit: '50 agendamentos/mês',
    popular: false,
    features: [
      '1 profissional prestador',
      'Até 50 agendamentos por mês',
      'Página pública e link próprio',
      'Cadastro de clientes e serviços',
      'WhatsApp confirmação e cancelamento',
      'WhatsApp remarcação e lembretes',
    ],
    notIncluded: [
      'Sem Mercado Pago / Pagamento online',
      'Sem Pix para sinal',
      'Sem controle de estoque',
      'Apenas 1 profissional',
    ],
  },
  {
    id: 'PROFESSIONAL',
    name: 'Profissional',
    price: '59,90',
    description: 'O mais escolhido para barbearias, salões e clínicas com equipe em crescimento.',
    professionalsLimit: 'Até 5 profissionais',
    appointmentsLimit: '100 agendamentos/mês',
    popular: true,
    features: [
      'Até 5 profissionais prestadores',
      'Até 100 agendamentos por mês',
      'WhatsApp para agendamentos incluso',
      'Mercado Pago e pagamentos online',
      'Recebimento de sinal na sua chave Pix',
      'Controle e gestão de estoque completo',
      'Alertas de reposição de estoque',
    ],
    notIncluded: [],
  },
  {
    id: 'PREMIUM',
    name: 'Premium',
    price: '99,90',
    description: 'Para estabelecimentos consolidados que precisam de capacidade máxima sem limites.',
    professionalsLimit: 'Até 15 profissionais',
    appointmentsLimit: 'Agendamentos SEM LIMITE mensal',
    popular: false,
    features: [
      'Até 15 profissionais prestadores',
      'Agendamentos ilimitados todo mês',
      'WhatsApp para agendamentos incluso',
      'Mercado Pago e pagamentos online',
      'Recebimento de sinal na sua chave Pix',
      'Controle e gestão de estoque completo',
      'Todos os recursos avançados inclusos',
    ],
    notIncluded: [],
  },
];

export const RegisterCompanyPage: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [selectedPlan, setSelectedPlan] = useState<'BASIC' | 'PROFESSIONAL' | 'PREMIUM'>('PROFESSIONAL');

  const [formData, setFormData] = useState({
    companyName: '',
    companySlug: '',
    companyPhone: '',
    companyDocument: '',
    ownerName: '',
    ownerEmail: '',
    ownerPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'companyName' && !prev.companySlug) {
        next.companySlug = value
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]/g, '-');
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        ...formData,
        plan: selectedPlan,
      };

      const { data } = await api.post('/auth/register-company', payload);
      setAuth(data.user, data.accessToken, data.refreshToken);
      navigate('/dashboard');
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Falha ao registrar empresa. Verifique os dados.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 py-12 transition-colors">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 p-6 sm:p-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none mb-3">
            <Building2 size={24} />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-1">
            Inova Agenda
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">Cadastre seu Estabelecimento</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Escolha seu plano e comece hoje mesmo com 5 dias de teste grátis. Sem fidelidade.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ETAPA 1: ESCOLHA DO PLANO */}
          <div>
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                1. Escolha o Plano Desejado
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Selecione apenas 1 plano
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PLAN_OPTIONS.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id as any)}
                    className={`relative rounded-2xl p-5 border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20 shadow-md'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850'
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-3 right-4 px-3 py-0.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-sm">
                        Mais Escolhido
                      </span>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                          {plan.name}
                        </h4>
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                            isSelected
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                      </div>

                      <div className="mb-3">
                        <span className="text-2xl font-black text-slate-900 dark:text-white">
                          R$ {plan.price}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          /mês
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 min-h-[32px]">
                        {plan.description}
                      </p>

                      <div className="space-y-1.5 py-2.5 my-2 border-y border-slate-200/60 dark:border-slate-800 text-xs">
                        <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Check size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                          <span>{plan.professionalsLimit}</span>
                        </div>
                        <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Check size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                          <span>{plan.appointmentsLimit}</span>
                        </div>
                      </div>

                      <ul className="space-y-1.5 text-[11px] text-slate-700 dark:text-slate-300 mt-3">
                        {plan.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <Check size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                        {plan.notIncluded.map((notFeat, idx) => (
                          <li key={`not-${idx}`} className="flex items-start gap-1.5 text-slate-400 dark:text-slate-500">
                            <X size={13} className="text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                            <span>{notFeat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <span
                        className={`text-xs font-bold block text-center py-1.5 rounded-lg transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {isSelected ? '✓ Plano Selecionado' : 'Selecionar'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ETAPA 2: DADOS DO ESTABELECIMENTO */}
          <div>
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                2. Dados do Estabelecimento
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome da Empresa *
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                  placeholder="Ex: Studio Bella"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Identificador (Link público) *
                </label>
                <input
                  type="text"
                  name="companySlug"
                  value={formData.companySlug}
                  onChange={handleChange}
                  required
                  placeholder="studio-bella"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  WhatsApp Comercial *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 text-slate-400" size={16} />
                  <input
                    type="text"
                    name="companyPhone"
                    value={formData.companyPhone}
                    onChange={handleChange}
                    required
                    placeholder="11999998888"
                    className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  CNPJ ou CPF (Opcional)
                </label>
                <input
                  type="text"
                  name="companyDocument"
                  value={formData.companyDocument}
                  onChange={handleChange}
                  placeholder="00.000.000/0001-00"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* ETAPA 3: DADOS DO RESPONSÁVEL */}
          <div>
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                3. Dados do Responsável (Acesso)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome Completo *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 text-slate-400" size={16} />
                  <input
                    type="text"
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleChange}
                    required
                    placeholder="Nome do proprietário"
                    className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  E-mail de Login *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 text-slate-400" size={16} />
                  <input
                    type="email"
                    name="ownerEmail"
                    value={formData.ownerEmail}
                    onChange={handleChange}
                    required
                    placeholder="seu@email.com"
                    className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Senha de Acesso *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 text-slate-400" size={16} />
                  <input
                    type="password"
                    name="ownerPassword"
                    value={formData.ownerPassword}
                    onChange={handleChange}
                    required
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                <span>Cadastrar com Plano {PLAN_OPTIONS.find(p => p.id === selectedPlan)?.name} e Iniciar Teste Grátis</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Já possui conta?{' '}
          <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
            Fazer login
          </Link>
        </div>
      </div>
    </div>
  );
};
