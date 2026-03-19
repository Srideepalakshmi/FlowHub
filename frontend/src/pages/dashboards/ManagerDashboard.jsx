import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ManagerDashboard = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [workflows, setWorkflows] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);

  const fetchPending = async () => {
    try {
      const [exRes, wfRes, myRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/executions?status=pending_approval&assignee_role=manager`),
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/workflows`),
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/executions?triggered_by=${user.email}`)
      ]);
      setExecutions(Array.isArray(exRes.data) ? exRes.data : []);
      setWorkflows(Array.isArray(wfRes.data) ? wfRes.data : []);
      setMySubmissions(Array.isArray(myRes.data) ? myRes.data : []);
    } catch (e) {
      setExecutions([]);
      setWorkflows([]);
      setMySubmissions([]);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleAction = async (exId, action) => {
    try {
      let comment = '';
      if (action === 'Reject') {
         comment = window.prompt("Reason for rejection (optional):");
         if (comment === null) return; // User cancelled
      }

      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/executions/${exId}/action`, {
        action,
        approverId: user.email,
        comment
      });
      fetchPending(); // Refresh list
    } catch (Error) {}
  };

  return (
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-blue-100 dark:border-zinc-800 max-w-5xl mx-auto transition-colors duration-300">
      <h1 className="text-3xl font-bold text-blue-700 dark:text-blue-400 mb-2">Manager Portal</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">Hello {user.name}, you have items awaiting your approval.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl p-6 flex justify-between items-center transition-colors">
          <div>
            <h3 className="text-2xl font-bold text-blue-800 dark:text-blue-300">{executions.length}</h3>
            <p className="text-sm text-blue-600 dark:text-blue-400">Pending Approvals</p>
          </div>
          <button onClick={fetchPending} className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
            Refresh List
          </button>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800/50 rounded-xl p-6 flex justify-between items-center transition-colors">
          <div>
            <h3 className="text-2xl font-bold text-purple-800 dark:text-purple-300">Department Status</h3>
            <p className="text-sm text-purple-600 dark:text-purple-400">Everything operating normally</p>
          </div>
        </div>
      </div>

      <div className="border border-blue-50 dark:border-zinc-800 rounded-xl p-6 shadow-sm overflow-hidden transition-colors">
        <h2 className="text-xl font-bold text-blue-800 dark:text-blue-300 mb-4">Direct Reports Submissions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 dark:border-zinc-800">
                <th className="pb-3 text-sm font-semibold text-gray-500 dark:text-gray-400">Employee</th>
                <th className="pb-3 text-sm font-semibold text-gray-500 dark:text-gray-400">Workflow</th>
                <th className="pb-3 text-sm font-semibold text-gray-500 dark:text-gray-400">Submitted Date</th>
                <th className="pb-3 text-sm font-semibold text-gray-500 dark:text-gray-400">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {executions.length === 0 ? (
                <tr><td colSpan="4" className="py-4 text-gray-500 dark:text-gray-400 text-center">No pending approvals.</td></tr>
              ) : null}
              {executions.map(ex => (
                <tr key={ex.id} className="border-b border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="py-4 font-medium text-gray-800 dark:text-gray-200">{ex.triggered_by}</td>
                  <td className="py-4">
                    <span className="text-gray-600 dark:text-gray-400 block font-medium">{ex.workflow_name}</span>
                    <span className="text-xs text-blue-600 dark:text-blue-400 mt-1 block font-medium bg-blue-50 dark:bg-blue-900/20 p-2 rounded-md border border-blue-100 dark:border-blue-800/50 mt-2 whitespace-pre-wrap">
                      Data: {Object.entries(ex.data || {}).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                    </span>
                  </td>
                  <td className="py-4 text-gray-600 dark:text-gray-400">{new Date(ex.started_at).toLocaleDateString()}</td>
                  <td className="py-4">
                    <button onClick={() => handleAction(ex.id, 'Approve')} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium mr-3">Approve</button>
                    <button onClick={() => handleAction(ex.id, 'Reject')} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium">Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

      {/* Component 3: Pipeline Library */}
      <div className="border border-purple-100 dark:border-purple-900/30 rounded-xl p-6 shadow-sm transition-colors mt-8 bg-purple-50/30 dark:bg-purple-900/10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-purple-800 dark:text-purple-300">Workflow Templates Database</h2>
          <a href="/workflows/new" className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800/50">+ Create Workflow</a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {workflows.map(wf => (
            <div key={wf.id} className="bg-white dark:bg-zinc-800 border border-purple-200 dark:border-purple-800/50 rounded-xl p-5 shadow-sm flex flex-col justify-between transition-colors">
              <div>
                 <h3 className="font-bold text-gray-800 dark:text-gray-200 text-lg mb-1">{wf.name}</h3>
                 <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">v{wf.version || 1} • {new Date(wf.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2 mt-auto">
                 <a href={`/workflows/${wf.id}/edit`} className="flex-1 w-full text-center bg-gray-50 dark:bg-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-600 border border-gray-200 dark:border-zinc-600 text-xs font-medium px-2 py-2 rounded-lg transition text-gray-700 dark:text-gray-300">Schema</a>
                 <a href={`/workflows/${wf.id}/steps`} className="flex-1 w-full text-center bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-800/50 border border-purple-200 dark:border-purple-800 text-xs font-medium px-2 py-2 rounded-lg transition text-purple-700 dark:text-purple-400 shadow-sm">Steps Editor</a>
              </div>
            </div>
          ))}
          {workflows.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400 p-4">No pipelines created yet.</p>}
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
