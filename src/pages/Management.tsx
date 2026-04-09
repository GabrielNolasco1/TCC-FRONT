import { useState, useEffect, useCallback } from 'react';
import { 
  Search, Filter, Calendar, FileText, Loader2, 
  AlertCircle, Eye, User as UserIcon, MapPin, X, GitBranch, Check
} from 'lucide-react';
import { api, useAuthStore } from '../store/useAuthStore';
import { getErrorMessage } from '../utils/handle-error';

// --- TIPAGENS ---
interface WorkflowSummary {
  id: string;
  title: string;
  requesterName: string;
  areaName: string;
  areaId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

// Interface criada para remover os "any" do Modal
interface WorkflowDetail {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  answers: { id: string; question: string; value: string }[];
  approvals: { 
    id: string; 
    status: string; 
    order: number; 
    approverName: string; 
    comments: string | null 
  }[];
}

export function Management() {
  const { user } = useAuthStore();
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Modal (agora tipado corretamente)
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowDetail | null>(null);

  const fetchManagementData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get<WorkflowSummary[]>('/workflows/management'); 
      setWorkflows(res.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchManagementData(); }, [fetchManagementData]);

  const handleOpenDetail = async (workflowId: string) => {
    try {
      const res = await api.get<WorkflowDetail>(`/workflows/${workflowId}`);
      setSelectedWorkflow(res.data);
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const filteredData = workflows.filter(wf => {
    // PROTEÇÃO CONTRA O ERRO DO toLowerCase()
    const safeTitle = wf.title || '';
    const safeRequester = wf.requesterName || '';

    const matchesSearch = safeTitle.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          safeRequester.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesArea = user?.access === 'MASTER' ? (filterArea ? wf.areaId === filterArea : true) : true;
    const matchesStatus = filterStatus ? wf.status === filterStatus : true;
    const matchesDate = filterDate ? wf.createdAt.startsWith(filterDate) : true;

    return matchesSearch && matchesArea && matchesStatus && matchesDate;
  });

  const uniqueAreas = Array.from(new Set(workflows.map(w => ({ id: w.areaId, name: w.areaName }))))
    .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

  if (user?.access !== 'MASTER' && user?.access !== 'ADMIN') {
    return <div className="p-8 text-center text-brand-error font-bold">ACESSO NEGADO</div>;
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto h-full flex flex-col animate-in fade-in duration-500">
      <header className="mb-10">
        <h1 className="text-4xl font-black tracking-tighter text-brand-text">Gestão Global</h1>
        <p className="text-brand-muted font-bold text-xs uppercase tracking-[3px] mt-2">
          Monitoramento de Processos <span className="mx-2 opacity-20">|</span> {user.access}
        </p>
      </header>

      <section className="bg-brand-surface/40 p-6 rounded-[32px] border border-white/5 mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shadow-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={16} />
          <input 
            type="text" placeholder="Título ou Solicitante..." 
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 text-xs bg-brand-bg/50"
          />
        </div>

        {user.access === 'MASTER' && (
          <select 
            value={filterArea} onChange={e => setFilterArea(e.target.value)}
            className="w-full p-3 bg-brand-bg/50 border border-white/10 rounded-xl text-xs outline-none"
          >
            <option value="">Todas as Áreas</option>
            {uniqueAreas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        )}

        <select 
          value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="w-full p-3 bg-brand-bg/50 border border-white/10 rounded-xl text-xs outline-none"
        >
          <option value="">Todos os Status</option>
          <option value="PENDING">Pendentes</option>
          <option value="APPROVED">Aprovados</option>
          <option value="REJECTED">Rejeitados</option>
        </select>

        <input 
          type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
          className="w-full text-xs bg-brand-bg/50"
        />
      </section>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-primary" size={40} /></div>
        ) : error ? (
          <div className="bg-brand-error/10 p-6 rounded-2xl flex items-center gap-3 text-brand-error font-bold text-sm uppercase">
            <AlertCircle /> {error}
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-20 opacity-20 flex flex-col items-center gap-4">
            <Filter size={48} />
            <p className="font-bold uppercase tracking-widest text-xs">Nenhum resultado encontrado para os filtros</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-10">
            {filteredData.map(wf => (
              <div key={wf.id} className="bg-brand-surface p-5 rounded-[24px] border border-white/5 flex flex-col md:flex-row md:items-center justify-between hover:border-brand-primary/30 transition-all group">
                <div className="flex items-center gap-5 flex-1 min-w-0">
                  <div className={`p-3 rounded-2xl shrink-0 ${
                    wf.status === 'APPROVED' ? 'bg-green-500/10 text-green-500' :
                    wf.status === 'REJECTED' ? 'bg-brand-error/10 text-brand-error' : 'bg-brand-primary/10 text-brand-primary'
                  }`}>
                    <FileText size={24} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-brand-text truncate mb-1">{wf.title}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 items-center text-[10px] text-brand-muted font-bold uppercase tracking-tighter">
                      <span className="flex items-center gap-1"><UserIcon size={10} className="text-brand-primary" /> {wf.requesterName}</span>
                      {user.access === 'MASTER' && (
                        <span className="flex items-center gap-1"><MapPin size={10} /> {wf.areaName}</span>
                      )}
                      <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(wf.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-0 border-white/5">
                  <div className={`text-[10px] font-black px-3 py-1 rounded-lg border ${
                    wf.status === 'PENDING' ? 'border-brand-primary/20 text-brand-primary' : 
                    wf.status === 'APPROVED' ? 'border-green-500/20 text-green-500' : 'border-brand-error/20 text-brand-error'
                  }`}>
                    {wf.status}
                  </div>
                  
                  <button onClick={() => handleOpenDetail(wf.id)} className="p-3 bg-brand-bg rounded-xl text-brand-muted hover:text-brand-primary transition-colors group-hover:translate-x-1 cursor-pointer">
                    <Eye size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- MODAL DE VISUALIZAÇÃO --- */}
      {selectedWorkflow && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setSelectedWorkflow(null)} />
          
          <div className="relative w-full max-w-[95vw] h-[92vh] bg-brand-surface rounded-[48px] border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <header className="p-8 lg:px-12 border-b border-white/5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-brand-primary/10 rounded-3xl text-brand-primary"><FileText size={32} /></div>
                <div>
                  <p className="text-[10px] font-black text-brand-muted uppercase tracking-[3px] mb-1">Visualização de Processo</p>
                  <h2 className="text-3xl font-black text-brand-text tracking-tighter">{selectedWorkflow.title}</h2>
                </div>
              </div>
              <button onClick={() => setSelectedWorkflow(null)} className="p-4 hover:bg-white/5 rounded-full text-brand-muted transition-colors"><X size={32} /></button>
            </header>

            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
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
              </div>

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
                        step.status === 'REJECTED' ? 'bg-brand-error text-white' : 'bg-brand-bg text-brand-muted border-white/10'
                      }`}>
                        {step.status === 'APPROVED' ? <Check size={20} /> : step.status === 'REJECTED' ? <X size={20} /> : <div className="w-2 h-2 rounded-full bg-brand-primary" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-1">Passo {idx + 1}</p>
                        <h4 className="font-bold text-brand-text mb-1">{step.approverName}</h4>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                          step.status === 'APPROVED' ? 'bg-green-500/10 text-green-500' : 
                          step.status === 'REJECTED' ? 'bg-brand-error/10 text-brand-error' : 'bg-brand-primary/10 text-brand-primary'
                        }`}>{step.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}