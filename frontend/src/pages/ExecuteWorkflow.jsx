import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';

const ExecuteWorkflow = () => {
  const [workflows, setWorkflows] = useState([]);
  const [selectedWf, setSelectedWf] = useState('');
  const [formData, setFormData] = useState({});
  const [customFields, setCustomFields] = useState([]); // { key: '', value: '' }
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch all available published workflows
    axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/workflows`)
      .then(res => setWorkflows(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleWfSelect = (e) => {
    setSelectedWf(e.target.value);
    setFormData({});
    setCustomFields([]);
    setError(null);
    setSuccess(null);
  };

  const handleFieldChange = (key, value, type) => {
    setFormData(prev => ({
      ...prev,
      [key]: type === 'number' ? Number(value) : value
    }));
  };

  const addCustomField = () => setCustomFields([...customFields, { key: '', value: '' }]);
  const updateCustomField = (index, field, val) => {
    const newFields = [...customFields];
    newFields[index][field] = val;
    setCustomFields(newFields);
  };
  const removeCustomField = (index) => setCustomFields(customFields.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedWf) return setError("Please select a workflow to run.");
    
    try {
      // Merge Schema data and Custom Fields
      let finalData = { ...formData };
      customFields.forEach(f => {
        if (f.key.trim() !== '') {
          // auto convert numbers if possible
          const isNum = !isNaN(f.value) && f.value.trim() !== '';
          finalData[f.key.trim()] = isNum ? Number(f.value) : f.value;
        }
      });

      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/workflows/${selectedWf}/execute`, {
        triggered_by: user.email,
        data: finalData
      });
      
      setSuccess(res.data.message || "Approval sent");
      setTimeout(() => navigate('/'), 2000);
      
    } catch (err) {
      if (err.response) {
         setError(err.response.data.error || "Failed to execute. Ensure the workflow has a start step configured.");
      } else {
         setError(err.message);
      }
    }
  };

  const selectedWorkflowDetails = workflows.find(w => w.id === selectedWf);
  const schema = selectedWorkflowDetails?.input_schema || {};
  const schemaEntries = Object.entries(schema);

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white dark:bg-zinc-900 border border-blue-100 dark:border-zinc-800 rounded-2xl shadow-sm transition-colors duration-300">
      <h1 className="text-3xl font-bold tracking-tight text-blue-900 dark:text-blue-300">Submit a Request</h1>
      <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mb-6">Fill out the required information to launch the workflow.</p>
      
      {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg mb-6 text-sm font-medium border border-red-200 dark:border-red-900/50">{error}</div>}
      {success && <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 p-3 rounded-lg mb-6 text-sm font-medium border border-green-200 dark:border-green-900/50">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Select Company Workflow *</label>
          <select 
            value={selectedWf} 
            onChange={handleWfSelect} 
            className="input-field w-full"
            required
          >
            <option value="" disabled>-- Select a Workflow --</option>
            {workflows.map(wf => (
              <option key={wf.id} value={wf.id}>{wf.name} (v{wf.version || 1})</option>
            ))}
          </select>
        </div>

        {selectedWf && (
          <div className="pt-4 border-t border-blue-50 dark:border-zinc-800 transition-colors">
            <h3 className="text-lg font-bold text-blue-800 dark:text-blue-300 mb-4">Workflow Requirements</h3>
            
            {schemaEntries.length > 0 ? (
               <div className="space-y-4">
                 {schemaEntries.map(([key, field]) => (
                   <div key={key}>
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 capitalize">
                       {key.replace(/_/g, ' ')} {field.required && <span className="text-red-500">*</span>}
                     </label>
                     {field.allowed_values && field.allowed_values.length > 0 ? (
                       <select 
                         className="input-field w-full"
                         required={field.required}
                         onChange={(e) => handleFieldChange(key, e.target.value, field.type)}
                         defaultValue=""
                       >
                         <option value="" disabled>Select an option</option>
                         {field.allowed_values.map(val => (
                           <option key={val} value={val}>{val}</option>
                         ))}
                       </select>
                     ) : (
                       <input 
                         type={field.type === 'number' ? 'number' : 'text'}
                         className="input-field w-full"
                         placeholder={`Enter ${key}`}
                         required={field.required}
                         onChange={(e) => handleFieldChange(key, e.target.value, field.type)}
                       />
                     )}
                   </div>
                 ))}
               </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 italic mb-4">No strict schema required for this workflow.</p>
            )}

            {/* Always allow dynamic extra fields just in case */}
            <div className="mt-8">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Additional Variables (Optional)</label>
                <button type="button" onClick={addCustomField} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 transition-colors flex items-center gap-1">
                  <Plus size={14} /> Add Field
                </button>
              </div>
              
              {customFields.length > 0 && (
                <div className="space-y-3">
                  {customFields.map((f, idx) => (
                    <div key={idx} className="flex gap-3">
                      <input 
                        type="text" 
                        placeholder="Variable name (e.g. amount)"
                        className="input-field w-1/3"
                        value={f.key}
                        onChange={(e) => updateCustomField(idx, 'key', e.target.value)}
                      />
                      <input 
                        type="text" 
                        placeholder="Value"
                        className="input-field flex-1"
                        value={f.value}
                        onChange={(e) => updateCustomField(idx, 'value', e.target.value)}
                      />
                      <button type="button" onClick={() => removeCustomField(idx)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <button type="submit" className="w-full bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors shadow-sm mt-8">
              Launch Workflow
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default ExecuteWorkflow;
