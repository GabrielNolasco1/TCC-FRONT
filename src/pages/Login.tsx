import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AxiosError } from 'axios';
import { api, useAuthStore } from '../store/useAuthStore';
import type { AuthResponse, ApiError } from '../types/api';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setAuth, setRegistrationEmail, toggleTheme, theme } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post<AuthResponse>('/users/login', { email, password });
      setAuth(res.data.token, res.data.user);
      navigate('/');
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>;
      const message = axiosError.response?.data?.message;
      if (message === "USER_NOT_VALIDATED") {
        setRegistrationEmail(email);
        navigate('/verify');
        return;
      }
      setError(message || 'Credenciais inválidas.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <button onClick={toggleTheme} className="absolute top-6 right-6 p-3 rounded-full bg-brand-surface border border-brand-muted/20 hover:scale-110 transition-transform">
        {theme === 'light' ? '🌙' : '☀️'}
      </button>

      <div className="bg-brand-surface p-10 rounded-3xl shadow-2xl w-full max-w-md border border-brand-muted/10">
        <header className="mb-10 text-center">
          <div className="inline-block p-3 bg-brand-primary/10 rounded-2xl mb-4">
             <div className="w-8 h-8 bg-brand-primary rounded-lg rotate-12"></div>
          </div>
          <h2 className="text-3xl font-black tracking-tighter">ReqFlow</h2>
          <p className="text-brand-muted text-sm font-medium">Gestão de Solicitações</p>
        </header>
        
        {error && <div className="bg-brand-error/10 border-l-2 border-brand-error p-3 mb-6 text-brand-error text-xs font-bold text-center">{error}</div>}

        <form onSubmit={handleLogin} className="flex flex-col gap-6">
          <input type="email" placeholder="E-mail" required value={email} onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Senha" required value={password} onChange={e => setPassword(e.target.value)} />
          <button type="submit" className="btn-primary h-12">Entrar</button>
        </form>

        <footer className="mt-10 flex flex-col gap-4 text-center border-t border-brand-muted/10 pt-8 text-sm">
          <p className="text-brand-muted">Novo por aqui? <Link to="/register" className="text-brand-primary font-bold">Crie sua conta</Link></p>
          <Link to="/verify" className="text-xs text-brand-muted/60 underline">Validar e-mail pendente?</Link>
        </footer>
      </div>
    </div>
  );
}