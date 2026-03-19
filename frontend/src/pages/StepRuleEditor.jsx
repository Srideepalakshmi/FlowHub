import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Settings2, AlertCircle, Trash2, Workflow, Bell, UserCheck, GitCommit, X } from 'lucide-react';
import axios from 'axios';

const StepRuleEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // New Step Modal State
  const [showAddStep, setShowAddStep] = useState(false);
  const [newStep, setNewStep] = useState({ name: '', step_type: 'task', order: 0 });

  useEffect(() => {
    fetchSteps();
  }, [id]);

  const fetchSteps = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/workflows/${id}/steps`);
      setSteps(res.data);
      setNewStep(prev => ({ ...prev, order: res.data.length + 1 }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStep = async () => {
    if (!newStep.name) return;
    try {
       await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/workflows/${id}/steps`, newStep);
       setShowAddStep(false);
       setNewStep({ name: '', step_type: 'task', order: steps.length + 2 });
       fetchSteps();
    } catch(err) {
       console.error("Failed to create step", err);
    }
  };

  const deleteStep = async (stepId) => {
    if(!confirm("Delete this step? Rules attached to it will also be lost.")) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/steps/${stepId}`);
      fetchSteps();
    } catch (err) {
      console.error(err);
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'approval': return <UserCheck size={18} className="text-amber-500" />;
      case 'notification': return <Bell size={18} className="text-blue-500" />;
      default: return <Settings2 size={18} className="text-primary" />;
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'approval': return 'bg-amber-500/10 border-amber-500/20 text-amber-500';
      case 'notification': return 'bg-blue-500/10 border-blue-500/20 text-blue-500';
      default: return 'bg-primary/10 border-primary/20 text-primary';
    }
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-[50vh] text-muted-foreground">
       <div className="w-6 h-6 rounded-full border-t-2 border-primary animate-spin mb-4"></div>
       <span className="text-sm font-medium">Loading pipeline...</span>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6">
        <div>
          <button onClick={() => navigate(`/workflows/${id}/edit`)} className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors">
            <ArrowLeft size={16} className="mr-1" /> Back to Workflow Config
          </button>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
               <Workflow className="h-5 w-5 text-primary" />
             </div>
             <div>
               <h1 className="text-2xl font-bold tracking-tight text-foreground">Pipeline Steps</h1>
               <p className="text-muted-foreground text-sm">Define the execution sequence and routing rules.</p>
             </div>
          </div>
        </div>
        <button onClick={() => setShowAddStep(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} strokeWidth={2.5} /> Add Step
        </button>
      </div>

      <div className="relative mt-4">
        {/* Connection Line */}
        {steps.length > 0 && (
          <div className="absolute left-[27px] top-[40px] bottom-[40px] w-0.5 bg-border -z-10"></div>
        )}

        {steps.length === 0 ? (
          <div className="glass-card p-12 text-center border-dashed border-2 flex flex-col items-center justify-center">
             <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <Workflow className="text-muted-foreground w-8 h-8 opacity-50" />
             </div>
             <h3 className="text-lg font-semibold text-foreground mb-1">No Steps Defined</h3>
             <p className="text-muted-foreground text-sm mb-6 max-w-sm text-center">This workflow currently has no executable steps. Add a step to begin building the pipeline.</p>
             <button onClick={() => setShowAddStep(true)} className="btn-primary gap-2">
               <Plus size={16} /> Create First Step
             </button>
          </div>
        ) : (
          <div className="space-y-6">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex items-start gap-6 group relative">
                 {/* Node Indicator */}
                 <div className="flex flex-col items-center flex-shrink-0 pt-3">
                    <div className="w-14 h-14 rounded-full bg-card border-[3px] border-background flex items-center justify-center shadow-sm relative z-10">
                       <div className={`w-10 h-10 rounded-full flex items-center justify-center border shadow-inner ${getTypeColor(step.step_type)}`}>
                         {getTypeIcon(step.step_type)}
                       </div>
                    </div>
                 </div>
                 
                 {/* Step Card */}
                 <div className="glass-card flex-1 transition-all hover:border-muted-foreground/30">
                    <div className="p-5 flex flex-col sm:flex-row justify-between items-start gap-4">
                       <div>
                         <div className="flex items-center gap-3 mb-1">
                           <h3 className="text-lg font-semibold text-foreground">{step.name}</h3>
                           <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getTypeColor(step.step_type)}`}>
                             {step.step_type}
                           </span>
                         </div>
                         <p className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                           <GitCommit size={12} className="opacity-50" /> {step.id}
                         </p>
                       </div>
                       
                       <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                          <button onClick={() => navigate(`/workflows/${id}/steps/${step.id}/rules`)} className="btn-secondary flex-1 sm:flex-none text-xs gap-1.5 h-8">
                            <AlertCircle size={14} className="text-primary" /> Routing Rules
                          </button>
                          <button onClick={() => deleteStep(step.id)} className="h-8 w-8 rounded flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive border border-transparent hover:border-destructive/20 transition-colors shrink-0" title="Delete step">
                             <Trash2 size={16} />
                          </button>
                       </div>
                    </div>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Step Dialog */}
      {showAddStep && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
           <div className="glass-card w-full max-w-md shadow-2xl border-muted-foreground/20">
              <div className="flex justify-between items-center p-4 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">Add Pipeline Step</h2>
                <button onClick={() => setShowAddStep(false)} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted">
                  <X size={18} />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Step Name</label>
                    <input type="text" value={newStep.name} onChange={e => setNewStep({...newStep, name: e.target.value})} className="input-field" placeholder="e.g. Notify Manager" autoFocus />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Step Type</label>
                    <div className="grid grid-cols-1 gap-2">
                       {['task', 'approval', 'notification'].map(type => (
                         <label key={type} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${newStep.step_type === type ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'}`}>
                            <input 
                             type="radio" 
                             name="step_type" 
                             value={type} 
                             checked={newStep.step_type === type} 
                             onChange={e => {
                               const t = e.target.value;
                               setNewStep({...newStep, step_type: t, metadata: t === 'approval' ? { assignee_role: 'manager' } : {}});
                             }}
                             className="text-primary focus:ring-primary h-4 w-4 bg-background border-input"
                           />
                           <div className="flex items-center gap-2">
                             {getTypeIcon(type)}
                             <span className="text-sm font-medium capitalize">{type}</span>
                           </div>
                         </label>
                       ))}
                    </div>
                 </div>

                 {newStep.step_type === 'approval' && (
                    <div className="pt-2 border-t border-border mt-2">
                      <label className="block text-sm font-medium text-foreground mb-1.5">Assign To Department</label>
                      <select 
                         className="input-field w-full" 
                         value={newStep.metadata?.assignee_role || 'manager'}
                         onChange={e => setNewStep({...newStep, metadata: { ...newStep.metadata, assignee_role: e.target.value }})}
                      >
                         <option value="manager">Manager Portal (Direct Reports)</option>
                         <option value="finance">Finance Department Portal</option>
                         <option value="high_authority">CEO / Executive Portal</option>
                      </select>
                    </div>
                 )}
              </div>

              <div className="p-4 border-t border-border flex justify-end gap-3 bg-muted/10">
                 <button onClick={() => setShowAddStep(false)} className="btn-secondary h-9">Cancel</button>
                 <button onClick={handleCreateStep} disabled={!newStep.name} className="btn-primary h-9">Create Step</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default StepRuleEditor;
