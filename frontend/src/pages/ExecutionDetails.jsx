import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, CheckCircle2, XCircle, Clock, FileText, MessageSquare } from 'lucide-react';

const ExecutionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [execution, setExecution] = useState(null);
  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retrying, setRetrying] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchExecution();
  }, [id]);

  const fetchExecution = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/executions/${id}`);
      setExecution(res.data);
      if (res.data.workflow_id) {
        const wfRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/workflows/${res.data.workflow_id}`);
        setWorkflow(wfRes.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load execution details");
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
     setRetrying(true);
     try {
        await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/executions/${id}/retry`);
        fetchExecution();
     } catch (err) {
        alert(err.response?.data?.error || "Retry failed");
     } finally {
        setRetrying(false);
     }
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-[50vh] text-slate-500 dark:text-slate-400">
       <div className="w-6 h-6 rounded-full border-t-2 border-blue-600 animate-spin mb-4"></div>
       <span className="text-sm font-medium">Loading details...</span>
    </div>
  );

  if (error || !execution) return (
    <div className="max-w-4xl mx-auto p-6 text-center">
       <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 inline-block">{error || "Not found"}</div>
       <div className="mt-4"><button onClick={() => navigate('/')} className="text-blue-600 hover:underline">Go Back</button></div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-zinc-900 border border-blue-100 dark:border-zinc-800 rounded-2xl shadow-sm transition-colors duration-300">
      <button onClick={() => navigate('/')} className="flex items-center text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 mb-6 transition-colors">
        <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
      </button>

      <div className="flex justify-between items-start mb-8 pb-6 border-b border-gray-100 dark:border-zinc-800">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-blue-900 dark:text-blue-300 flex items-center gap-3">
             {workflow?.name || execution.workflow_id}
             <span className={`text-xs px-3 py-1 rounded-full font-medium ${
               execution.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
               execution.status === 'failed' || execution.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' :
               'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-amber-400'
             }`}>
               {execution.status.replace('_', ' ').toUpperCase()}
             </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
             Submitted by <span className="font-semibold text-slate-700 dark:text-slate-300">{execution.triggered_by}</span> on {new Date(execution.started_at).toLocaleString()}
          </p>
        </div>
        {user.role !== 'admin' && (execution.status === 'failed' || execution.status === 'rejected' || execution.status === 'canceled') && (
            <button 
                onClick={handleRetry} 
                disabled={retrying}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
            >
                {retrying ? 'Retrying...' : 'Retry Failed Execution'}
            </button>
        )}
      </div>

      {execution.logs && execution.logs.length > 0 && (
         <div className="mb-10 px-4">
           <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-zinc-800 pb-2">Visual Progress</h3>
           <div className="flex items-center w-full">
              {execution.logs.map((step, idx) => (
                 <React.Fragment key={idx}>
                    <div className="flex flex-col items-center relative group" title={step.step_name}>
                       <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white border-4 border-white dark:border-zinc-900 shadow-sm z-10 transition-transform group-hover:scale-110 ${
                          step.status === 'completed' ? 'bg-green-500' :
                          step.status === 'failed' || step.status === 'rejected' ? 'bg-red-500' : 
                          'bg-blue-500 animate-pulse'
                       }`}>
                          {step.status === 'completed' ? <CheckCircle2 size={18} /> :
                           step.status === 'failed' || step.status === 'rejected' ? <XCircle size={18} /> :
                           <Clock size={18} />}
                       </div>
                       <span className="text-xs font-medium mt-3 text-center text-slate-700 dark:text-slate-300 w-24 leading-tight">{step.step_name}</span>
                    </div>
                    {idx < execution.logs.length - 1 && (
                       <div className={`flex-1 h-1 -mt-8 ${execution.logs[idx].status === 'completed' ? 'bg-green-500' : 'bg-slate-200 dark:bg-zinc-700'}`}></div>
                    )}
                 </React.Fragment>
              ))}
              {(execution.status === 'in_progress' || execution.status === 'pending_approval') && (
                 <>
                   <div className="flex-1 h-1 -mt-8 bg-slate-200 dark:bg-zinc-700"></div>
                   <div className="flex flex-col items-center relative group" title="Awaiting Next Step">
                       <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 text-slate-400 dark:bg-zinc-800 border-4 border-white dark:border-zinc-900 z-10 transition-transform group-hover:scale-110">
                          <Clock size={18} />
                       </div>
                       <span className="text-xs font-medium mt-3 text-center text-slate-500 dark:text-slate-400 w-24 leading-tight whitespace-nowrap">Awaiting...</span>
                    </div>
                 </>
              )}
           </div>
         </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Request Payload */}
        <div className="space-y-4">
           <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <FileText size={18} className="text-blue-500" />
              Submission Details
           </h3>
           <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-xl p-5 border border-slate-100 dark:border-zinc-700/50">
             {Object.keys(execution.data || {}).length === 0 ? (
                <p className="text-sm text-slate-500 italic">No input data provided.</p>
             ) : (
                <div className="space-y-3">
                  {Object.entries(execution.data).map(([key, value]) => {
                     // Hide internal variables like approval_action
                     if (key.startsWith('approval_')) return null;
                     
                     return (
                       <div key={key} className="flex flex-col border-b border-slate-200 dark:border-zinc-700/50 pb-2 last:border-0 last:pb-0">
                         <span className="text-xs text-slate-500 dark:text-slate-400 capitalize mb-1">{key.replace(/_/g, ' ')}</span>
                         <span className="text-sm font-medium text-slate-800 dark:text-slate-200 break-words">{String(value)}</span>
                       </div>
                     )
                  })}
                </div>
             )}
           </div>
        </div>

        {/* Action History logs */}
        <div className="space-y-4">
           <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Clock size={18} className="text-blue-500" />
              Approval & Routing History
           </h3>
           <div className="space-y-3">
              {execution.logs?.length === 0 && (
                <p className="text-sm text-slate-500 italic">No steps executed yet.</p>
              )}
              {execution.logs?.map((log, idx) => (
                 <div key={idx} className={`p-4 rounded-xl border ${
                    log.status === 'completed' ? 'border-green-100 bg-green-50/50 dark:border-green-900/30 dark:bg-green-900/10' :
                    log.status === 'failed' || log.status === 'rejected' ? 'border-red-100 bg-red-50/50 dark:border-red-900/30 dark:bg-red-900/10' :
                    'border-slate-100 bg-slate-50 dark:border-zinc-700/50 dark:bg-zinc-800/50'
                 }`}>
                   <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {log.status === 'completed' ? <CheckCircle2 size={16} className="text-green-500"/> : 
                         log.status === 'failed' || log.status === 'rejected' ? <XCircle size={16} className="text-red-500"/> : 
                         <Clock size={16} className="text-slate-400"/>}
                      </div>
                      <div className="flex-1">
                         <div className="flex justify-between">
                            <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">{log.step_name}</h4>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider">{log.status}</span>
                         </div>
                         <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 mt-1">
                            {new Date(log.ended_at || log.started_at).toLocaleString()}
                            {log.approver_id && ` • Action by: ${log.approver_id}`}
                         </p>
                         
                         {log.error_message && (
                            <div className="mt-2 text-sm bg-white dark:bg-zinc-900 p-3 rounded-lg border border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-400 flex items-start gap-2">
                               <MessageSquare size={14} className="mt-0.5 shrink-0" />
                               <span>{log.error_message}</span>
                            </div>
                         )}
                      </div>
                   </div>
                 </div>
              ))}
           </div>
        </div>

      </div>
    </div>
  );
};

export default ExecutionDetails;
