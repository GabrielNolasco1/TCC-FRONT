import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AxiosError } from 'axios';
import { api, useAuthStore } from '../store/useAuthStore';
import type { User, ApiError } from '../types/api';

export function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setRegistrationEmail = useAuthStore(state => state.setRegistrationEmail);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post<User>('/users', { name, email, password });
      setRegistrationEmail(email);
      navigate('/verify');
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>;
      setError(axiosError.response?.data?.message || 'Falha no registro.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-brand-surface p-10 rounded-3xl shadow-2xl w-full max-w-md border border-brand-muted/10">
        <h2 className="text-2xl font-black mb-8 text-center uppercase tracking-tighter">Novo Registro <span className="text-brand-primary">.</span></h2>
        
        {error && <div className="bg-brand-error/10 border-l-2 border-brand-error p-3 mb-6 text-brand-error text-xs font-bold text-center uppercase">{error}</div>}

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <input type="text" placeholder="Nome Completo" required value={name} onChange={e => setName(e.target.value)} />
          <input type="email" placeholder="E-mail Corporativo" required value={email} onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Senha (8+ carac. e especial)" required value={password} onChange={e => setPassword(e.target.value)} />
          <button type="submit" className="btn-primary mt-4">Criar Minha Conta</button>
        </form>

        <p className="mt-8 text-sm text-center text-brand-muted font-medium">
          Já possui registro? <Link to="/login" className="text-brand-primary font-bold hover:underline">Faça Login</Link>
        </p>
      </div>
    </div>
  );
}