import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Save, Trash2, ArrowRight, Waypoints, HelpCircle } from 'lucide-react';
import axios from 'axios';

const RuleEditor = () => {
  const { id, stepId } = useParams();
  const navigate = useNavigate();

  const [step, setStep] = useState(null);
  const [workflowSteps, setWorkflowSteps] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [stepId, id]);

  const fetchData = async () => {
    try {
      const [stepRes, allStepsRes, rulesRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/workflows/${id}/steps`),
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/workflows/${id}/steps`),
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/steps/${stepId}/rules`)
      ]);
      
      const currentStep = stepRes.data.find(s => s.id === stepId);
      setStep(currentStep);
      setWorkflowSteps(allStepsRes.data);
      setRules(rulesRes.data.length ? rulesRes.data : [{ condition: 'DEFAULT', next_step_id: '', priority: 99 }]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addRule = () => {
    const newPriority = rules.filter(r => r.condition !== 'DEFAULT').length + 1;
    setRules([
       ...rules.filter(r => r.condition !== 'DEFAULT'), 
       { condition: '', next_step_id: '', priority: newPriority },
       ...rules.filter(r => r.condition === 'DEFAULT')
    ]);
  };

  const updateRule = (index, field, value) => {
    const newRules = [...rules];
    newRules[index][field] = value;
    setRules(newRules);
  };

  const deleteRule = (index) => {
    if(rules[index].condition === 'DEFAULT') return alert("Cannot delete DEFAULT rule.");
    setRules(rules.filter((_, i) => i !== index));
  };

  const saveRules = async () => {
    setSaving(true);
    try {
      const existingRules = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/steps/${stepId}/rules`);
      await Promise.all(existingRules.data.map(r => axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/rules/${r.id}`)));
      
      const rulesToSave = rules.map((r, i) => ({
        ...r,
        priority: r.condition === 'DEFAULT' ? 999 : i + 1,
        next_step_id: r.next_step_id || null
      }));

      await Promise.all(rulesToSave.map(r => axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/steps/${stepId}/rules`, r)));
      
      navigate(`/workflows/${id}/steps`);
    } catch (err) {
      console.error(err);
      alert("Error saving rules");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-[50vh] text-muted-foreground">
       <div className="w-6 h-6 rounded-full border-t-2 border-primary animate-spin mb-4"></div>
       <span className="text-sm font-medium">Loading rules...</span>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6">
        <div>
          <button onClick={() => navigate(`/workflows/${id}/steps`)} className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors">
            <ArrowLeft size={16} className="mr-1" /> Back to Pipeline
          </button>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center border border-border">
               <Waypoints className="h-5 w-5 text-foreground" />
             </div>
             <div>
               <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                 Routing Rules <span className="text-muted-foreground font-normal text-lg">›</span> <span className="text-primary">{step?.name}</span>
               </h1>
               <p className="text-muted-foreground text-sm">Configure evaluation logic to determine the next execution path.</p>
             </div>
          </div>
        </div>
        <button onClick={saveRules} disabled={saving} className="btn-primary gap-2">
          <Save size={16} /> 
          {saving ? 'Saving...' : 'Save Rules'}
        </button>
      </div>

      <div className="glass-card flex flex-col mt-2">
        <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
           <div className="flex items-center gap-2 text-sm text-muted-foreground">
             <HelpCircle size={16} className="text-primary" />
             Rules are evaluated top-to-bottom. The first matching condition determines the next step.
           </div>
           <button onClick={addRule} className="btn-secondary h-8 px-3 text-xs gap-1.5 shrink-0">
             <Plus size={14} /> Add Condition
           </button>
        </div>

        <div className="p-0 overflow-x-auto">
           <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  <th className="py-3 px-4 font-semibold text-muted-foreground w-16 text-center">Priority</th>
                  <th className="py-3 px-4 font-semibold text-muted-foreground">Condition Expression</th>
                  <th className="py-3 px-4 font-semibold text-muted-foreground w-64">Target Action</th>
                  <th className="py-3 px-4 font-semibold text-muted-foreground w-16 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rules.map((rule, idx) => (
                  <tr key={idx} className={`group transition-colors ${rule.condition === 'DEFAULT' ? 'bg-muted/10' : 'hover:bg-muted/5'}`}>
                    
                    <td className="py-3 px-4 text-center">
                      <div className="w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center text-xs font-semibold text-muted-foreground mx-auto shadow-sm">
                         {rule.condition === 'DEFAULT' ? '*' : idx + 1}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                       {rule.condition === 'DEFAULT' ? (
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-secondary text-secondary-foreground border border-border">FALLBACK</span>
                            <span className="text-muted-foreground text-xs">Evaluates if no prior conditions match</span>
                          </div>
                       ) : (
                          <input 
                            type="text" 
                            value={rule.condition}
                            onChange={(e) => updateRule(idx, 'condition', e.target.value)}
                            placeholder="e.g. amount > 1000 && department == 'IT'"
                            className="input-field h-9 text-sm font-mono tracking-tight w-full"
                          />
                       )}
                    </td>

                    <td className="py-3 px-4 relative">
                       <div className="flex items-center gap-2">
                         <div className="h-0.5 w-4 bg-muted-foreground/30 hidden sm:block"></div>
                         <div className="relative flex-1">
                           <select 
                             value={rule.next_step_id || ''} 
                             onChange={(e) => updateRule(idx, 'next_step_id', e.target.value)}
                             className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring appearance-none pr-8"
                           >
                             <option value="">End Workflow (Terminate)</option>
                             {workflowSteps.filter(s => s.id !== stepId).map(s => (
                               <option key={s.id} value={s.id}>Goto: {s.name}</option>
                             ))}
                           </select>
                           <ArrowRight className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                         </div>
                       </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                       {rule.condition !== 'DEFAULT' && (
                         <button onClick={() => deleteRule(idx)} className="h-8 w-8 rounded flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive border border-transparent transition-colors mx-auto" title="Delete condition">
                            <Trash2 size={16} />
                         </button>
                       )}
                    </td>

                  </tr>
                ))}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};

export default RuleEditor;
