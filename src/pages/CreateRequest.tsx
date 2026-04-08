import { useState, useEffect } from 'react';
import { Layers, FileText, ArrowLeft, Loader2, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../store/useAuthStore';
import { getErrorMessage } from '../utils/handle-error';
import { useNavigate } from 'react-router-dom';
import type { Area } from '../types/api';

// Tipagens locais
interface SolicitationCategory {
  id: string;
  name: string;
  areaId: string;
}

interface InputDef {
  id: string;
  question: string;
  name: string;
  type: string;
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

export function CreateRequest() {
  const navigate = useNavigate();

  // Estados Base
  const [areas, setAreas] = useState<Area[]>([]);
  const [types, setTypes] = useState<SolicitationCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Navegação do Wizard (Passos)
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [selectedType, setSelectedType] = useState<SolicitationCategory | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados do Formulário Dinâmico (Passo 3)
  const [formStructure, setFormStructure] = useState<SectionDef[]>([]);
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [workflowTitle, setWorkflowTitle] = useState(''); // Obrigatório no seu Backend
  const [answers, setAnswers] = useState<Record<string, string>>({}); // { inputId: "valor" }
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Busca inicial (Áreas e Categorias)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resAreas, resTypes] = await Promise.all([
          api.get<Area[]>('/areas'),
          api.get<SolicitationCategory[]>('/solicitations')
        ]);
        setAreas(resAreas.data);
        setTypes(resTypes.data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Quando escolhe o tipo, busca o formulário dele
  const handleSelectType = async (type: SolicitationCategory) => {
    setSelectedType(type);
    setIsLoadingForm(true);
    setError('');
    try {
      const res = await api.get<{ sections: SectionDef[] }>(`/solicitations/${type.id}/form`);
      setFormStructure(res.data.sections || []);
      // Reseta as respostas e sugere um título
      setAnswers({});
      setWorkflowTitle(`${type.name} - ${new Date().toLocaleDateString()}`);
    } catch (err) {
      setError(`Falha ao carregar formulário: ${getErrorMessage(err)}`);
      setSelectedType(null); // Volta pro passo 2 se der erro
    } finally {
      setIsLoadingForm(false);
    }
  };

  // Lida com a mudança de qualquer input dinâmico
  const handleAnswerChange = (inputId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [inputId]: value }));
  };

  // Lida com o checkbox múltiplo (salva como string separada por vírgula)
  const handleCheckboxChange = (inputId: string, option: string, checked: boolean) => {
    setAnswers(prev => {
      const current = prev[inputId] ? prev[inputId].split(',') : [];
      if (checked) current.push(option);
      else current.splice(current.indexOf(option), 1);
      
      return { ...prev, [inputId]: current.join(',') };
    });
  };

  // Envio final para o backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) return;
    
    setIsSubmitting(true);
    setError('');

    // Prepara o DTO esperado pelo CreateWorkflowUseCase
    let globalOrder = 1;
    const answersDTO = [];

    for (const section of formStructure) {
      for (const input of section.inputs) {
        const value = answers[input.id] || '';
        if (input.isRequired && !value) {
          setError(`Preencha o campo obrigatório: ${input.question}`);
          setIsSubmitting(false);
          return;
        }
        answersDTO.push({ inputId: input.id, value, order: globalOrder++ });
      }
    }

    try {
      await api.post('/workflows', {
        solicitationId: selectedType.id,
        title: workflowTitle,
        answers: answersDTO
      });
      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Telas de Feedback (Loading, Erro, Sucesso)
  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 size={40} className="animate-spin text-brand-primary opacity-50" /></div>;
  if (success) return (
    <div className="h-full flex flex-col items-center justify-center animate-in zoom-in-95 duration-500">
      <CheckCircle2 size={80} className="text-brand-primary mb-6" />
      <h2 className="text-3xl font-black text-brand-text mb-2">Solicitação Enviada!</h2>
      <p className="text-brand-muted mb-8 text-center max-w-md">Sua solicitação foi criada e enviada para aprovação. Você pode acompanhar o status na sua Dashboard.</p>
      <button onClick={() => navigate('/')} className="btn-primary px-8">Voltar para a Home</button>
    </div>
  );

  const availableTypes = types.filter(t => 
      selectedArea && t.areaId === selectedArea.id && t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-10">
        {(selectedArea || selectedType) && (
          <button 
            onClick={() => { 
              if (selectedType) setSelectedType(null); 
              else { setSelectedArea(null); setSearchTerm(''); }
            }}
            className="flex items-center gap-2 text-brand-muted hover:text-brand-primary transition-colors mb-4 text-xs font-bold uppercase tracking-widest"
          >
            <ArrowLeft size={16} /> Voltar
          </button>
        )}
        <h1 className="text-4xl font-black tracking-tighter text-brand-text">Nova Solicitação</h1>
        <p className="text-brand-muted font-bold text-xs uppercase tracking-[3px] mt-2">
          {!selectedArea ? 'Passo 1: Selecione a Área' : !selectedType ? `Passo 2: Serviços de ${selectedArea.name}` : `Passo 3: Formulário de ${selectedType.name}`}
        </p>
      </header>

      {error && (
        <div className="bg-brand-error/10 border-l-2 border-brand-error p-4 rounded-lg flex items-center gap-3 mb-8 animate-in fade-in">
          <AlertCircle size={18} className="text-brand-error shrink-0" />
          <p className="text-brand-error text-xs font-bold uppercase">{error}</p>
        </div>
      )}

      {/* PASSO 1: ESCOLHER A ÁREA */}
      {!selectedArea && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in zoom-in-95 duration-300">
          {areas.map(area => {
            const typeCount = types.filter(t => t.areaId === area.id).length;
            return (
              <button key={area.id} onClick={() => setSelectedArea(area)} className="bg-brand-surface p-6 rounded-3xl border border-white/5 shadow-lg hover:border-brand-primary/50 transition-all text-left flex items-center gap-6 group">
                <div className="p-4 bg-brand-primary/10 rounded-2xl text-brand-primary group-hover:scale-110 transition-transform"><Layers size={28} /></div>
                <div>
                  <h3 className="text-xl font-bold text-brand-text mb-1">{area.name}</h3>
                  <p className="text-[10px] text-brand-muted uppercase font-black tracking-widest">{typeCount} {typeCount === 1 ? 'Serviço' : 'Serviços'}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* PASSO 2: ESCOLHER O TIPO */}
      {selectedArea && !selectedType && (
        <div className="animate-in slide-in-from-right-8 duration-300">
          <div className="mb-8 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" size={20} />
            <input type="text" placeholder="Buscar serviço..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 bg-brand-surface border-white/10" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {availableTypes.map(type => (
              <button key={type.id} onClick={() => handleSelectType(type)} className="bg-brand-surface/40 p-5 rounded-2xl border border-white/5 flex items-center gap-4 hover:border-brand-primary transition-all text-left group">
                <div className="p-3 bg-white/5 rounded-xl text-brand-muted group-hover:text-brand-primary group-hover:bg-brand-primary/20 transition-colors shrink-0"><FileText size={20} /></div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-brand-text truncate">{type.name}</h3>
                  <p className="text-[10px] text-brand-muted uppercase mt-1">Ref: {type.id.slice(0, 8)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* PASSO 3: PREENCHER FORMULÁRIO */}
      {selectedType && (
        <div className="animate-in slide-in-from-right-8 duration-300 bg-brand-surface p-6 lg:p-10 rounded-3xl border border-white/5 shadow-2xl">
          {isLoadingForm ? (
            <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-brand-primary" /></div>
          ) : formStructure.length === 0 ? (
            <p className="text-center text-brand-muted italic py-10">Este serviço ainda não possui um formulário configurado.</p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-10">
              
              {/* Título do Workflow (Identificador) */}
              <div className="bg-brand-bg p-6 rounded-2xl border border-white/5 border-l-4 border-l-brand-primary">
                <label className="text-xs font-black text-brand-primary uppercase tracking-widest block mb-2">Identificação do Pedido</label>
                <input type="text" required value={workflowTitle} onChange={e => setWorkflowTitle(e.target.value)} className="w-full text-base font-bold bg-transparent border-b border-white/20 pb-2 outline-none focus:border-brand-primary transition-colors" placeholder="Ex: Compra de Material - Setor RH" />
                <p className="text-[10px] text-brand-muted mt-2">Dê um nome claro para facilitar a aprovação.</p>
              </div>

              {/* Seções Dinâmicas */}
              {formStructure.map((section, sIndex) => (
                <div key={section.id} className="flex flex-col gap-6">
                  <h3 className="text-lg font-bold text-brand-text border-b border-white/5 pb-2 flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center text-xs">{sIndex + 1}</span>
                    {section.name}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {section.inputs.map(input => (
                      <div key={input.id} className={`${input.type === 'longtext' ? 'md:col-span-2' : ''}`}>
                        <label className="text-xs font-bold text-brand-muted uppercase tracking-wider block mb-2">
                          {input.question} {input.isRequired && <span className="text-brand-error">*</span>}
                        </label>

                        {/* RENDERIZADOR DINÂMICO DE INPUTS */}
                        {input.type === 'longtext' ? (
                          <textarea required={input.isRequired} value={answers[input.id] || ''} onChange={e => handleAnswerChange(input.id, e.target.value)} className="w-full p-3 bg-brand-bg rounded-xl border border-white/10 min-h-[100px]" />
                        ) : input.type === 'select' ? (
                          <select required={input.isRequired} value={answers[input.id] || ''} onChange={e => handleAnswerChange(input.id, e.target.value)} className="w-full p-3 bg-brand-bg rounded-xl border border-white/10 outline-none">
                            <option value="">Selecione...</option>
                            {input.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        ) : input.type === 'radio' ? (
                          <div className="flex flex-col gap-2 p-2">
                            {input.options?.map(opt => (
                              <label key={opt} className="flex items-center gap-3 cursor-pointer">
                                <input type="radio" name={input.id} value={opt} required={input.isRequired} checked={answers[input.id] === opt} onChange={e => handleAnswerChange(input.id, e.target.value)} className="w-4 h-4 accent-brand-primary" />
                                <span className="text-sm">{opt}</span>
                              </label>
                            ))}
                          </div>
                        ) : input.type === 'checkbox' ? (
                          <div className="flex flex-col gap-2 p-2">
                            {input.options?.map(opt => {
                              const isChecked = (answers[input.id] || '').split(',').includes(opt);
                              return (
                                <label key={opt} className="flex items-center gap-3 cursor-pointer">
                                  <input type="checkbox" checked={isChecked} onChange={e => handleCheckboxChange(input.id, opt, e.target.checked)} className="w-4 h-4 accent-brand-primary rounded" />
                                  <span className="text-sm">{opt}</span>
                                </label>
                              );
                            })}
                          </div>
                        ) : (
                          // text, number, email, tel, cnpj, date
                          <input type={input.type === 'cnpj' ? 'text' : input.type} required={input.isRequired} value={answers[input.id] || ''} onChange={e => handleAnswerChange(input.id, e.target.value)} className="w-full p-3 bg-brand-bg rounded-xl border border-white/10" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="pt-6 border-t border-white/5 flex justify-end">
                <button type="submit" disabled={isSubmitting} className="btn-primary px-10 py-4 text-sm w-full md:w-auto">
                  {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Enviar para Aprovação'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}