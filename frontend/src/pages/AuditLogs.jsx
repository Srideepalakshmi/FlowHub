import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { NavLink } from 'react-router-dom';
import { FileText, Eye } from 'lucide-react';

const AuditLogs = () => {
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/executions`);
        setExecutions(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error("Failed to load audit logs", e);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-border pb-6 transition-colors duration-300">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">System Audit Logs</h1>
          <p className="text-muted-foreground text-sm mt-1">Review all organizational workflow executions and access records.</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden shadow-sm transition-colors duration-300">
        {loading ? (
            <div className="p-12 text-center text-muted-foreground">Loading audit records...</div>
        ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-muted/30 border-b border-border">
                  <tr>
                    <th className="py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Timestamp</th>
                    <th className="py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                    <th className="py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Workflow</th>
                    <th className="py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-border">
                  {executions.length === 0 ? (
                    <tr><td colSpan="5" className="py-8 text-center text-muted-foreground">No execution records found.</td></tr>
                  ) : null}
                  {executions.map(ex => (
                    <tr key={ex.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 text-foreground whitespace-nowrap">{new Date(ex.started_at).toLocaleString()}</td>
                      <td className="py-3 px-4 text-foreground font-medium">{ex.triggered_by}</td>
                      <td className="py-3 px-4 text-muted-foreground">{ex.workflow_name}</td>
                      <td className="py-3 px-4">
                         <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                           ex.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                           ex.status === 'failed' || ex.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                           'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                         }`}>
                           {ex.status.toUpperCase()}
                         </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                         <NavLink to={`/executions/${ex.id}/details`} className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/70 transition-colors bg-primary/10 px-3 py-1.5 rounded-md">
                           <Eye size={14} /> View
                         </NavLink>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
