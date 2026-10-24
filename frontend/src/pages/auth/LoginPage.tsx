import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { Logo } from '../../components/brand/Logo';
import { ThemeToggle } from '../../components/ThemeToggle';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', { email, password });
      setAuth(data.user, data.accessToken, data.refreshToken);

      if (data.user.role === 'SUPER_ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Falha ao autenticar. Verifique seus dados.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative">
      {/* Top right theme toggle */}
      <div className="absolute top-5 right-5">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md card p-8 sm:p-10 shadow-elevated animate-scale-in">
        <div className="text-center mb-8">
          <div className="inline-flex justify-center mb-3">
            <Logo size={32} showWord={false} />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-accent mb-1">
            Inovae Agenda
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Acesse sua Conta
          </h1>
          <p className="text-sm text-foreground-muted mt-1.5">
            Gerencie seus agendamentos, clientes e equipe com elegância.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">
              E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 text-foreground-subtle" size={17} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="contato@inovaeagenda.com.br"
                className="input pl-10"
              />
            </div>
          </div>

          <div>
            <label className="label">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 text-foreground-subtle" size={17} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="input pl-10"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                <span>Entrando...</span>
              </>
            ) : (
              <>
                <span>Entrar no Painel</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-border text-center">
          <p className="text-xs text-foreground-muted">
            Ainda não tem conta?{' '}
            <Link to="/register" className="font-bold text-accent hover:underline">
              Cadastre sua Empresa
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
