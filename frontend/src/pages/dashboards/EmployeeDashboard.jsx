import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EmployeeDashboard = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [executions, setExecutions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  const fetchExecutions = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/executions?triggered_by=${user.email}`);
      setExecutions(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setExecutions([]);
    }
  };

  useEffect(() => {
    fetchExecutions();
  }, []);

  const pendingCount = executions.filter(e => e.status === 'in_progress' || e.status === 'pending_approval').length;
  
  const now = new Date();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  startOfWeek.setHours(0,0,0,0);

  const completedCount = executions.filter(e => {
    if (e.status !== 'completed') return false;
    const date = new Date(e.ended_at || e.started_at);
    return date >= startOfWeek;
  }).length;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-blue-100 dark:border-zinc-800 p-6 rounded-2xl shadow-sm max-w-4xl mx-auto transition-colors duration-300">
      <h1 className="text-3xl font-bold text-blue-700 dark:text-blue-400 mb-2">Employee Portal</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">Welcome back, {user.name}. Here is your task overview.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl p-6 text-center transition-colors">
          <h3 className="text-xl font-bold text-blue-800 dark:text-blue-300">{pendingCount}</h3>
          <p className="text-sm text-blue-600 dark:text-blue-400">Pending Approvals</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-xl p-6 text-center transition-colors">
          <h3 className="text-xl font-bold text-green-800 dark:text-green-300">{completedCount}</h3>
          <p className="text-sm text-green-600 dark:text-green-400">Completed This Week</p>
        </div>
        <div className="bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 border text-center rounded-xl p-6 shadow-sm transition-colors">
          <a href="/workflows/execute" className="block bg-blue-600 dark:bg-blue-500 text-white w-full py-2 rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition">
            Submit New Request
          </a>
        </div>
      </div>

      <div className="border border-blue-50 dark:border-zinc-800 rounded-xl p-6 shadow-sm transition-colors flex flex-col">
        <h2 className="text-xl font-bold text-blue-800 dark:text-blue-300 mb-4">My Submissions</h2>
        
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input 
            type="text" 
            placeholder="Search by workflow name or ID..." 
            className="flex-1 px-4 py-2 text-sm border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 rounded-xl focus:outline-none focus:border-blue-500 dark:text-white transition-colors"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
          <select 
            className="px-4 py-2 text-sm border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 rounded-xl focus:outline-none focus:border-blue-500 dark:text-white transition-colors"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In Progress</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="failed">Failed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="space-y-4">
          {(() => {
            const filtered = executions.filter(ex => {
              const matchesSearch = (ex.workflow_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                                    (ex.id || '').toLowerCase().includes(searchTerm.toLowerCase());
              const matchesStatus = statusFilter === 'all' || ex.status === statusFilter;
              return matchesSearch && matchesStatus;
            });
            
            const ITEMS_PER_PAGE = 5;
            const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
            const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

            if (filtered.length === 0) {
              return <p className="text-gray-500 dark:text-gray-400 text-center py-8 bg-gray-50 dark:bg-zinc-800/20 rounded-xl border border-dashed border-gray-200 dark:border-zinc-800">No submissions found matching your filters.</p>;
            }

            return (
              <>
                {paginated.map(ex => (
                   <a href={`/executions/${ex.id}/details`} key={ex.id} className="block hover:shadow-md transition-shadow">
                     <div className="flex justify-between items-center p-4 border border-gray-100 dark:border-zinc-700/50 rounded-xl bg-gray-50 dark:bg-zinc-800/50 hover:bg-white dark:hover:bg-zinc-800 hover:border-blue-200 dark:hover:border-zinc-600 transition-colors">
                       <div>
                          <h4 className="font-semibold text-gray-800 dark:text-gray-200">{ex.workflow_name}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Started: {new Date(ex.started_at).toLocaleString()}</p>
                       </div>
                       <span className={`text-xs px-3 py-1.5 rounded-full font-bold shadow-sm ${
                         ex.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                         ex.status === 'failed' || ex.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' :
                         'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-amber-400'
                       }`}>
                         {ex.status.replace('_', ' ').toUpperCase()}
                       </span>
                     </div>
                   </a>
                ))}
                
                {filtered.length > ITEMS_PER_PAGE && (
                  <div className="flex items-center justify-between pt-6 mt-4 border-t border-gray-100 dark:border-zinc-800">
                    <button 
                      disabled={currentPage === 1} 
                      onClick={() => setCurrentPage(p => p - 1)}
                      className="px-4 py-2 text-sm font-semibold border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-white dark:hover:bg-zinc-800 disabled:opacity-50 dark:text-white transition-colors bg-gray-50 dark:bg-zinc-900"
                    >
                      Previous
                    </button>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Page {currentPage} of {totalPages}</span>
                    <button 
                      disabled={currentPage === totalPages} 
                      onClick={() => setCurrentPage(p => p + 1)}
                      className="px-4 py-2 text-sm font-semibold border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-white dark:hover:bg-zinc-800 disabled:opacity-50 dark:text-white transition-colors bg-gray-50 dark:bg-zinc-900"
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
  );
};

export default EmployeeDashboard;
