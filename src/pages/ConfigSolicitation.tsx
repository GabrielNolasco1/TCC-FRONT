import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Settings, FileText, Layers, AlignLeft, List, 
  CheckSquare, Calendar, Type, Hash, Loader2, AlertCircle, Save,
  Mail, Phone, FileDigit, CheckCircle, GitMerge, User, ShieldCheck, Trash2
} from 'lucide-react';
import { api, useAuthStore } from '../store/useAuthStore';
import { getErrorMessage } from '../utils/handle-error';

// --- TIPAGENS INTERNAS ---
type InputType = 'text' | 'longtext' | 'cnpj' | 'tel' | 'number' | 'email' | 'date' | 'checkbox' | 'radio' | 'select';

interface InputDef { 
  id: string; 
  question: string; 
  name: string; 
  type: InputType; 
  isRequired: boolean; 
  options: string[] | null; 
  order: number; 
}

interface SectionDef { 
  id: string; 
  name: string; 
  order: number; 
  inputs: InputDef[]; 
}

interface SolicitationCategory { 
  id: string; 
  name: string; 
  areaId?: string; 
}

interface NewInputForm { 
  question: string; 
  name: string; 
  type: InputType; 
  isRequired: boolean; 
  optionsText: string; 
  order: number; 
}

type FallbackAction = "NO_CONTINUE" | "CHECK_ONE_MORE_LVL_AND_CONTINUE" | "CHECK_ONE_MORE_LVL_AND_NO_CONTINUE" | "CONTINUE";

interface ConfigApproval {
  necessaryApproverLevel: number | null;
  ifNotHaveApproverLevel: FallbackAction | null;
}

interface FlowApproval {
  userId: string;
  order: number;
  userName?: string; 
}

