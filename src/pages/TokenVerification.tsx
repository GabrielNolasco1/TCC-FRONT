import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { api, useAuthStore } from '../store/useAuthStore';
import type { ApiError } from '../types/api';

export function TokenVerification() {
  const registrationEmail = useAuthStore(state => state.registrationEmail);
  const [email, setEmail] = useState(registrationEmail);
  const [tokenCode, setTokenCode] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleSendToken = async () => {
    try {
      await api.post('/tokens/send', { email });
      setIsSent(true); setTimeLeft(60); setError('');
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>;
      setError(axiosError.response?.data?.message || 'Erro de envio.');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/tokens/verify', { email, informedCode: tokenCode });
      alert('Acesso validado!'); navigate('/login');
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>;
      setError(axiosError.response?.data?.message || 'Código expirado ou inválido.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-brand-surface p-10 rounded-3xl shadow-2xl w-full max-w-md border border-brand-muted/10">
        <h2 className="text-xl font-black mb-1 text-center">SEGURANÇA</h2>
        <p className="text-brand-muted text-[10px] text-center mb-8 uppercase tracking-[3px]">Verificação de Identidade</p>
        
        <input type="email" className="w-full mb-4 text-center font-bold italic" value={email} onChange={e => setEmail(e.target.value)} />
        
        <button onClick={handleSendToken} className="btn-secondary w-full mb-6 text-xs uppercase tracking-widest">
          {isSent ? 'Reenviar Código' : 'Gerar Token de Acesso'}
        </button>

        {isSent && timeLeft > 0 && (
          <form onSubmit={handleVerify} className="flex flex-col gap-8 border-t border-brand-muted/10 pt-8 animate-in fade-in zoom-in duration-300">
            <div className="text-center font-mono text-4xl text-brand-primary font-bold">00:{timeLeft.toString().padStart(2, '0')}</div>
            <input type="text" placeholder="00000000" required maxLength={8} className="bg-transparent border-b-2 border-brand-primary rounded-none text-center text-4xl tracking-[15px] font-mono p-0" value={tokenCode} onChange={e => setTokenCode(e.target.value)} />
            <button type="submit" className="btn-primary h-14">Validar Agora</button>
          </form>
        )}
        
        {error && <p className="text-brand-error mt-6 text-center text-[10px] font-black uppercase tracking-widest">{error}</p>}
      </div>
    </div>
  );
}