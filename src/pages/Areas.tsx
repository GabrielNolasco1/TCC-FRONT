import { useState, useEffect, useCallback } from 'react';
import { MapPin, Loader2, AlertCircle, Trash2, RefreshCcw } from 'lucide-react';
import { api } from '../store/useAuthStore';
import { getErrorMessage } from '../utils/handle-error';
import type { Area } from '../types/api';

export function Areas() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [newAreaName, setNewAreaName] = useState('');
  
  // Estados de Carregamento e Erro
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [formError, setFormError] = useState('');

  const fetchAreas = useCallback(async () => {
    setFetchError('');
    setIsInitialLoading(true);
    try {
      const res = await api.get<Area[]>('/areas');
      setAreas(res.data);
    } catch (err) {
      // TRATAMENTO: O erro vai direto para o estado que o usuário enxerga
      setFetchError(getErrorMessage(err));
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAreas();
  }, [fetchAreas]);

  const handleCreateArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAreaName.trim()) return;

    setIsActionLoading(true);
    setFormError('');

    try {
      await api.post('/areas', { name: newAreaName });
      setNewAreaName('');
      await fetchAreas();
    } catch (err) {
      // TRATAMENTO: Erro de cadastro exibido no formulário
      setFormError(getErrorMessage(err));
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteArea = async (id: string) => {
    if (!window.confirm("Confirmar exclusão desta unidade?")) return;
    
    try {
      await api.delete(`/areas/${id}`);
      await fetchAreas();
    } catch (err) {
      // TRATAMENTO: Erro de exclusão via alerta direto pro usuário
      alert(`Não foi possível excluir: ${getErrorMessage(err)}`);
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto animate-in fade-in duration-500">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-brand-text italic">
            Configurações <span className="text-brand-primary">/</span> Áreas
          </h1>
          <p className="text-brand-muted font-bold text-xs uppercase tracking-[3px] mt-2">Gestão de Unidades Organizacionais</p>
        </div>
        
        {/* Botão de retry caso a listagem falhe */}
        {fetchError && (
          <button onClick={fetchAreas} className="btn-secondary flex items-center gap-2 text-xs py-2 px-4">
            <RefreshCcw size={14} /> Tentar Novamente
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* FORMULÁRIO */}
        <aside className="lg:col-span-1">
          <div className="bg-brand-surface p-8 rounded-3xl border border-white/5 shadow-2xl sticky top-8">
            <h2 className="text-lg font-bold mb-6 text-brand-text uppercase tracking-tighter">Novo Setor</h2>
            
            <form onSubmit={handleCreateArea} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black text-brand-muted uppercase tracking-[2px] ml-1">Nome Identificador</span>
                <input 
                  type="text" 
                  placeholder="Ex: Recursos Humanos" 
                  required 
                  value={newAreaName}
                  onChange={(e) => setNewAreaName(e.target.value)}
                />
              </div>

              {/* FEEDBACK DE ERRO NO FORMULÁRIO */}
              {formError && (
                <div className="bg-brand-error/10 border-l-2 border-brand-error p-3 rounded-lg flex items-start gap-2 animate-in slide-in-from-top-2">
                  <AlertCircle size={16} className="text-brand-error shrink-0 mt-0.5" />
                  <p className="text-brand-error text-[10px] font-bold uppercase leading-tight">{formError}</p>
                </div>
              )}

              <button type="submit" disabled={isActionLoading} className="btn-primary h-12">
                {isActionLoading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Registrar'}
              </button>
            </form>
          </div>
        </aside>

        {/* GRADE DE RESULTADOS */}
        <main className="lg:col-span-2">
          
          {/* CASO 1: ERRO NA BUSCA DOS DADOS */}
          {fetchError ? (
            <div className="bg-brand-error/5 border-2 border-brand-error/20 p-12 rounded-3xl flex flex-col items-center text-center gap-4">
              <AlertCircle size={48} className="text-brand-error opacity-50" />
              <div>
                <h3 className="text-lg font-bold text-brand-text uppercase">Falha na Sincronização</h3>
                <p className="text-brand-muted text-sm max-w-xs mx-auto mt-2">{fetchError}</p>
              </div>
              <button onClick={fetchAreas} className="btn-secondary mt-2">Recarregar Lista</button>
            </div>
          ) : isInitialLoading ? (
            /* CASO 2: CARREGANDO */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-brand-surface/50 rounded-2xl border border-white/5" />)}
            </div>
          ) : (
            /* CASO 3: SUCESSO OU VAZIO */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {areas.length > 0 ? (
                areas.map((area) => (
                  <div key={area.id} className="bg-brand-surface/40 p-5 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-brand-primary/40 transition-all hover:bg-brand-surface">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="p-3 bg-brand-primary/10 rounded-xl text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors">
                        <MapPin size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-black text-brand-muted uppercase truncate opacity-50">{area.id.split('-')[0]}</p>
                        <h3 className="text-base font-bold text-brand-text truncate uppercase tracking-tight">{area.name}</h3>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteArea(area.id)} className="p-2 text-brand-muted hover:text-brand-error transition-colors hover:bg-brand-error/10 rounded-lg">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-24 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl opacity-20">
                  <MapPin size={48} className="mb-4" />
                  <p className="font-bold text-xs uppercase tracking-widest text-center px-4">Nenhuma unidade operacional cadastrada</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}