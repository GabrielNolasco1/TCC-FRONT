import { useState, useEffect, useCallback } from 'react';
import { 
  Clock, CheckCircle2, ChevronLeft, Loader2, AlertCircle, 
  FileText, X, Check, MessageSquare, User as UserIcon,
  GitBranch, Calendar, Hourglass, ShieldCheck
} from 'lucide-react';
import { api, useAuthStore } from '../store/useAuthStore';
import { getErrorMessage } from '../utils/handle-error';

// --- INTERFACES ---
interface AnswerDetailed { id: string; question: string; value: string; }

interface ApprovalStep {
  id: string;
  approverName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  order: number;
  comments: string | null;
  updatedAt: string;
}

interface Workflow {
  id: string;
  title: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  progress: string;
  createdAt: string;
  answers?: AnswerDetailed[]; 
  approvals?: ApprovalStep[]; 
}

interface ApprovalPending {
  id: string; 
  workflowId: string;
  workflowTitle: string;
  requesterName: string;
  createdAt: string;
}

export function Home() {
  const { user } = useAuthStore();
  
  // Estados de Dados
  const [myWorkflows, setMyWorkflows] = useState<Workflow[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalPending[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados do Modal
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [comment, setComment] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [resWorkflows, resApprovals] = await Promise.all([
        api.get<Workflow[]>('/workflows'),
        api.get<ApprovalPending[]>('/approvals/me')
      ]);
      setMyWorkflows(resWorkflows.data);
      setPendingApprovals(resApprovals.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleOpenDetail = async (workflowId: string, approvalId?: string) => {
    try {
      const res = await api.get<Workflow>(`/workflows/${workflowId}`);
      setSelectedWorkflow(res.data);
      setSelectedApprovalId(approvalId || null);
      setComment('');
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleProcessApproval = async (action: 'APPROVED' | 'REJECTED') => {
    if (!selectedApprovalId) return;
    setIsProcessingAction(true);
    try {
      await api.post('/approvals/process', {
        approvalId: selectedApprovalId,
        action: action,
        comments: comment
      });
      setSelectedWorkflow(null);
      fetchData();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setIsProcessingAction(false);
    }
  };

  if (!user) return null;

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto h-full overflow-y-auto custom-scrollbar">
      
      <header className="mb-10 animate-in fade-in slide-in-from-left-4 duration-500">
        <h1 className="text-4xl font-black tracking-tighter text-brand-text">
          Olá, <span className="text-brand-primary">{user.name.split(' ')[0]}</span>
        </h1>
        <p className="text-brand-muted text-xs mt-2 uppercase tracking-[3px] font-bold">
          Painel de Controle <span className="mx-2 opacity-20">|</span> {user.access}
        </p>
      </header>

      {/* Uso do estado 'error' e do ícone 'AlertCircle' */}
      {error && (
        <div className="mb-8 p-4 bg-brand-error/10 border-l-4 border-brand-error rounded-r-2xl flex items-center gap-3 animate-in shake duration-500">
          <AlertCircle className="text-brand-error" size={20} />
          <p className="text-brand-error text-xs font-bold uppercase">{error}</p>
        </div>
      )}

      {/* Uso do estado 'loading' no resumo */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
        <div className="bg-brand-surface p-8 rounded-[40px] border border-white/5 shadow-2xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 text-brand-primary/5 group-hover:text-brand-primary/10 transition-colors">
            <Clock size={160} />
          </div>
          <div className="relative z-10">
            <div className="p-3 bg-brand-primary/10 w-fit rounded-2xl text-brand-primary mb-6"><Clock size={28} /></div>
            <p className="text-brand-muted font-bold text-xs uppercase tracking-widest mb-1">Minhas Solicitações</p>
            {loading ? <Loader2 className="animate-spin text-brand-muted opacity-20" size={32} /> : (
              <p className="text-5xl font-black text-brand-text">{myWorkflows.length.toString().padStart(2, '0')}</p>
            )}
          </div>
        </div>

        <div className="bg-brand-surface p-8 rounded-[40px] border border-white/5 shadow-2xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 text-brand-error/5 group-hover:text-brand-error/10 transition-colors">
            <ShieldCheck size={160} />
          </div>
          <div className="relative z-10">
            <div className="p-3 bg-brand-error/10 w-fit rounded-2xl text-brand-error mb-6"><CheckCircle2 size={28} /></div>
            <p className="text-brand-muted font-bold text-xs uppercase tracking-widest mb-1">Aguardando Você</p>
            {loading ? <Loader2 className="animate-spin text-brand-muted opacity-20" size={32} /> : (
              <p className="text-5xl font-black text-brand-text">{pendingApprovals.length.toString().padStart(2, '0')}</p>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 pb-10">
        
        {/* LISTA: HISTÓRICO PESSOAL */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h2 className="text-xs font-black uppercase tracking-[4px] mb-8 flex items-center gap-4 text-brand-muted">
             Histórico Pessoal <div className="flex-1 h-[1px] bg-white/5"></div>
          </h2>
          <div className="flex flex-col gap-4">
            {myWorkflows.map(wf => (
              <div key={wf.id} onClick={() => handleOpenDetail(wf.id)} className="bg-brand-surface/30 p-6 rounded-[24px] border border-white/5 flex justify-between items-center hover:bg-brand-surface hover:border-brand-primary/30 transition-all cursor-pointer group">
                <div className="min-w-0 flex-1 pr-6">
                  <h3 className="font-bold text-base truncate text-brand-text mb-1">{wf.title}</h3>
                  <div className="flex items-center gap-3 text-[10px] text-brand-muted font-bold uppercase tracking-wider">
                    <Calendar size={12} /> {new Date(wf.createdAt).toLocaleDateString()}
                    <span className="opacity-20">|</span>
                    <Hourglass size={12} /> {wf.progress}
                  </div>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black border ${
                  wf.status === 'PENDING' ? 'border-brand-primary/20 text-brand-primary' : 
                  wf.status === 'APPROVED' ? 'border-green-500/20 text-green-500' : 'border-brand-error/20 text-brand-error'
                }`}>
                  {wf.status}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* LISTA: PENDÊNCIAS */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          <h2 className="text-sm font-black uppercase tracking-[4px] mb-8 flex items-center gap-4 text-brand-muted">
             Sua Vez <div className="flex-1 h-[1px] bg-white/5"></div>
          </h2>
          <div className="flex flex-col gap-4">
            {pendingApprovals.map(app => (
              <button key={app.id} onClick={() => handleOpenDetail(app.workflowId, app.id)} className="w-full text-left bg-brand-surface p-8 rounded-[40px] border border-brand-error/20 shadow-xl hover:border-brand-error transition-all group relative">
                <div className="flex justify-between items-start mb-6">
                  <span className="px-3 py-1 bg-brand-error/10 text-brand-error text-[10px] font-black uppercase tracking-widest rounded-lg">Ação Necessária</span>
                  <span className="text-[10px] text-brand-muted font-bold tracking-widest">{new Date(app.createdAt).toLocaleDateString()}</span>
                </div>
                <h3 className="font-black text-xl mb-2 text-brand-text tracking-tight group-hover:text-brand-error transition-colors">{app.workflowTitle}</h3>
                
                {/* Uso do ícone 'UserIcon' */}
                <p className="text-xs text-brand-muted mb-8 flex items-center gap-2">
                  <UserIcon size={14} className="text-brand-primary" />
                  Solicitado por <span className="text-brand-text font-bold">{app.requesterName}</span>
                </p>

                <div className="flex justify-end pt-6 border-t border-white/5">
                   <div className="text-xs font-black text-brand-error flex items-center gap-3 group-hover:gap-6 transition-all uppercase tracking-[2px]">
                    Avaliar Workflow <ChevronLeft size={16} className="rotate-180" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* --- MODAL GIGANTE (FULL SCREEN) --- */}
      {selectedWorkflow && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-6 animate-in fade-in duration-300">
          {/* Backdrop mais transparente e com blur */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => !isProcessingAction && setSelectedWorkflow(null)} />
          
          <div className="relative w-full max-w-[95vw] h-[92vh] bg-brand-surface rounded-[48px] border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            
            <header className="p-8 lg:px-12 border-b border-white/5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-brand-primary/10 rounded-3xl text-brand-primary"><FileText size={32} /></div>
                <div>
                  <p className="text-[10px] font-black text-brand-muted uppercase tracking-[3px] mb-1">Detalhes do Workflow</p>
                  <h2 className="text-3xl font-black text-brand-text tracking-tighter">{selectedWorkflow.title}</h2>
                </div>
              </div>
              <button onClick={() => setSelectedWorkflow(null)} className="p-4 hover:bg-white/5 rounded-full text-brand-muted transition-colors"><X size={32} /></button>
            </header>

            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
              {/* LADO ESQUERDO: RESPOSTAS */}
              <div className="flex-[3] p-8 lg:p-12 overflow-y-auto custom-scrollbar border-r border-white/5">
                <h3 className="text-xs font-black text-brand-primary uppercase tracking-[4px] mb-8">Informações Coletadas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedWorkflow.answers?.map((ans) => (
                    <div key={ans.id} className="bg-brand-bg/40 p-6 rounded-3xl border border-white/5">
                      <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2">{ans.question}</p>
                      <p className="text-base font-bold text-brand-text">{ans.value || '---'}</p>
                    </div>
                  ))}
                </div>

                {selectedApprovalId && (
                  <div className="mt-12 p-8 bg-brand-primary/5 rounded-[32px] border border-brand-primary/20">
                    <h3 className="text-xs font-black text-brand-primary uppercase tracking-[4px] mb-4 flex items-center gap-2">
                      <MessageSquare size={18} /> Sua Decisão Final
                    </h3>
                    <textarea 
                      placeholder="Escreva aqui observações ou motivos para sua decisão..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full bg-brand-bg border-white/5 rounded-2xl p-6 min-h-[140px] text-brand-text outline-none focus:border-brand-primary/50 transition-all"
                    />
                  </div>
                )}
              </div>

              {/* LADO DIREITO: FLUXO (Timeline) */}
              <div className="flex-[2] bg-white/[0.01] p-8 lg:p-12 overflow-y-auto custom-scrollbar">
                <h3 className="text-xs font-black text-brand-primary uppercase tracking-[4px] mb-10 flex items-center gap-3">
                  <GitBranch size={18} /> Fluxo de Aprovação
                </h3>
                
                <div className="relative flex flex-col gap-10">
                  <div className="absolute left-[19px] top-2 bottom-2 w-[2px] bg-white/5" />

                  {selectedWorkflow.approvals?.map((step, idx) => (
                    <div key={step.id} className="relative flex gap-6 items-start group">
                      <div className={`w-10 h-10 rounded-full shrink-0 z-10 flex items-center justify-center border-4 border-brand-surface shadow-xl transition-all ${
                        step.status === 'APPROVED' ? 'bg-green-500 text-white' : 
                        step.status === 'REJECTED' ? 'bg-brand-error text-white' : 
                        'bg-brand-bg text-brand-muted border-white/10'
                      }`}>
                        {step.status === 'APPROVED' ? <Check size={20} /> : step.status === 'REJECTED' ? <X size={20} /> : <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />}
                      </div>

                      <div className="flex-1">
                        <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-1">Passo {idx + 1}</p>
                        <h4 className="font-bold text-brand-text mb-1">{step.approverName}</h4>
                        <div className="flex items-center gap-2 mb-2">
                           <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                             step.status === 'APPROVED' ? 'bg-green-500/10 text-green-500' : 
                             step.status === 'REJECTED' ? 'bg-brand-error/10 text-brand-error' : 
                             'bg-brand-primary/10 text-brand-primary'
                           }`}>
                             {step.status === 'PENDING' ? 'Aguardando' : step.status}
                           </span>
                        </div>
                        {step.comments && (
                          <div className="bg-brand-bg/50 p-3 rounded-xl border border-white/5 italic text-xs text-brand-muted">
                            "{step.comments}"
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <footer className="p-8 lg:px-12 border-t border-white/5 bg-white/[0.02] flex flex-col sm:flex-row gap-6">
              {selectedApprovalId ? (
                <>
                  <button 
                    disabled={isProcessingAction}
                    onClick={() => handleProcessApproval('REJECTED')}
                    className="flex-1 h-16 bg-brand-error/10 hover:bg-brand-error text-brand-error hover:text-white rounded-3xl font-black text-sm uppercase tracking-[2px] transition-all flex items-center justify-center gap-3"
                  >
                    {isProcessingAction ? <Loader2 className="animate-spin" /> : <><X size={20} /> Reprovar Pedido</>}
                  </button>
                  <button 
                    disabled={isProcessingAction}
                    onClick={() => handleProcessApproval('APPROVED')}
                    className="flex-[2] h-16 bg-brand-primary hover:bg-brand-primary/80 text-white rounded-3xl font-black text-sm uppercase tracking-[2px] transition-all flex items-center justify-center gap-3 shadow-2xl shadow-brand-primary/30"
                  >
                    {isProcessingAction ? <Loader2 className="animate-spin" /> : <><Check size={20} /> Aprovar Etapa</>}
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setSelectedWorkflow(null)}
                  className="w-full h-16 bg-brand-bg border border-white/10 text-brand-muted hover:text-white rounded-3xl font-black text-sm uppercase tracking-[2px] transition-all"
                >
                  Fechar Janela
                </button>
              )}
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}