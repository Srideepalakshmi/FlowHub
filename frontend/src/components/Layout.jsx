import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LayoutDashboard, GitMerge, FileText, Settings as Configer, UserCircle, Bell, LogOut, CheckCircle, Sun, Moon } from 'lucide-react';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  if (!user) return null; // Avoid rendering layout while redirecting

  useEffect(() => {
    // Fetch notifications representing pending approvals or recent activity
    const fetchNotifications = async () => {
      try {
        if (user.role && user.role !== 'employee' && user.role !== 'admin') {
          // Specific roles (manager, finance, high_authority) see only their pending approvals
          const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/executions?status=pending_approval&assignee_role=${user.role}`);
          setNotifications(res.data);
        } else if (user.role === 'admin') {
          // Admins see a mix of system alerts (failed) and pending approvals
          const [pending, failed] = await Promise.all([
             axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/executions?status=pending_approval`),
             axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/executions?status=failed`)
          ]);
          const combined = [...pending.data, ...failed.data]
              .sort((a,b) => new Date(b.started_at) - new Date(a.started_at))
              .slice(0, 10);
          setNotifications(combined);
        } else if (user.role === 'employee') {
           // Employees see their own recent executions (max 5)
           const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/executions?triggered_by=${user.email}`);
           const recents = res.data
              .filter(ex => ex.status !== 'in_progress') // only show finished/pending_approval as notifications
              .sort((a,b) => new Date(b.updated_at || b.started_at) - new Date(a.updated_at || a.started_at))
              .slice(0, 5);
           setNotifications(recents);
        }
      } catch (err) {}
    };
    
    if (user.email) {
      fetchNotifications();
      // Optionally poll every 15 seconds
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [user.email, user.role]);

  let navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  ];

  if (user.role === 'admin' || user.role === 'manager') {
     navigation.push({ name: 'Workflow Builder', href: '/workflows/new', icon: GitMerge });
  }
  
  if (user.role !== 'high_authority' && user.role !== 'admin') {
     navigation.push({ name: 'Submit Request', href: '/workflows/execute', icon: FileText });
  }

  if (user.role === 'admin' || user.role === 'high_authority') {
     navigation.push({ name: 'Audit Logs', href: '/audit-logs', icon: FileText });
  }
  
  navigation.push({ name: 'Settings', href: '/settings', icon: Configer });

  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 overflow-hidden transition-colors duration-300">
      {/* Sidebar */}
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 flex-shrink-0 border-r border-blue-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-lg flex flex-col items-stretch z-50 transition-transform duration-300 lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-blue-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
            <div className="w-8 h-8 rounded bg-blue-700 text-white flex items-center justify-center font-bold shadow-sm">
              FH
            </div>
            <span className="text-lg font-bold tracking-tight">FlowHub</span>
          </div>
          <button className="lg:hidden p-1 text-slate-500" onClick={() => setIsSidebarOpen(false)}>
            <LogOut size={20} className="rotate-180" />
          </button>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <div className="mb-4 px-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Menu
          </div>
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href.split('/new')[0]) && item.href !== '/settings' && item.href !== '/audit-logs');
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 shadow-sm border border-blue-100 dark:border-blue-900/50' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-slate-200'}
                `}
              >
                <item.icon className={`h-4 w-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`} />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-blue-100 dark:border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <UserCircle className="h-8 w-8 text-blue-400 dark:text-blue-500" />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-200 truncate">{user.name}</span>
              <span className="text-xs text-blue-500 dark:text-blue-400 truncate">{user.email}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors group font-medium text-sm border border-red-100 dark:border-red-500/20">
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-0 bg-slate-50 dark:bg-black transition-colors duration-300">
        {/* Top Header */}
        <header className="h-16 flex-shrink-0 border-b border-blue-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-between px-4 sm:px-8 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800"
            >
              <LayoutDashboard size={20} />
            </button>
            <h1 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px] sm:max-w-none">
              {navigation.find(n => location.pathname === n.href || (n.href !== '/' && location.pathname.startsWith(n.href.split('/new')[0]) && n.href !== '/settings' && n.href !== '/audit-logs'))?.name || 'Overview'}
            </h1>
          </div>
          <div className="relative flex items-center gap-4">
            
            <button
               onClick={() => setIsDark(!isDark)}
               className="p-2 rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
               title="Toggle Dark Mode"
            >
               {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-full text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors relative"
            >
              <Bell className="h-5 w-5" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-black"></span>
              )}
            </button>
            
            {showNotifications && (
              <div className="absolute top-12 right-0 w-80 max-h-[80vh] overflow-y-auto bg-white dark:bg-zinc-900 border border-blue-100 dark:border-zinc-800 shadow-xl rounded-xl p-4 z-50 transition-colors">
                <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-3 border-b border-blue-50 dark:border-zinc-800 pb-2">Notifications</h3>
                <div className="space-y-3">
                  {notifications.length === 0 ? (
                    <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      No pending tasks or alerts.
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div key={notif.id} className="flex gap-3 items-start p-2 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer" onClick={() => navigate('/')}>
                        {(user.role === 'employee') ? (
                           <CheckCircle className={`h-5 w-5 mt-0.5 ${notif.status === 'completed' ? 'text-green-500' : notif.status === 'failed' ? 'text-red-500' : 'text-blue-500'}`} />
                        ) : (
                           <Bell className="h-5 w-5 text-blue-500 dark:text-blue-400 mt-0.5" />
                        )}
                        <div>
                          <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                            {user.role === 'employee' ? `Workflow ${notif.status}` : 'Approval Required'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                             Workflow "{notif.workflow_name}" {user.role === 'employee' ? '' : `submitted by ${notif.triggered_by}`}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <button onClick={() => setShowNotifications(false)} className="w-full text-center text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mt-4 font-medium transition-colors">Close</button>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto w-full p-4 sm:p-8 relative">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
