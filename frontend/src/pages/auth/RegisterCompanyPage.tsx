import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { User, Mail, Lock, Phone, ArrowRight, Loader2, Check, Sparkles, X } from 'lucide-react';
import { Logo } from '../../components/brand/Logo';
import { ThemeToggle } from '../../components/ThemeToggle';

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
        name: formData.companyName,
        slug: formData.companySlug,
        phone: formData.companyPhone,
        document: formData.companyDocument || undefined,
        ownerName: formData.ownerName,
        ownerEmail: formData.ownerEmail,
        ownerPassword: formData.ownerPassword,
        planId: selectedPlan,
      };

      const { data } = await api.post('/auth/register', payload);
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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 py-12 relative animate-fade-in">
      <div className="absolute top-5 right-5">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-4xl card p-6 sm:p-10 shadow-elevated">
        <div className="text-center mb-8">
          <div className="inline-flex justify-center mb-3">
            <Logo size={32} showWord={false} />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-accent mb-1">
            Inovae Agenda
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Cadastre seu Estabelecimento
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            Escolha seu plano e comece hoje mesmo com 5 dias de teste grátis. Sem fidelidade.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ETAPA 1: ESCOLHA DO PLANO */}
          <div>
            <div className="border-b border-border pb-3 mb-4 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-accent">
                1. Escolha o Plano Desejado
              </h3>
              <span className="text-xs text-foreground-subtle">
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
                    className={`relative rounded-2xl p-5 border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-accent ring-2 ring-accent/30 bg-accent-soft/30 shadow-soft'
                        : 'border-border hover:border-border-strong bg-surface'
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-3 right-4 px-3 py-0.5 bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-wider rounded-full shadow-xs">
                        Mais Escolhido
                      </span>
                    )}

                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-base text-foreground">{plan.name}</h4>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                      </div>

                      <div className="mt-2 mb-3">
                        <span className="text-2xl font-black text-foreground">
                          R$ {plan.price}
                        </span>
                        <span className="text-xs text-foreground-subtle"> /mês</span>
                      </div>

                      <p className="text-xs text-foreground-muted mb-3 leading-relaxed">
                        {plan.description}
                      </p>

                      <div className="space-y-1 mb-4 p-2 bg-surface-2 rounded-xl text-[11px] font-medium text-foreground-muted border border-border">
                        <div className="flex items-center gap-1.5">
                          <Sparkles size={12} className="text-accent shrink-0" />
                          <span>{plan.professionalsLimit}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Sparkles size={12} className="text-accent shrink-0" />
                          <span>{plan.appointmentsLimit}</span>
                        </div>
                      </div>

                      <ul className="space-y-1.5 text-xs text-foreground-muted">
                        {plan.features.map((feat, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <Check size={13} className="text-success shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                        {plan.notIncluded.map((notFeat, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-foreground-subtle/70">
                            <X size={13} className="shrink-0 mt-0.5" />
                            <span>{notFeat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border">
                      <span
                        className={`text-xs font-semibold block text-center py-2 rounded-xl transition ${
                          isSelected
                            ? 'bg-accent text-accent-foreground shadow-soft'
                            : 'bg-surface-2 text-foreground-muted'
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
            <div className="border-b border-border pb-3 mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-accent">
                2. Dados do Estabelecimento
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  Nome da Empresa *
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                  placeholder="Ex: Inovae Agenda"
                  className="input"
                />
              </div>

              <div>
                <label className="label">
                  Identificador (Link público) *
                </label>
                <input
                  type="text"
                  name="companySlug"
                  value={formData.companySlug}
                  onChange={handleChange}
                  required
                  placeholder="inovae-agenda"
                  className="input"
                />
              </div>

              <div>
                <label className="label">
                  WhatsApp Comercial *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 text-foreground-subtle" size={16} />
                  <input
                    type="text"
                    name="companyPhone"
                    value={formData.companyPhone}
                    onChange={handleChange}
                    required
                    placeholder="11999998888"
                    className="input pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="label">
                  CNPJ ou CPF (Opcional)
                </label>
                <input
                  type="text"
                  name="companyDocument"
                  value={formData.companyDocument}
                  onChange={handleChange}
                  placeholder="00.000.000/0001-00"
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* ETAPA 3: DADOS DO RESPONSÁVEL */}
          <div>
            <div className="border-b border-border pb-3 mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-accent">
                3. Dados do Responsável (Acesso)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">
                  Nome Completo *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 text-foreground-subtle" size={16} />
                  <input
                    type="text"
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleChange}
                    required
                    placeholder="Nome do proprietário"
                    className="input pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="label">
                  E-mail de Login *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 text-foreground-subtle" size={16} />
                  <input
                    type="email"
                    name="ownerEmail"
                    value={formData.ownerEmail}
                    onChange={handleChange}
                    required
                    placeholder="contato@inovaeagenda.com.br"
                    className="input pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="label">
                  Senha de Acesso *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 text-foreground-subtle" size={16} />
                  <input
                    type="password"
                    name="ownerPassword"
                    value={formData.ownerPassword}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className="input pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-4 border-t border-border">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Criando seu Estabelecimento...</span>
                </>
              ) : (
                <>
                  <span>Cadastrar com Plano {PLAN_OPTIONS.find(p => p.id === selectedPlan)?.name} e Iniciar Teste Grátis</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
            <p className="text-center text-[11px] text-foreground-subtle mt-3">
              Ao cadastrar, você concorda com nossos Termos de Uso e Política de Privacidade.
            </p>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-border text-center">
          <p className="text-xs text-foreground-muted">
            Já tem uma conta cadastrada?{' '}
            <Link to="/login" className="font-bold text-accent hover:underline">
              Fazer Login no Painel
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
