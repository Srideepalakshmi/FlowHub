import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import axios from 'axios';

const AdminDashboard = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [executions, setExecutions] = useState([]);

  const [workflows, setWorkflows] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [exRes, wfRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/executions`),
          axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/workflows`)
        ]);
        setExecutions(Array.isArray(exRes.data) ? exRes.data : []);
        setWorkflows(Array.isArray(wfRes.data) ? wfRes.data : []);
      } catch (e) {
        setExecutions([]);
        setWorkflows([]);
      }
    };
    fetchData();
  }, []);

  const totalReq = executions.length;
  const failedCount = executions.filter(e => e.status === 'failed' || e.status === 'rejected').length;
  const uptime = totalReq === 0 ? 100 : (((totalReq - failedCount) / totalReq) * 100).toFixed(1);

  const generateReport = () => {
    const csvContent = "data:text/csv;charset=utf-8,ID,Workflow Name,Requester,Status,Start Time\n" 
      + executions.map(ex => `${ex.id},"${ex.workflow_name}",${ex.triggered_by},${ex.status},"${new Date(ex.started_at).toISOString()}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Global_Execution_Report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-blue-100 dark:border-zinc-800 max-w-5xl mx-auto transition-colors duration-300">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-blue-700 dark:text-blue-400 mb-2">Higher Authorities (Admin) Portal</h1>
          <p className="text-gray-600 dark:text-gray-400">System Overview and Global Configuration, {user.name}.</p>
        </div>
        <button onClick={generateReport} className="bg-blue-600 dark:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition shadow-sm">
          Generate Global Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-zinc-800 border border-blue-100 dark:border-zinc-700 rounded-xl p-5 shadow-sm text-center transition-colors">
          <h3 className="text-3xl font-bold text-blue-900 dark:text-blue-300 mb-1">{totalReq}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Workflows</p>
        </div>
        <div className="bg-white dark:bg-zinc-800 border border-blue-100 dark:border-zinc-700 rounded-xl p-5 shadow-sm text-center transition-colors">
          <h3 className="text-3xl font-bold text-blue-900 dark:text-blue-300 mb-1">Active</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">System Status</p>
        </div>
        <div className="bg-white dark:bg-zinc-800 border border-blue-100 dark:border-zinc-700 rounded-xl p-5 shadow-sm text-center transition-colors">
          <h3 className="text-3xl font-bold text-blue-900 dark:text-blue-300 mb-1">{uptime}%</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Success Rate</p>
        </div>
        <div className="bg-white dark:bg-zinc-800 border border-red-100 dark:border-red-900/50 rounded-xl p-5 shadow-sm text-center transition-colors">
          <h3 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-1">{failedCount}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Failed Executions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Module 1 */}
        <div className="border border-blue-50 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-900/10 rounded-xl p-6 transition-colors">
          <h2 className="text-xl font-bold text-blue-800 dark:text-blue-300 mb-4">Quick Links</h2>
          <div className="space-y-3">
            <NavLink to="/workflows/new" className="block w-full text-left bg-white dark:bg-zinc-800 border border-blue-200 dark:border-zinc-700 px-4 py-3 rounded-lg hover:border-blue-400 dark:hover:border-blue-600 font-medium text-blue-800 dark:text-blue-300 transition">
              Manage Workflow Schemas
            </NavLink>
            <NavLink to="/audit-logs" className="block w-full text-left bg-white dark:bg-zinc-800 border border-blue-200 dark:border-zinc-700 px-4 py-3 rounded-lg hover:border-blue-400 dark:hover:border-blue-600 font-medium text-blue-800 dark:text-blue-300 transition">
              View Global Audit Logs
            </NavLink>
            <NavLink to="/settings" className="block w-full text-left bg-white dark:bg-zinc-800 border border-blue-200 dark:border-zinc-700 px-4 py-3 rounded-lg hover:border-blue-400 dark:hover:border-blue-600 font-medium text-blue-800 dark:text-blue-300 transition">
              System Settings
            </NavLink>
          </div>
        </div>

        {/* Module 2: System Activity */}
        <div className="border border-gray-100 dark:border-zinc-800 rounded-xl p-6 shadow-sm transition-colors flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">System Activity</h2>
          </div>
          
          <div className="flex gap-2 mb-4">
            <input 
              type="text" 
              placeholder="Search by workflow, user, or ID..." 
              className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 rounded-lg focus:outline-none focus:border-blue-500 dark:text-white"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
            <select 
              className="px-3 py-2 text-sm border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 rounded-lg focus:outline-none focus:border-blue-500 dark:text-white"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="failed">Failed / Rejected</option>
            </select>
          </div>

          <div className="flex-1 space-y-4 min-h-[250px]">
            {(() => {
              const filtered = executions.filter(ex => {
                const matchesSearch = (ex.workflow_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                                      (ex.triggered_by || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                      (ex.id || '').toLowerCase().includes(searchTerm.toLowerCase());
                const matchesStatus = statusFilter === 'all' || 
                                      (statusFilter === 'failed' && (ex.status === 'failed' || ex.status === 'rejected')) ||
                                      ex.status === statusFilter;
                return matchesSearch && matchesStatus;
              });
              
              const ITEMS_PER_PAGE = 5;
              const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
              const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

              return (
                <>
                  {paginated.length === 0 ? (
                    <div className="text-center text-sm text-gray-500 py-8">No results found.</div>
                  ) : (
                    paginated.map(ex => (
                      <div key={ex.id} className="flex gap-4 p-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors border border-transparent hover:border-gray-100 dark:hover:border-zinc-700/50">
                        <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                          ex.status === 'completed' ? 'bg-green-500' :
                          (ex.status === 'failed' || ex.status === 'rejected') ? 'bg-red-500' : 
                          ex.status === 'in_progress' ? 'bg-blue-500 animate-pulse' : 'bg-yellow-500'
                        }`}></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                            <span className="font-bold">{ex.workflow_name}</span> - <span className="opacity-75">{ex.status.replace('_', ' ').toUpperCase()}</span>
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{new Date(ex.started_at).toLocaleString()} by {ex.triggered_by}</p>
                          
                          {(ex.status === 'rejected' || ex.status === 'failed') && ex.logs && ex.logs.length > 0 && (() => {
                             const failLog = ex.logs.slice().reverse().find(l => l.status === 'rejected' || l.status === 'failed');
                             if (!failLog) return null;
                             return (
                               <div className="mt-2 mb-1 p-2 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-md inline-block">
                                 <p className="text-xs text-red-700 dark:text-red-400">
                                   <span className="font-semibold">Failed Stage:</span> {failLog.step_name} • 
                                   <span className="font-semibold ml-2">Action By:</span> {failLog.approver_id || 'System'} • 
                                   <span className="font-semibold ml-2">Time:</span> {new Date(failLog.ended_at).toLocaleString()}
                                 </p>
                                 {failLog.error_message && <p className="text-xs text-red-600 dark:text-red-500 mt-1 italic">"{failLog.error_message}"</p>}
                               </div>
                             );
                          })()}
                        </div>
                        <NavLink to={`/executions/${ex.id}/details`} className="text-xs text-blue-600 dark:text-blue-400 font-medium whitespace-nowrap pt-1 hover:underline">View Details</NavLink>
                      </div>
                    ))
                  )}
                  
                  {filtered.length > ITEMS_PER_PAGE && (
                    <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-100 dark:border-zinc-800">
                      <button 
                        disabled={currentPage === 1} 
                        onClick={() => setCurrentPage(p => p - 1)}
                        className="px-3 py-1 text-xs font-medium border border-gray-200 dark:border-zinc-700 rounded hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-50 dark:text-white"
                      >
                        Previous
                      </button>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Page {currentPage} of {totalPages}</span>
                      <button 
                        disabled={currentPage === totalPages} 
                        onClick={() => setCurrentPage(p => p + 1)}
                        className="px-3 py-1 text-xs font-medium border border-gray-200 dark:border-zinc-700 rounded hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-50 dark:text-white"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Module 3: Pipeline Library */}
      <div className="border border-purple-100 dark:border-purple-900/30 rounded-xl p-6 shadow-sm transition-colors mt-8 bg-purple-50/30 dark:bg-purple-900/10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-purple-800 dark:text-purple-300">Workflow Templates Database</h2>
          <NavLink to="/workflows/new" className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800/50">+ Create Workflow</NavLink>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {workflows.map(wf => (
            <div key={wf.id} className="bg-white dark:bg-zinc-800 border border-purple-200 dark:border-purple-800/50 rounded-xl p-5 shadow-sm flex flex-col justify-between transition-colors">
              <div>
                 <h3 className="font-bold text-gray-800 dark:text-gray-200 text-lg mb-1">{wf.name}</h3>
                 <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">v{wf.version || 1} • {new Date(wf.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2 mt-auto">
                 <NavLink to={`/workflows/${wf.id}/edit`} className="flex-1 text-center bg-gray-50 dark:bg-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-600 border border-gray-200 dark:border-zinc-600 text-xs font-medium px-2 py-2 rounded-lg transition text-gray-700 dark:text-gray-300">Schema</NavLink>
                 <NavLink to={`/workflows/${wf.id}/steps`} className="flex-1 text-center bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-800/50 border border-purple-200 dark:border-purple-800 text-xs font-medium px-2 py-2 rounded-lg transition text-purple-700 dark:text-purple-400 shadow-sm">Steps Editor</NavLink>
              </div>
            </div>
          ))}
          {workflows.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400 p-4">No pipelines created yet.</p>}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