export function ConfigSolicitation() {
  const { user } = useAuthStore();
  
  // Estados de Dados
  const [solicitations, setSolicitations] = useState<SolicitationCategory[]>([]);
  const [selectedSol, setSelectedSol] = useState<SolicitationCategory | null>(null);
  const [sections, setSections] = useState<SectionDef[]>([]);
  const [usersList, setUsersList] = useState<{id: string, name: string}[]>([]); 
  
  // Estados de Interface e Navegação
  const [activeTab, setActiveTab] = useState<'form' | 'flow'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingFlow, setIsSavingFlow] = useState(false);
  const [error, setError] = useState('');

  // Estados de Configuração (Formulário/Fluxo)
  const [configApproval, setConfigApproval] = useState<ConfigApproval>({ necessaryApproverLevel: null, ifNotHaveApproverLevel: null });
  const [flowApprovals, setFlowApprovals] = useState<FlowApproval[]>([]);
  const [newFlowUserId, setNewFlowUserId] = useState('');
  const [newSectionName, setNewSectionName] = useState('');
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [newInput, setNewInput] = useState<NewInputForm>({ 
    question: '', name: '', type: 'text', isRequired: true, optionsText: '', order: 1 
  });

  // Busca inicial de categorias e usuários (Os usuários já vêm aqui!)
  const fetchInitialData = useCallback(async () => {
    try {
      const [resSol, resUsers] = await Promise.all([
        api.get<SolicitationCategory[]>('/solicitations?onlyArea=true'),  
        api.get<{id: string, name: string}[]>('/users') 
      ]);
      setSolicitations(resSol.data);
      setUsersList(resUsers.data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, []);

  useEffect(() => { fetchInitialData(); }, [fetchInitialData]);

  // Busca estrutura completa de uma solicitação selecionada
  const fetchStructureAndFlow = async (solicitationId: string) => {
    setIsLoading(true);
    setError(''); 
    try {
      const [formRes, configRes, flowRes] = await Promise.all([
        api.get<{ sections: SectionDef[] }>(`/solicitations/${solicitationId}/form`),
        api.get<ConfigApproval>(`/config-approvals/${solicitationId}`).catch(() => ({ data: { necessaryApproverLevel: null, ifNotHaveApproverLevel: null } })),
        api.get<FlowApproval[]>(`/flow-approvals/${solicitationId}`).catch(() => ({ data: [] }))
      ]);
      
      setSections(formRes.data.sections || []);
      
      // Mapeamento seguro das configs
      setConfigApproval({
        necessaryApproverLevel: configRes.data?.necessaryApproverLevel ?? null,
        ifNotHaveApproverLevel: configRes.data?.ifNotHaveApproverLevel ?? null
      });

      // 💡 O TRUQUE DO NOME BONITINHO FICA AQUI:
      // Cruzamos o userId que vem do back com a usersList que já baixamos!
      const flowsWithNames = (flowRes.data || []).map(flow => {
        const foundUser = usersList.find(u => u.id === flow.userId);
        return {
          ...flow,
          userName: foundUser ? foundUser.name : "Usuário Desconhecido" 
        };
      }).sort((a, b) => a.order - b.order);

      setFlowApprovals(flowsWithNames);

    } catch (err) {
      setError(`Falha ao carregar dados: ${getErrorMessage(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSolicitation = (sol: SolicitationCategory) => {
    setSelectedSol(sol);
    setActiveSectionId(null);
    fetchStructureAndFlow(sol.id);
  };

  // --- LÓGICA DE CAMPOS (TAB FORM) ---
  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionName.trim() || !selectedSol) return;
    const nextOrder = sections.length > 0 ? Math.max(...sections.map(s => s.order)) + 1 : 1;
    try { 
      await api.post('/sections', { title: newSectionName, solicitationId: selectedSol.id, order: nextOrder }); 
      setNewSectionName(''); 
      await fetchStructureAndFlow(selectedSol.id); 
    } catch (err) { alert(getErrorMessage(err)); }
  };

  const handleCreateInput = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInput.question || !newInput.name || !activeSectionId || !selectedSol) return;
    
    let optionsArray: string[] | null = null;
    if (['select', 'radio', 'checkbox'].includes(newInput.type) && newInput.optionsText) {
      optionsArray = newInput.optionsText.split(',').map(opt => opt.trim()).filter(opt => opt !== '');
    }

    try {
      await api.post('/inputs', { 
        sectionId: activeSectionId, 
        question: newInput.question, 
        name: newInput.name, 
        type: newInput.type, 
        isRequired: newInput.isRequired, 
        options: optionsArray, 
        order: newInput.order 
      });
      setNewInput({ question: '', name: '', type: 'text', isRequired: true, optionsText: '', order: 1 });
      setActiveSectionId(null);
      await fetchStructureAndFlow(selectedSol.id);
    } catch (err) { alert(getErrorMessage(err)); }
  };

  // --- LÓGICA DE FLUXO (TAB FLOW) ---
  const handleSaveConfigApproval = async () => {
    if (!selectedSol) return;
    setIsSavingFlow(true);
    try {
      await api.post('/config-approvals', {
        solicitationId: selectedSol.id,
        necessaryApproverLevel: configApproval.necessaryApproverLevel ? Number(configApproval.necessaryApproverLevel) : null,
        ifNotHaveApproverLevel: configApproval.ifNotHaveApproverLevel || null
      });
      alert('Regra Dinâmica salva com sucesso!');
    } catch (err) { alert(getErrorMessage(err)); } 
    finally { setIsSavingFlow(false); }
  };

  const handleAddFlowUser = () => {
    if (!newFlowUserId) return;
    const nextOrder = flowApprovals.length > 0 ? Math.max(...flowApprovals.map(f => f.order)) + 1 : 1;
    const selectedUser = usersList.find(u => u.id === newFlowUserId);
    setFlowApprovals([...flowApprovals, { userId: newFlowUserId, order: nextOrder, userName: selectedUser?.name }]);
    setNewFlowUserId('');
  };

  const handleRemoveFlowUser = (index: number) => {
    const newFlows = [...flowApprovals];
    newFlows.splice(index, 1);
    const reordered = newFlows.map((f, i) => ({ ...f, order: i + 1 }));
    setFlowApprovals(reordered);
  };

  const handleSaveApprovalFlows = async () => {
    if (!selectedSol) return;
    setIsSavingFlow(true);
    try {
      await api.post('/flow-approvals', {
        solicitationId: selectedSol.id,
        flows: flowApprovals.map(f => ({ userId: f.userId, order: f.order }))
      });
      alert('Fila de aprovadores fixos salva!');
    } catch (err) { alert(getErrorMessage(err)); } 
    finally { setIsSavingFlow(false); }
  };

  // Helpers de UI
  const handleQuestionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const question = e.target.value;
    const autoName = question.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, ''); 
    setNewInput({ ...newInput, question, name: autoName });
  };

  const TypeIcon = ({ type }: { type: string }) => {
    switch (type) { 
      case 'longtext': return <AlignLeft size={14} />; 
      case 'number': return <Hash size={14} />; 
      case 'email': return <Mail size={14} />; 
      case 'tel': return <Phone size={14} />; 
      case 'cnpj': return <FileDigit size={14} />; 
      case 'date': return <Calendar size={14} />; 
      case 'select': return <List size={14} />; 
      case 'radio': return <CheckCircle size={14} />; 
      case 'checkbox': return <CheckSquare size={14} />; 
      default: return <Type size={14} />; 
    }
  };

  if (user?.access !== 'MASTER' && user?.access !== 'ADMIN') {
    return <div className="p-8 flex items-center justify-center h-full"><p className="text-brand-error font-bold uppercase tracking-widest bg-brand-error/10 p-6 rounded-2xl">Acesso Restrito</p></div>;
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto h-full flex flex-col animate-in fade-in duration-500">
      <header className="mb-8 shrink-0">
        <h1 className="text-4xl font-black tracking-tighter text-brand-text">Construtor de Fluxos</h1>
        <p className="text-brand-muted font-bold text-xs uppercase tracking-[3px] mt-2">Modele os formulários e regras da sua área</p>
      </header>

      {error && (
        <div className="bg-brand-error/10 border-l-2 border-brand-error p-3 rounded-lg flex items-center gap-2 mb-6 shrink-0">
          <AlertCircle size={14} className="text-brand-error" />
          <p className="text-brand-error text-[10px] font-bold uppercase">{error}</p>
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8 min-h-0">
        {/* SIDEBAR: APENAS LISTAGEM */}
        <aside className="lg:col-span-1 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-black text-brand-muted uppercase tracking-widest px-2 mb-2">Selecione uma Categoria</h3>
            {solicitations.length === 0 ? (
               <p className="text-xs text-brand-muted italic px-2">Nenhum serviço configurado na sua área ainda.</p>
            ) : (
              solicitations.map(sol => (
                <button 
                  key={sol.id} 
                  onClick={() => handleSelectSolicitation(sol)} 
                  className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3 ${selectedSol?.id === sol.id ? 'bg-brand-primary/10 border-brand-primary text-brand-primary shadow-lg shadow-brand-primary/5' : 'bg-brand-surface/40 border-white/5 text-brand-text hover:bg-brand-surface'}`}
                >
                  <FileText size={18} className="shrink-0" />
                  <span className="font-bold text-sm truncate">{sol.name}</span>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* ÁREA PRINCIPAL */}
        <main className="lg:col-span-3 bg-brand-surface/30 rounded-[32px] border border-white/5 shadow-inner overflow-y-auto relative custom-scrollbar flex flex-col">
          {!selectedSol ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-30">
              <Settings size={64} className="mb-4" />
              <p className="font-bold uppercase tracking-widest">Selecione um serviço ao lado</p>
            </div>
          ) : isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center"><Loader2 size={40} className="animate-spin text-brand-primary" /></div>
          ) : (
            <>
              <div className="p-6 lg:p-10 pb-0 shrink-0">
                <div className="mb-6 pb-6 border-b border-white/5">
                  <h2 className="text-2xl font-black text-brand-text mb-2">{selectedSol.name}</h2>
                  <p className="text-brand-muted text-xs uppercase tracking-widest font-bold">Edição de Regras e Campos</p>
                </div>
                
                <div className="flex gap-4 mb-8">
                  <button onClick={() => setActiveTab('form')} className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'form' ? 'bg-brand-primary text-white shadow-lg' : 'bg-brand-surface border border-white/5 text-brand-muted hover:text-brand-text'}`}>
                    <AlignLeft size={18} /> Campos do Formulário
                  </button>
                  <button onClick={() => setActiveTab('flow')} className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'flow' ? 'bg-brand-primary text-white shadow-lg' : 'bg-brand-surface border border-white/5 text-brand-muted hover:text-brand-text'}`}>
                    <GitMerge size={18} /> Fluxos de Aprovação
                  </button>
                </div>
              </div>

              <div className="px-6 lg:px-10 pb-10 flex-1 overflow-y-auto">
                {activeTab === 'form' && (
                  <div className="flex flex-col gap-8 animate-in fade-in">
                    {sections.map((section, index) => (
                      <div key={section.id} className="bg-brand-bg rounded-3xl border border-white/5 overflow-hidden shadow-xl">
                        <div className="bg-white/5 p-4 flex items-center gap-3 border-b border-white/5">
                          <div className="w-6 h-6 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center text-xs font-black shrink-0">{index + 1}</div>
                          <h3 className="font-bold text-brand-text">{section.name}</h3>
                        </div>
                        <div className="p-6 flex flex-col gap-4">
                          {section.inputs && section.inputs.length > 0 ? (
                            section.inputs.map(input => (
                              <div key={input.id} className="p-4 rounded-xl border border-white/5 bg-brand-surface/50 flex items-start gap-4">
                                <div className="p-2 bg-black/20 rounded-lg text-brand-muted shrink-0 mt-0.5"><TypeIcon type={input.type} /></div>
                                <div className="w-full">
                                  <p className="font-bold text-sm">{input.question}</p>
                                  <div className="flex gap-2 text-[10px] uppercase font-black tracking-widest text-brand-muted mt-2">
                                    <span className="bg-white/5 px-2 py-0.5 rounded">ID: {input.name}</span>
                                    <span className="bg-white/5 px-2 py-0.5 rounded border border-white/10">Ordem: {input.order}</span>
                                    <span className="bg-white/5 px-2 py-0.5 rounded">Tipo: {input.type}</span>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : <p className="text-xs text-brand-muted italic py-2">Nenhum campo nesta seção.</p>}

                          {activeSectionId === section.id ? (
                            <form onSubmit={handleCreateInput} className="mt-4 p-5 rounded-2xl border-2 border-brand-primary/30 bg-brand-primary/5 animate-in zoom-in-95">
                              <h4 className="text-xs font-black uppercase tracking-widest text-brand-primary mb-4">Novo Campo</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="md:col-span-2">
                                  <label className="text-[10px] text-brand-muted uppercase font-bold ml-1">Pergunta / Rótulo</label>
                                  <input type="text" required value={newInput.question} onChange={handleQuestionChange} className="w-full text-sm p-2 mt-1" />
                                </div>
                                <div>
                                  <label className="text-[10px] text-brand-muted uppercase font-bold ml-1">Nome Interno</label>
                                  <input type="text" required value={newInput.name} onChange={e => setNewInput({...newInput, name: e.target.value})} className="w-full text-sm p-2 mt-1 font-mono text-brand-primary" />
                                </div>
                                <div>
                                  <label className="text-[10px] text-brand-muted uppercase font-bold ml-1">Ordem</label>
                                  <input type="number" required min="1" value={newInput.order} onChange={e => setNewInput({...newInput, order: parseInt(e.target.value) || 1})} className="w-full text-sm p-2 mt-1" />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="text-[10px] text-brand-muted uppercase font-bold ml-1">Tipo</label>
                                  <select value={newInput.type} onChange={e => setNewInput({...newInput, type: e.target.value as InputType})} className="w-full text-sm p-2 mt-1 bg-brand-surface border-white/10 rounded-lg">
                                    <option value="text">Texto Curto</option>
                                    <option value="longtext">Texto Longo</option>
                                    <option value="number">Número</option>
                                    <option value="email">E-mail</option>
                                    <option value="tel">Telefone</option>
                                    <option value="cnpj">CNPJ</option>
                                    <option value="date">Data</option>
                                    <option value="select">Lista Suspensa</option>
                                    <option value="radio">Múltipla Escolha Única</option>
                                    <option value="checkbox">Múltipla Escolha Várias</option>
                                  </select>
                                </div>
                                {['select', 'radio', 'checkbox'].includes(newInput.type) && (
                                  <div className="md:col-span-2 mt-2">
                                    <label className="text-[10px] text-brand-muted uppercase font-bold ml-1">Opções (Separadas por vírgula)</label>
                                    <input type="text" required value={newInput.optionsText} onChange={e => setNewInput({...newInput, optionsText: e.target.value})} className="w-full text-sm p-2 mt-1" />
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-3 py-2 md:col-span-2 mb-4">
                                <input type="checkbox" id={`req-${section.id}`} checked={newInput.isRequired} onChange={e => setNewInput({...newInput, isRequired: e.target.checked})} className="w-5 h-5 accent-brand-primary" />
                                <label htmlFor={`req-${section.id}`} className="text-sm font-bold cursor-pointer text-brand-text">Tornar obrigatório</label>
                              </div>
                              <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setActiveSectionId(null)} className="btn-secondary text-xs px-4 py-2">Cancelar</button>
                                <button type="submit" className="btn-primary text-xs px-4 py-2 flex items-center gap-2"><Save size={14} /> Salvar</button>
                              </div>
                            </form>
                          ) : (
                            <button onClick={() => { setActiveSectionId(section.id); const nOrder = section.inputs?.length > 0 ? Math.max(...section.inputs.map(i => i.order)) + 1 : 1; setNewInput({ question: '', name: '', type: 'text', isRequired: true, optionsText: '', order: nOrder }); }} className="mt-2 text-xs font-bold uppercase tracking-widest text-brand-primary flex items-center gap-2 justify-center p-3 border border-dashed border-white/10 rounded-xl hover:bg-brand-primary/10 transition-colors">
                              <Plus size={16} /> Adicionar Campo
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <form onSubmit={handleCreateSection} className="flex gap-3 mt-4">
                      <div className="flex items-center p-4 bg-brand-surface rounded-2xl border border-white/5 flex-1 shadow-xl">
                        <Layers className="text-brand-muted mr-3" size={20} />
                        <input type="text" required placeholder="Nova Seção (Ex: Dados Cadastrais)" value={newSectionName} onChange={e => setNewSectionName(e.target.value)} className="bg-transparent outline-none w-full font-bold text-sm text-brand-text" />
                      </div>
                      <button type="submit" className="btn-primary px-6 rounded-2xl shadow-xl"><Plus size={20} /></button>
                    </form>
                  </div>
                )}

                {activeTab === 'flow' && (
                  <div className="flex flex-col gap-10 animate-in fade-in">
                    <div className="bg-brand-bg p-8 rounded-[32px] border border-brand-primary/30 relative overflow-hidden shadow-2xl">
                      <div className="absolute top-0 right-0 p-8 opacity-5"><ShieldCheck size={120} /></div>
                      <h3 className="text-lg font-black text-brand-primary flex items-center gap-2 mb-4"><ShieldCheck size={24} /> 1. Regra Hierárquica</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                        <div>
                          <label className="text-xs font-bold text-brand-muted uppercase tracking-widest block mb-2">Nível do Gestor (1, 2, 3...)</label>
                          <input type="number" min="1" max="13" value={configApproval.necessaryApproverLevel || ''} onChange={e => setConfigApproval({...configApproval, necessaryApproverLevel: e.target.value ? Number(e.target.value) : null})} className="w-full p-3 bg-brand-surface rounded-xl border border-white/10 text-brand-text outline-none focus:border-brand-primary" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-brand-muted uppercase tracking-widest block mb-2">Contingência (Fallback)</label>
                          <select value={configApproval.ifNotHaveApproverLevel || ''} onChange={e => setConfigApproval({...configApproval, ifNotHaveApproverLevel: (e.target.value as FallbackAction) || null})} className="w-full p-3 bg-brand-surface rounded-xl border border-white/10 outline-none focus:border-brand-primary text-brand-text text-sm">
                            <option value="">Ação se não houver nível...</option>
                            <option value="NO_CONTINUE">Bloquear Processo</option>
                            <option value="CHECK_ONE_MORE_LVL_AND_CONTINUE">Tentar Nível +1 ou Seguir</option>
                            <option value="CHECK_ONE_MORE_LVL_AND_NO_CONTINUE">Tentar Nível +1 ou Bloquear</option>
                            <option value="CONTINUE">Ignorar e Seguir</option>
                          </select>
                        </div>
                      </div>
                      <button onClick={handleSaveConfigApproval} disabled={isSavingFlow} className="btn-primary mt-8 text-xs px-8 py-3 shadow-xl shadow-brand-primary/10">Salvar Regra Dinâmica</button>
                    </div>

                    <div className="bg-brand-surface p-8 rounded-[32px] border border-white/5 shadow-2xl">
                      <h3 className="text-lg font-black text-brand-text flex items-center gap-2 mb-6"><User size={24} className="text-brand-primary" /> 2. Fila Fixa de Aprovadores</h3>
                      <div className="flex flex-col gap-4 mb-8">
                        {flowApprovals.map((flow, index) => (
                          <div key={index} className="flex items-center gap-4 bg-brand-bg p-4 rounded-2xl border border-white/5 animate-in slide-in-from-left-4">
                            <div className="w-8 h-8 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center font-black text-xs">{flow.order}</div>
                            <div className="flex-1 font-bold text-sm text-brand-text">{flow.userName || `ID: ${flow.userId}`}</div>
                            <button onClick={() => handleRemoveFlowUser(index)} className="p-2 text-brand-muted hover:text-brand-error transition-colors"><Trash2 size={18} /></button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-3 bg-brand-bg p-4 rounded-2xl mb-8">
                        <select value={newFlowUserId} onChange={e => setNewFlowUserId(e.target.value)} className="flex-1 p-3 bg-brand-surface rounded-xl border border-white/10 outline-none text-brand-text text-sm">
                          <option value="">Selecione um Usuário...</option>
                          {usersList.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                        <button onClick={handleAddFlowUser} disabled={!newFlowUserId} className="btn-secondary px-6 rounded-xl border-white/10 hover:border-brand-primary font-bold text-xs uppercase transition-all">Adicionar</button>
                      </div>
                      <div className="text-right pt-6 border-t border-white/5">
                         <button onClick={handleSaveApprovalFlows} disabled={isSavingFlow} className="btn-primary text-xs px-10 py-4 shadow-xl">Salvar Fila Fixa</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}