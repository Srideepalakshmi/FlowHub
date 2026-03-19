import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, RefreshCw, CheckCircle2, XCircle, Clock, AlertTriangle, Terminal, PlayCircle } from 'lucide-react';
import axios from 'axios';

const ExecutionTracker = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [workflow, setWorkflow] = useState(null);
  const [execution, setExecution] = useState(null);
  const [inputData, setInputData] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const logsEndRef = useRef(null);

  useEffect(() => {
    let interval;
    if (execution && execution.status === 'in_progress') {
       interval = setInterval(fetchExecutionStatus, 2000);
    }
    return () => clearInterval(interval);
  }, [execution?.status]);

  useEffect(() => {
    fetchWorkflow();
  }, [id]);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [execution?.logs]);

  const fetchWorkflow = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/workflows/${id}`);
      setWorkflow(res.data);
      
      const initialData = {};
      Object.keys(res.data.input_schema || {}).forEach(key => {
         initialData[key] = '';
      });
      setInputData(initialData);
    } catch (err) {
      console.error(err);
      setError('Workflow not found');
    } finally {
      setLoading(false);
    }
  };

  const fetchExecutionStatus = async () => {
     if(!execution?.id) return;
     try {
       const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/executions/${execution.id}`);
       setExecution(res.data);
     } catch (err) {
       console.error(err);
     }
  };

  const startExecution = async () => {
    setError(null);
    try {
      const parsedData = { ...inputData };
      if (workflow.input_schema) {
         for (const [key, config] of Object.entries(workflow.input_schema)) {
            if (config.required && !parsedData[key] && typeof parsedData[key] !== 'boolean') {
               return setError(`Field ${key} is required`);
            }
            if (config.type === 'number') parsedData[key] = parsedData[key] ? Number(parsedData[key]) : 0;
            if (config.type === 'boolean') parsedData[key] = parsedData[key] === 'true';
         }
      }

      const payload = {
        data: parsedData,
        triggered_by: 'system-user-001'
      };
      
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/workflows/${id}/execute`, payload);
      setExecution(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const cancelExecution = async () => {
     try {
       await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/executions/${execution.id}/cancel`);
       fetchExecutionStatus();
     } catch(err) {
       console.error("Cancel failed", err);
     }
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-[50vh] text-muted-foreground">
       <div className="w-6 h-6 rounded-full border-t-2 border-primary animate-spin mb-4"></div>
       <span className="text-sm font-medium">Loading execution context...</span>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <button onClick={() => navigate('/')} className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors">
            <ArrowLeft size={16} className="mr-1" /> Back to Workflows
          </button>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
               <PlayCircle className="h-5 w-5 text-emerald-500" />
             </div>
             <div>
               <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                 Execution <span className="text-muted-foreground font-normal text-[1.2rem]">›</span> {workflow?.name}
               </h1>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* Left Side: Input Data Panel */}
        <div className="md:col-span-4 lg:col-span-3 flex flex-col h-full overflow-y-auto">
          <div className="glass-card flex-1 flex flex-col">
             <div className="p-4 border-b border-border bg-muted/20">
                <h2 className="font-semibold text-foreground">Launch Payload</h2>
                <p className="text-xs text-muted-foreground mt-1">Provide required schema fields</p>
             </div>

             <div className="p-4 flex-1 overflow-y-auto space-y-4">
               {error && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-md flex items-start gap-2">
                     <AlertTriangle size={16} className="shrink-0 mt-0.5" /> 
                     <span>{error}</span>
                  </div>
               )}

               <div className="space-y-4">
                  {workflow?.input_schema && Object.entries(workflow.input_schema).map(([key, config]) => (
                     <div key={key}>
                       <label className="flex justify-between items-center text-sm font-medium text-foreground mb-1.5">
                          <span>{key} {config.required && <span className="text-destructive">*</span>}</span>
                          <span className="text-[10px] text-muted-foreground font-mono uppercase bg-muted/50 px-1.5 py-0.5 rounded">{config.type}</span>
                       </label>
                       
                       {config.allowed_values ? (
                          <select 
                            value={inputData[key]} 
                            onChange={e => setInputData({...inputData, [key]: e.target.value})}
                            className="input-field shadow-sm"
                          >
                             <option value="">Select a value...</option>
                             {config.allowed_values.map(v => <option key={v} value={v}>{v}</option>)}
                          </select>
                       ) : config.type === 'boolean' ? (
                          <div className="flex items-center gap-4 mt-2">
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                               <input type="radio" name={key} value="true" checked={inputData[key] === 'true'} onChange={e => setInputData({...inputData, [key]: e.target.value})} className="text-primary focus:ring-primary border-input bg-background" /> True
                            </label>
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                               <input type="radio" name={key} value="false" checked={inputData[key] === 'false'} onChange={e => setInputData({...inputData, [key]: e.target.value})} className="text-primary focus:ring-primary border-input bg-background" /> False
                            </label>
                          </div>
                       ) : (
                          <input 
                             type={config.type === 'number' ? 'number' : 'text'}
                             value={inputData[key]}
                             onChange={e => setInputData({...inputData, [key]: e.target.value})}
                             className="input-field shadow-sm"
                             placeholder={`Enter ${key}`}
                          />
                       )}
                     </div>
                  ))}

                  {(!workflow?.input_schema || Object.keys(workflow.input_schema).length === 0) && (
                     <div className="text-sm text-muted-foreground italic py-6 text-center border border-dashed border-border rounded-lg bg-muted/10">
                        No input payload required.
                     </div>
                  )}
               </div>
             </div>

             <div className="p-4 border-t border-border bg-card">
               <button 
                 onClick={startExecution} 
                 disabled={execution?.status === 'in_progress'}
                 className={`w-full btn-primary h-10 ${execution?.status === 'in_progress' ? 'opacity-50 cursor-not-allowed bg-muted text-muted-foreground border-border' : ''}`}
               >
                 {execution?.status === 'in_progress' ? (
                   <span className="flex items-center"><RefreshCw size={16} className="mr-2 animate-spin" /> Running...</span>
                 ) : (
                   <span className="flex items-center"><Play size={16} className="mr-2 fill-current" /> Execute Run</span>
                 )}
               </button>

               {execution?.status === 'in_progress' && (
                 <button onClick={cancelExecution} className="w-full mt-3 btn-secondary h-9 text-destructive hover:bg-destructive/10 hover:text-destructive border-transparent">
                   Abort Execution
                 </button>
               )}
             </div>
          </div>
        </div>

        {/* Right Side: Terminal / Execution Logs */}
        <div className="md:col-span-8 lg:col-span-9 flex flex-col h-full border border-border rounded-xl overflow-hidden shadow-sm">
           
           {/* Terminal Header */}
           <div className="h-12 bg-[#121214] border-b border-[#2a2a2e] flex items-center justify-between px-4 shrink-0">
             <div className="flex items-center gap-2">
                <Terminal size={16} className="text-[#8b8b93]" />
                <span className="text-[#8b8b93] text-xs font-mono tracking-wider">OUTPUT TERMINAL</span>
             </div>
             {execution && (
                <div className="flex items-center gap-2">
                   {execution.status === 'in_progress' && <RefreshCw size={14} className="text-emerald-400 animate-spin" />}
                   <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded
                      ${execution.status === 'completed' ? 'text-emerald-400 bg-emerald-400/10' : 
                        execution.status === 'failed' ? 'text-rose-400 bg-rose-400/10' : 
                        execution.status === 'canceled' ? 'text-[#8b8b93] bg-[#2a2a2e]' : 
                        'text-amber-400 bg-amber-400/10'}`}>
                      {execution.status.toUpperCase()}
                   </span>
                </div>
             )}
           </div>

           {/* Terminal Body */}
           <div className="flex-1 bg-[#09090b] text-[#d4d4d8] font-mono text-[13px] p-4 overflow-y-auto leading-relaxed scrollbar-thin scrollbar-thumb-[#2a2a2e]">
              {!execution ? (
                 <div className="h-full flex flex-col items-center justify-center text-[#52525b] space-y-3">
                    <Terminal size={40} className="mb-2 opacity-50" strokeWidth={1} />
                    <p className="text-sm">Awaiting execution trace...</p>
                 </div>
              ) : (
                 <div className="space-y-1 pb-4">
                    {/* Boot Log */}
                    <div className="text-[#8b8b93]">
                      <span className="text-blue-400">&gt;</span> Booting workflow runtime v{execution.workflow_version}...
                    </div>
                    <div className="text-[#8b8b93]">
                      <span className="text-blue-400">&gt;</span> Execution ID: <span className="text-[#d4d4d8]">{execution.id}</span>
                    </div>
                    <div className="text-[#8b8b93]">
                      <span className="text-blue-400">&gt;</span> Timestamp: <span className="text-[#d4d4d8]">{new Date(execution.started_at).toISOString()}</span>
                    </div>
                    <div className="text-[#8b8b93] mb-6">
                      <span className="text-blue-400">&gt;</span> Payload: <span className="text-emerald-400">{JSON.stringify(execution.data)}</span>
                    </div>

                    {/* Step Traces */}
                    <div className="space-y-4">
                       {execution.logs?.map((log, idx) => (
                          <div key={idx} className="bg-[#121214] border border-[#2a2a2e] rounded p-3">
                             {/* Step Header */}
                             <div className="flex justify-between items-start mb-2 border-b border-[#2a2a2e] pb-2">
                                <div className="flex items-center gap-2">
                                   {log.status === 'completed' ? <CheckCircle2 size={14} className="text-emerald-500"/> : 
                                    log.status === 'failed' ? <XCircle size={14} className="text-rose-500"/> : 
                                    <Clock size={14} className="text-[#8b8b93]"/>}
                                   <span className="font-semibold text-white">{log.step_name}</span>
                                </div>
                                <span className="text-[#8b8b93] text-[10px] uppercase border border-[#2a2a2e] px-1.5 py-0.5 rounded bg-[#18181b]">{log.step_type}</span>
                             </div>
                             
                             {/* Error Output */}
                             {log.error_message && (
                               <div className="text-rose-400 mb-2 whitespace-pre-wrap">
                                  [ERROR] {log.error_message}
                               </div>
                             )}
                             
                             {/* Rule Evaluation Trace */}
                             <div className="space-y-1 mt-3">
                                <div className="text-[#8b8b93] text-[11px] mb-1.5 flex items-center gap-2">
                                  <span className="inline-block w-2 border-t border-[#8b8b93]"></span>
                                  RULE EVALUATION TRACE
                                  <span className="flex-1 border-t border-[#8b8b93]"></span>
                                </div>
                                {log.evaluated_rules?.length ? (
                                  log.evaluated_rules.map((rule, ri) => (
                                     <div key={ri} className="flex grid grid-cols-12 gap-2 text-[12px] hover:bg-[#18181b] px-1 rounded transition-colors">
                                        <div className="col-span-10 text-[#a1a1aa] truncate">
                                          <span className="text-indigo-400">eval(</span> {rule.rule} <span className="text-indigo-400">)</span>
                                        </div>
                                        <div className={`col-span-2 text-right font-bold ${rule.result ? 'text-emerald-400' : 'text-[#52525b]'}`}>
                                          =&gt; {rule.result ? 'TRUE' : 'FALSE'}
                                        </div>
                                     </div>
                                  ))
                                ) : (
                                  <div className="text-[#8b8b93] italic">No conditionals configured -&gt; Assuming DEFAULT.</div>
                                )}
                             </div>

                             {/* Step Result Output */}
                             <div className="mt-4 pt-2 border-t border-[#2a2a2e] text-[12px]">
                                <span className="text-[#8b8b93]">ROUTING &gt; </span> 
                                {log.selected_next_step ? (
                                  <span className="text-amber-400">JUMP_TO: {log.selected_next_step}</span>
                                ) : (
                                  <span className="text-rose-400 font-bold">TERMINATE_PROCESS</span>
                                )}
                             </div>
                          </div>
                       ))}
                       
                       {/* Polling Indicator */}
                       {execution.status === 'in_progress' && (
                          <div className="flex items-center gap-2 text-[#8b8b93] text-[11px] py-2 animate-pulse">
                             <span className="text-emerald-400">&gt;</span> runtime active, awaiting next step resolution...
                          </div>
                       )}

                       {/* Completion Indicator */}
                       {execution.status === 'completed' && (
                          <div className="mt-6 pt-4 border-t border-dashed border-[#2a2a2e] text-emerald-400 font-bold flex items-center gap-2">
                             <CheckCircle2 size={16} /> PROCESS EXITED SUCCESSFULLY
                          </div>
                       )}
                       {execution.status === 'failed' && (
                          <div className="mt-6 pt-4 border-t border-dashed border-[#2a2a2e] text-rose-500 font-bold flex items-center gap-2">
                             <XCircle size={16} /> PROCESS EXITED WITH ERRORS
                          </div>
                       )}
                    </div>
                    
                    <div ref={logsEndRef} />
                 </div>
              )}
           </div>
        </div>

      </div>
    </div>
  );
};

export default ExecutionTracker;
