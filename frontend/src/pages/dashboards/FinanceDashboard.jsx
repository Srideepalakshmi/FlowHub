import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FinanceDashboard = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [executions, setExecutions] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);

  const fetchPending = async () => {
    try {
      const [exRes, myRes] = await Promise.all([
         axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/executions?status=pending_approval&assignee_role=finance`),
         axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/executions?triggered_by=${user.email}`)
      ]);
      setExecutions(Array.isArray(exRes.data) ? exRes.data : []);
      setMySubmissions(Array.isArray(myRes.data) ? myRes.data : []);
    } catch (e) {
      setExecutions([]);
      setMySubmissions([]);
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
      fetchPending();
    } catch (e) {}
  };

  return (
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-blue-100 dark:border-zinc-800 max-w-5xl mx-auto transition-colors duration-300">
      <h1 className="text-3xl font-bold text-blue-700 dark:text-blue-400 mb-2">Finance Department Portal</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">Welcome {user.name}. Here is the financial approval overview.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl p-6 transition-colors">
          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">Pending Clearances</p>
          <h3 className="text-2xl font-bold text-blue-800 dark:text-blue-300">{executions.length}</h3>
          <p className="text-xs text-blue-500 dark:text-blue-400/80 mt-2">Requires financial review</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-xl p-6 transition-colors">
          <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">System Status</p>
          <h3 className="text-2xl font-bold text-green-800 dark:text-green-300">Healthy</h3>
          <p className="text-xs text-green-500 dark:text-green-400/80 mt-2">API connections active</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl p-6 transition-colors">
          <p className="text-sm text-red-600 dark:text-red-400 font-medium mb-1">Flagged / High Amount</p>
          <h3 className="text-2xl font-bold text-red-800 dark:text-red-300">Alert</h3>
          <p className="text-xs text-red-500 dark:text-red-400/80 mt-2">Review individual records carefully</p>
        </div>
      </div>

      <div className="border border-blue-50 dark:border-zinc-800 rounded-xl p-6 shadow-sm transition-colors">
        <h2 className="text-xl font-bold text-blue-800 dark:text-blue-300 mb-4">Final Stage Approvals</h2>
        <div className="space-y-4">
          {executions.length === 0 ? <p className="text-gray-500 dark:text-gray-400">No pipelines pending finance review.</p> : null}
          {executions.map(ex => (
            <div key={ex.id} className="flex justify-between items-center p-4 border border-gray-100 dark:border-zinc-700/50 rounded-lg bg-gray-50 dark:bg-zinc-800/50 hover:bg-white dark:hover:bg-zinc-800 transition-colors">
              <div className="flex flex-col">
                <span className="font-semibold text-gray-800 dark:text-gray-200">{ex.workflow_name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Requested by: {ex.triggered_by}</span>
                <span className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium bg-blue-50 dark:bg-blue-900/20 p-2 rounded-md border border-blue-100 dark:border-blue-800/50">
                  Data: {Object.entries(ex.data || {}).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                   <button onClick={() => handleAction(ex.id, 'Approve')} className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition font-medium">Clear Payment</button>
                   <button onClick={() => handleAction(ex.id, 'Reject')} className="bg-white dark:bg-transparent border border-red-300 dark:border-red-500 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg text-sm hover:bg-red-50 dark:hover:bg-red-900/30 transition font-medium">Reject</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Component X: My Submitted Requests */}
      <div className="border border-blue-50 dark:border-zinc-800 rounded-xl p-6 shadow-sm overflow-hidden transition-colors mt-8">
        <h2 className="text-xl font-bold text-blue-800 dark:text-blue-300 mb-4">My Submitted Requests</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 dark:border-zinc-800">
                <th className="pb-3 text-sm font-semibold text-gray-500 dark:text-gray-400">Workflow</th>
                <th className="pb-3 text-sm font-semibold text-gray-500 dark:text-gray-400">Status</th>
                <th className="pb-3 text-sm font-semibold text-gray-500 dark:text-gray-400">Submitted Date</th>
                <th className="pb-3 text-sm font-semibold text-gray-500 dark:text-gray-400">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {mySubmissions.length === 0 ? (
                <tr><td colSpan="4" className="py-4 text-gray-500 dark:text-gray-400 text-center">You have not submitted any workflows.</td></tr>
              ) : null}
              {mySubmissions.map(ex => (
                <tr key={ex.id} className="border-b border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="py-4 font-medium text-gray-800 dark:text-gray-200">{ex.workflow_name}</td>
                  <td className="py-4">
                     <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                       ex.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                       ex.status === 'failed' || ex.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                       'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                     }`}>{ex.status.replace('_', ' ').toUpperCase()}</span>
                  </td>
                  <td className="py-4 text-gray-600 dark:text-gray-400">{new Date(ex.started_at).toLocaleDateString()}</td>
                  <td className="py-4">
                     <a href={`/executions/${ex.id}/details`} className="text-blue-600 dark:text-blue-400 font-medium hover:underline text-sm">View Details</a>
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

export default FinanceDashboard;
