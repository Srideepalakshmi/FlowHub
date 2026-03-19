import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Plus, Trash2, Settings2, Database, Workflow } from 'lucide-react';
import axios from 'axios';

const WorkflowEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(id ? true : false);
  const [saving, setSaving] = useState(false);
  
  const [workflow, setWorkflow] = useState({
    name: '',
    input_schema: {}
  });

  const [schemaFields, setSchemaFields] = useState([]);

  useEffect(() => {
    if (id) fetchWorkflow();
  }, [id]);

  const fetchWorkflow = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/workflows/${id}`);
      setWorkflow(res.data);
      
      const fields = Object.entries(res.data.input_schema || {}).map(([key, value]) => ({
        key,
        ...value,
        allowed_values: value.allowed_values ? value.allowed_values.join(', ') : ''
      }));
      setSchemaFields(fields);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addSchemaField = () => {
    setSchemaFields([...schemaFields, { key: '', type: 'string', required: false, allowed_values: '' }]);
  };

  const updateSchemaField = (index, field, value) => {
    const newFields = [...schemaFields];
    newFields[index][field] = value;
    setSchemaFields(newFields);
  };

  const removeSchemaField = (index) => {
    setSchemaFields(schemaFields.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const schemaObj = {};
      schemaFields.forEach(f => {
        if (!f.key) return;
        
        schemaObj[f.key] = {
          type: f.type,
          required: f.required
        };
        
        if (f.allowed_values && f.allowed_values.trim() !== '') {
          schemaObj[f.key].allowed_values = f.allowed_values.split(',').map(v => v.trim());
        }
      });

      const payload = {
        name: workflow.name,
        input_schema: schemaObj
      };

      let res;
      if (id) {
         res = await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/workflows/${id}`, payload);
      } else {
         res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/workflows`, payload);
      }
      
      navigate('/');
    } catch (err) {
      console.error(err);
      alert('Error saving workflow');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-[50vh] text-muted-foreground">
       <div className="w-6 h-6 rounded-full border-t-2 border-primary animate-spin mb-4"></div>
       <span className="text-sm font-medium">Loading editor...</span>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <button onClick={() => navigate('/')} className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors">
            <ArrowLeft size={16} className="mr-1" /> Back to Workflows
          </button>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {id ? 'Edit Workflow' : 'Create Workflow'}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Define the core properties and input data schema.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {id && (
            <button onClick={() => navigate(`/workflows/${id}/steps`)} className="btn-secondary gap-2">
              <Workflow size={16} />
              Steps Editor
            </button>
          )}
          <button onClick={handleSave} disabled={saving || !workflow.name} className="btn-primary gap-2">
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: General Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card">
            <div className="p-4 border-b border-border flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-foreground">General Settings</h2>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Workflow Name</label>
                <input 
                  type="text" 
                  value={workflow.name} 
                  onChange={e => setWorkflow({...workflow, name: e.target.value})}
                  placeholder="e.g. Expense Approval" 
                  className="input-field" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Schema Editor */}
        <div className="lg:col-span-2">
          <div className="glass-card flex flex-col h-full">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-foreground">Input Schema</h2>
              </div>
              <button onClick={addSchemaField} className="btn-secondary h-8 px-2 text-xs gap-1">
                <Plus size={14} /> Add Field
              </button>
            </div>
            
            <div className="p-4 flex-1">
              <p className="text-sm text-muted-foreground mb-4">
                Define the data fields required when triggering this workflow. This enforces strict typing on execution.
              </p>

              <div className="border border-border rounded-lg overflow-hidden bg-muted/10">
                {schemaFields.length === 0 ? (
                  <div className="text-center py-12 px-4 text-muted-foreground">
                    <Database className="h-8 w-8 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium">No schema fields defined</p>
                    <p className="text-xs mt-1">Executions will not require any specific input payloads.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    <div className="grid grid-cols-12 gap-4 p-3 bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <div className="col-span-10 sm:col-span-3">Field Key</div>
                      <div className="col-span-6 sm:col-span-3 hidden sm:block">Type & Req.</div>
                      <div className="col-span-6 sm:col-span-5 hidden sm:block">Allowed Values</div>
                      <div className="col-span-2 sm:col-span-1 text-center">Act</div>
                    </div>
                    
                    {schemaFields.map((field, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-4 p-3 items-start sm:items-center hover:bg-muted/10 transition-colors">
                        {/* Key */}
                        <div className="col-span-10 sm:col-span-3">
                          <input 
                            type="text" 
                            placeholder="e.g. amount"
                            value={field.key}
                            onChange={(e) => updateSchemaField(idx, 'key', e.target.value)}
                            className="input-field h-8 text-sm font-mono shadow-none w-full"
                          />
                        </div>
                        
                        {/* Type & Required */}
                        <div className="col-span-12 sm:col-span-3 flex items-center gap-3">
                          <select 
                            value={field.type} 
                            onChange={(e) => updateSchemaField(idx, 'type', e.target.value)}
                            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          >
                            <option value="string">String</option>
                            <option value="number">Number</option>
                            <option value="boolean">Boolean</option>
                          </select>
                          
                          <label className="flex items-center gap-1.5 cursor-pointer text-sm font-medium whitespace-nowrap text-muted-foreground hover:text-foreground transition-colors">
                             <input 
                               type="checkbox" 
                               checked={field.required} 
                               onChange={(e) => updateSchemaField(idx, 'required', e.target.checked)} 
                               className="h-4 w-4 rounded border-input text-primary focus:ring-primary bg-background" 
                             />
                             Req
                          </label>
                        </div>
                        
                        {/* Allowed Values */}
                        <div className="col-span-10 sm:col-span-5">
                          <input 
                            type="text" 
                            placeholder="e.g. High, Medium, Low"
                            value={field.allowed_values}
                            onChange={(e) => updateSchemaField(idx, 'allowed_values', e.target.value)}
                            className="input-field h-8 text-sm shadow-none w-full"
                          />
                        </div>

                        {/* Actions */}
                        <div className="col-span-2 sm:col-span-1 flex justify-center">
                          <button onClick={() => removeSchemaField(idx)} className="h-8 w-8 rounded flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors" title="Remove field">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowEditor;
