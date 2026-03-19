import React, { useState, useEffect } from 'react';
import axios from 'axios';

const HighAuthorityDashboard = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [executions, setExecutions] = useState([]);
  const [error, setError] = useState(null);

  const fetchPending = async () => {
    try {
      // In a real app we'd filter pending approvals for this specific high authority user
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/executions?status=pending_approval&assignee_role=high_authority`);
      setExecutions(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setExecutions([]);
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleAction = async (exId, action) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/executions/${exId}/action`, {
        action,
        approverId: user.email
      });
      fetchPending(); // Refresh list
    } catch (err) {
      setError(err.response?.data?.error || "Failed to process workflow action.");
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 transition-colors duration-300 p-6 rounded-2xl shadow-sm border border-blue-100 dark:border-zinc-800 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-blue-700 dark:text-blue-300 mb-2">Executive Portal (CEO/VP)</h1>
      <p className="text-slate-600 dark:text-slate-400 mb-8">Hello {user.name}, please review your escalated requests.</p>
      
      {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg mb-6 text-sm font-medium border border-red-200 dark:border-red-900/50">{error}</div>}

      <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800/50 rounded-xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 transition-colors">
         <div>
           <h3 className="text-2xl font-bold text-purple-800 dark:text-purple-300">{executions.length}</h3>
           <p className="text-sm text-purple-600 dark:text-purple-400">Escalated Pending Approvals</p>
         </div>
         <button onClick={fetchPending} className="w-full sm:w-auto bg-purple-600 dark:bg-purple-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition shadow-sm">
           Refresh Inbox
         </button>
      </div>

      <div className="border border-blue-50 dark:border-zinc-800 transition-colors rounded-xl p-6 shadow-sm overflow-hidden">
        <h2 className="text-xl font-bold text-blue-800 dark:text-blue-300 mb-4">Awaiting Final Authority</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
               <tr className="border-b border-slate-200 dark:border-zinc-800">
                <th className="pb-3 text-sm font-semibold text-slate-500 dark:text-slate-400">Requester / Workflow</th>
                <th className="pb-3 text-sm font-semibold text-slate-500 dark:text-slate-400 hidden sm:table-cell">Target Date</th>
                <th className="pb-3 text-sm font-semibold text-slate-500 dark:text-slate-400 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {executions.length === 0 ? (
                <tr><td colSpan="3" className="py-8 text-slate-500 text-center">Your queue is empty.</td></tr>
              ) : null}
               {executions.map(ex => (
                <tr key={ex.id} className="border-b border-slate-100 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="py-4">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs sm:text-sm">{ex.triggered_by}</span>
                    <span className="text-slate-600 dark:text-slate-400 block font-medium mt-1 truncate max-w-[120px] sm:max-w-none">{ex.workflow_name}</span>
                    <span className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 mt-2 block font-medium bg-blue-50 dark:bg-blue-900/20 p-2 rounded-md border border-blue-100 dark:border-blue-800/50 whitespace-pre-wrap">
                      Data: {Object.entries(ex.data || {}).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                    </span>
                  </td>
                  <td className="py-4 text-slate-600 dark:text-slate-400 hidden sm:table-cell">{new Date(ex.started_at).toLocaleDateString()}</td>
                  <td className="py-4 text-right">
                    <div className="flex flex-col sm:flex-row justify-end gap-2">
                      <button onClick={() => handleAction(ex.id, 'Approve')} className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 px-3 sm:px-4 py-1.5 rounded hover:bg-green-200 transition font-medium text-xs sm:text-sm">Approve</button>
                      <button onClick={() => handleAction(ex.id, 'Reject')} className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 px-3 sm:px-4 py-1.5 rounded hover:bg-red-200 transition font-medium text-xs sm:text-sm">Reject</button>
                    </div>
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

export default HighAuthorityDashboard;
