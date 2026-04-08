import { useState, useEffect } from 'react';
import { 
  UserCheck, UserX, Shield, MapPin, Loader2, 
  Search, CheckCircle, AlertCircle, Award, ChevronRight
} from 'lucide-react';
import { api } from '../store/useAuthStore';
import { getErrorMessage } from '../utils/handle-error';

// Configuração dos Níveis Hierárquicos
const CARGO_LEVELS: Record<number, string> = {
  1: "Estagiário",
  2: "Jovem Aprendiz",
  3: "Auxiliar",
  4: "Assistente",
  5: "Analista Jr",
  6: "Analista Pleno",
  7: "Analista Senior",
  8: "Supervisor",
  9: "Coordenador",
  10: "Gerente",
  11: "Diretor",
  12: "Vice-Presidente",
  13: "Presidente"
};

type AccessRole = 'USER' | 'ADMIN' | 'MASTER';

interface Area { 
  id: string; 
  name: string; 
}

interface User {
  id: string;
  name: string;
  email: string;
  access: AccessRole;
  valid: string;
  isApproved: boolean;
  areaId: string | null;
  approvalLevel: number;
}

export function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resUsers, resAreas] = await Promise.all([
          api.get<User[]>('/users'),
          api.get<Area[]>('/areas')
        ]);
        setUsers(resUsers.data);
        setAreas(resAreas.data);
      } catch (err) {
        alert(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleUpdateUser = async (userId: string, data: Partial<User>) => {
    setSavingId(userId);
    try {
      await api.patch(`/users/${userId}`, data);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...data } : u));
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setSavingId(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="animate-spin text-brand-primary" size={40} />
    </div>
  );

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto h-full flex flex-col animate-in fade-in duration-500">
      <header className="mb-10 shrink-0">
        <h1 className="text-4xl font-black tracking-tighter text-brand-text">Portaria do Sistema</h1>
        <p className="text-brand-muted font-bold text-xs uppercase tracking-[3px] mt-2">Autorize novos membros e defina permissões</p>
      </header>

      <div className="mb-8 relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" size={18} />
        <input 
          type="text" placeholder="Nome ou e-mail..." 
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-12 bg-brand-surface border-white/5"
        />
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
          {filteredUsers.map(u => (
            <div key={u.id} className={`bg-brand-surface p-6 rounded-[32px] border transition-all ${!u.isApproved ? 'border-brand-error/40 bg-brand-error/5 shadow-2xl shadow-brand-error/5' : 'border-white/5'}`}>
              
              <div className="flex justify-between items-start mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl ${!u.isApproved ? 'bg-brand-error/10 text-brand-error' : 'bg-brand-primary/10 text-brand-primary'}`}>
                  {u.name.charAt(0)}
                </div>
                {!u.isApproved ? (
                  <span className="text-[9px] font-black text-brand-error bg-brand-error/10 px-3 py-1 rounded-full uppercase flex items-center gap-1">
                    <AlertCircle size={10} /> Aguardando
                  </span>
                ) : (
                  <span className="text-[9px] font-black text-green-500 bg-green-500/10 px-3 py-1 rounded-full uppercase flex items-center gap-1">
                    <CheckCircle size={10} /> Autorizado
                  </span>
                )}
              </div>

              <div className="mb-6">
                <h3 className="font-bold text-brand-text truncate leading-none mb-1">{u.name}</h3>
                <p className="text-[10px] text-brand-muted truncate uppercase tracking-tighter">{u.email}</p>
              </div>

              <div className="space-y-4">
                {/* ACESSO */}
                <div>
                  <label className="text-[9px] font-black text-brand-muted uppercase tracking-[2px] flex items-center gap-2 mb-2">
                    <Shield size={12} className="text-brand-primary" /> Nível de Acesso
                  </label>
                  <select 
                    value={u.access}
                    onChange={e => handleUpdateUser(u.id, { access: e.target.value as AccessRole })}
                    className="w-full bg-brand-bg border-white/5 text-xs p-3 rounded-xl outline-none focus:border-brand-primary transition-all"
                  >
                    <option value="USER">Usuário Comum</option>
                    <option value="ADMIN">Administrador de Área</option>
                    <option value="MASTER">Master do Sistema</option>
                  </select>
                </div>

                {/* ÁREA */}
                <div>
                  <label className="text-[9px] font-black text-brand-muted uppercase tracking-[2px] flex items-center gap-2 mb-2">
                    <MapPin size={12} className="text-brand-primary" /> Área Alocada
                  </label>
                  <select 
                    value={u.areaId || ''}
                    onChange={e => handleUpdateUser(u.id, { areaId: e.target.value || null })}
                    className="w-full bg-brand-bg border-white/5 text-xs p-3 rounded-xl outline-none focus:border-brand-primary transition-all"
                  >
                    <option value="">Sem Área (Geral)</option>
                    {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>

                {/* NÍVEL DE APROVAÇÃO (HIERARQUIA 1-13) */}
                <div>
                  <label className="text-[9px] font-black text-brand-muted uppercase tracking-[2px] flex items-center gap-2 mb-2">
                    <Award size={12} className="text-brand-primary" /> Cargo / Nível de Aprovação
                  </label>
                  <div className="relative group">
                    <select 
                      value={u.approvalLevel}
                      onChange={e => handleUpdateUser(u.id, { approvalLevel: Number(e.target.value) })}
                      className="w-full bg-brand-bg border-white/5 text-xs p-3 rounded-xl outline-none focus:border-brand-primary transition-all appearance-none pr-10"
                    >
                      {Object.entries(CARGO_LEVELS).map(([lvl, label]) => (
                        <option key={lvl} value={lvl}>
                          Lvl {lvl} - {label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-brand-muted">
                      <ChevronRight size={14} className="rotate-90" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/5">
                {!u.isApproved ? (
                  <button 
                    onClick={() => handleUpdateUser(u.id, { isApproved: true })}
                    disabled={savingId === u.id}
                    className="w-full btn-primary py-4 text-[10px] font-black flex items-center justify-center gap-2 uppercase tracking-widest shadow-xl shadow-brand-primary/20"
                  >
                    {savingId === u.id ? <Loader2 className="animate-spin" size={14} /> : <><UserCheck size={16} /> Liberar Acesso</>}
                  </button>
                ) : (
                  <button 
                    onClick={() => handleUpdateUser(u.id, { isApproved: false })}
                    disabled={savingId === u.id}
                    className="w-full bg-brand-error/10 text-brand-error hover:bg-brand-error hover:text-white py-4 rounded-[20px] text-[10px] font-black flex items-center justify-center gap-2 transition-all uppercase tracking-widest"
                  >
                    {savingId === u.id ? <Loader2 className="animate-spin" size={14} /> : <><UserX size={16} /> Bloquear Usuário</>}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}