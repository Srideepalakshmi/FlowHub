import React, { useState } from 'react';
import { User, Shield, GitMerge, FileCode, Bell, PlaySquare, FileText, Lock, Database, Check } from 'lucide-react';

const Toggle = ({ initial = false }) => {
  const [isOn, setIsOn] = useState(initial);
  return (
    <div 
      onClick={() => setIsOn(!isOn)}
      className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${isOn ? 'bg-blue-600 dark:bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'}`}
    >
      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${isOn ? 'left-6' : 'left-1'}`}></div>
    </div>
  );
};

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [savedParams, setSavedParams] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{"name":"Guest", "email":"", "role": "admin"}');
  
  const [profilePic, setProfilePic] = useState(() => {
    const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
    return savedUser.profilePic || null;
  });

  const handleSave = () => {
    setSavedParams(true);
    setTimeout(() => setSavedParams(false), 3000);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result);
        const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
        savedUser.profilePic = reader.result;
        localStorage.setItem('user', JSON.stringify(savedUser));
      };
      reader.readAsDataURL(file);
    }
  };

  const tabs = [
    { id: 'profile', name: 'User Profile', icon: User },
    { id: 'roles', name: 'Role & Permissions', icon: Shield },
    { id: 'workflow', name: 'Workflow Settings', icon: GitMerge },
    { id: 'rules', name: 'Rule Engine', icon: FileCode },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'execution', name: 'Execution Settings', icon: PlaySquare },
    { id: 'audit', name: 'Audit Logs', icon: FileText },
    { id: 'security', name: 'Security Settings', icon: Lock },
    { id: 'database', name: 'Database / Backup', icon: Database },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h3 className="text-lg font-bold text-blue-900 dark:text-blue-300 mb-1">User Profile Settings</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Manage your basic account details and identity.</p>
            </div>
            <div className="flex items-center gap-6 mb-6">
              <div 
                className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-3xl font-bold border-2 border-blue-200 dark:border-blue-800 overflow-hidden bg-cover bg-center"
                style={{ backgroundImage: profilePic ? `url(${profilePic})` : 'none' }}
              >
                {!profilePic && user.name.charAt(0)}
              </div>
              <div>
                <label className="cursor-pointer bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 mr-2 transition-colors">
                  Change Photo
                  <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                </label>
                <button 
                  onClick={() => {
                    setProfilePic(null);
                    const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
                    delete savedUser.profilePic;
                    localStorage.setItem('user', JSON.stringify(savedUser));
                  }} 
                  className="text-red-500 dark:text-red-400 text-sm font-medium hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input className="input-field" defaultValue={user.name} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                <input className="input-field" defaultValue={user.email} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                <input className="input-field" type="password" placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Current Role Display</label>
                <input className="input-field bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400" disabled value={user.role.toUpperCase()} />
              </div>
            </div>
            <button onClick={handleSave} className="bg-blue-600 dark:bg-blue-500 text-white px-5 py-2.5 rounded-lg mt-4 font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors">Save Changes</button>
          </div>
        );
      
      case 'roles':
        return (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h3 className="text-lg font-bold text-blue-900 dark:text-blue-300 mb-1">Role & Permission Settings</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Configure system access matrices for different authorities.</p>
            </div>
            <div className="space-y-4">
               {['Employee', 'Manager', 'Finance', 'Higher Authority', 'Admin'].map((role, idx) => (
                 <div key={idx} className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 rounded-xl flex items-center justify-between transition-colors">
                   <div>
                     <h4 className="font-semibold text-slate-800 dark:text-slate-200">{role}</h4>
                     <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {idx === 0 ? "Allowed to create and track own requests." :
                         idx === 1 ? "Can approve/reject level 1 requests." :
                         idx === 2 ? "Can verify ultimate payment and clearance." :
                         idx === 3 ? "Has final approval overflow overrides." :
                         "Complete system administration override."}
                     </p>
                   </div>
                   <button onClick={handleSave} className="text-blue-600 dark:text-blue-400 text-sm font-medium px-3 py-1.5 border border-blue-200 dark:border-blue-800 rounded hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors">Edit Matrix</button>
                 </div>
               ))}
            </div>
          </div>
        );

      case 'workflow':
        return (
          <div className="space-y-6 animate-in fade-in">
             <div>
              <h3 className="text-lg font-bold text-blue-900 dark:text-blue-300 mb-1">Workflow Settings</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Core system controls for workflow generation and versioning.</p>
            </div>
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
                 <div>
                    <h4 className="font-medium text-slate-800 dark:text-slate-200">Auto Version Increment</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Automatically bump versions on save.</p>
                 </div>
                 <Toggle initial={true} />
              </div>
              <div className="border-b border-slate-100 dark:border-slate-700 pb-4">
                 <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-2">Default Workflow Version strategy</h4>
                 <select className="input-field max-w-xs">
                    <option>Always use latest</option>
                    <option>Pin to specific version</option>
                 </select>
              </div>
              <div>
                 <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-3">Active Workflows Status</h4>
                 <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex justify-between items-center transition-colors">
                    <div>
                      <span className="font-semibold text-blue-900 dark:text-blue-300 block">Expense Approval</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">Version 3 Active</span>
                    </div>
                    <button onClick={handleSave} className="text-red-600 dark:text-red-400 text-sm font-medium hover:underline">Force Disable</button>
                 </div>
              </div>
              <button onClick={handleSave} className="bg-blue-600 dark:bg-blue-500 text-white px-5 py-2.5 rounded-lg mt-4 font-medium hover:bg-blue-700 transition-colors">Apply Workflow Settings</button>
            </div>
          </div>
        );

      case 'rules':
        return (
          <div className="space-y-6 animate-in fade-in">
             <div>
              <h3 className="text-lg font-bold text-blue-900 dark:text-blue-300 mb-1">Rule Engine Settings</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Configure the JS-evaluator guardrails and behavior.</p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Rule Execution Strategy</label>
                <select className="input-field">
                  <option>Top-Down Priority (Halt on first match)</option>
                  <option>Evaluate All (Highest priority wins)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Invalid Expression Handling</label>
                <select className="input-field">
                  <option>Fail the entire step securely</option>
                  <option>Treat as FALSE and proceed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Max Evaluation Loop Iterations</label>
                <input type="number" className="input-field" defaultValue={50} />
              </div>
            </div>
            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg transition-colors">
               <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-2">Default Unmatched Rule Behavior</h4>
               <p className="text-xs text-blue-700 dark:text-blue-400 mb-3">If no explicit conditions match, determine the fallback routing.</p>
               <select className="input-field">
                  <option>Route to explicitly defined DEFAULT rule</option>
                  <option>Halt execution and abort workflow</option>
               </select>
            </div>
            <button onClick={handleSave} className="bg-blue-600 dark:bg-blue-500 text-white px-5 py-2.5 rounded-lg mt-4 font-medium hover:bg-blue-700 transition-colors">Save Rule Matrix</button>
          </div>
        );

      case 'notifications':
         return (
          <div className="space-y-6 animate-in fade-in">
             <div>
              <h3 className="text-lg font-bold text-blue-900 dark:text-blue-300 mb-1">Global Notification Settings</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Toggle communication bridges and channels.</p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl transition-colors">
                 <div>
                    <h4 className="font-medium text-slate-800 dark:text-slate-200">Email Notifications (SMTP)</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Send direct emails to users requiring approval actions.</p>
                 </div>
                 <Toggle initial={true} />
              </div>
              <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl transition-colors">
                 <div>
                    <h4 className="font-medium text-slate-800 dark:text-slate-200">Slack Webhook Integrations</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Broadcast workflow alerts to designated Slack channels.</p>
                 </div>
                 <Toggle initial={false} />
              </div>
              <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl transition-colors">
                 <div>
                    <h4 className="font-medium text-slate-800 dark:text-slate-200">In-App UI Alerts</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Show notification badges and live popups inside FlowHub.</p>
                 </div>
                 <Toggle initial={true} />
              </div>
            </div>
            <button onClick={handleSave} className="bg-blue-600 dark:bg-blue-500 text-white px-5 py-2.5 rounded-lg mt-4 font-medium hover:bg-blue-700 transition-colors">Save Notification Prefs</button>
          </div>
        );

      case 'execution':
        return (
           <div className="space-y-6 animate-in fade-in">
             <div>
              <h3 className="text-lg font-bold text-blue-900 dark:text-blue-300 mb-1">Execution Controls</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Safeguards and manual overrides for the active execution engine.</p>
            </div>
            <div className="grid grid-cols-2 gap-8">
               <div className="col-span-2 sm:col-span-1">
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Maximum Retry Count (Per Step)</label>
                 <input type="number" className="input-field" defaultValue={3} />
               </div>
               <div className="col-span-2 sm:col-span-1">
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Global Timeout (Seconds)</label>
                 <input type="number" className="input-field" defaultValue={86400} />
               </div>
            </div>
            <div className="border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 p-5 rounded-xl mt-4 transition-colors">
               <h4 className="font-bold text-red-700 dark:text-red-400 mb-2">Cancel Execution Permission</h4>
               <p className="text-sm text-red-600 dark:text-red-300 mb-4">Determine who is legally allowed to terminate an active workflow prematurely.</p>
               <select className="input-field">
                 <option>Only Flow Triggerer & Admins</option>
                 <option>Assigned Approvers Only</option>
                 <option>Strictly Admin Only</option>
               </select>
               <div className="mt-4 flex items-center gap-2">
                 <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-blue-600 dark:text-blue-500 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600" />
                 <span className="text-sm text-red-800 dark:text-red-200">Automatically retry failed steps upon bootup.</span>
               </div>
            </div>
            <button onClick={handleSave} className="bg-blue-600 dark:bg-blue-500 text-white px-5 py-2.5 rounded-lg mt-4 font-medium hover:bg-blue-700 transition-colors">Save Engine Settings</button>
          </div>
        );

      case 'audit':
         return (
           <div className="space-y-6 animate-in fade-in">
             <div>
              <h3 className="text-lg font-bold text-blue-900 dark:text-blue-300 mb-1">Compliance & Audit Log Settings</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Manage tracking data storage and exporting for legal compliance.</p>
            </div>
            <div className="flex items-center gap-6 mb-8">
               <div className="flex-1">
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Log Retention Period (Days)</label>
                 <select className="input-field block w-full">
                    <option>30 Days</option>
                    <option>90 Days (Quarterly)</option>
                    <option>365 Days</option>
                    <option>Indefinite</option>
                 </select>
               </div>
               <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Automatic Storage Tiering</label>
                  <select className="input-field block w-full">
                    <option>Move to Cold Storage after 90 days</option>
                    <option>Delete entirely</option>
                 </select>
               </div>
            </div>
            <div className="p-6 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 transition-colors">
               <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-3">Data Export Access</h4>
               <div className="flex items-center justify-between mb-4">
                 <span className="text-sm text-slate-600 dark:text-slate-400">Enable raw CSV/JSON export for Audit files</span>
                 <Toggle initial={true} />
               </div>
               <button className="w-full py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-lg text-sm font-medium mt-2 hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors">Download Archive (34 MB)</button>
            </div>
            <button onClick={handleSave} className="bg-blue-600 dark:bg-blue-500 text-white px-5 py-2.5 rounded-lg mt-4 font-medium hover:bg-blue-700 transition-colors">Update Compliance Rules</button>
          </div>
        );

      case 'security':
        return (
           <div className="space-y-6 animate-in fade-in">
             <div>
              <h3 className="text-lg font-bold text-blue-900 dark:text-blue-300 mb-1">Security & Access Settings</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Manage tenant safety, session states, and authentications.</p>
            </div>
             <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl transition-colors">
                 <div>
                    <h4 className="font-medium text-slate-800 dark:text-slate-200">Two-Factor Authentication (2FA)</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Require TOTP standard for all Administrator logins.</p>
                 </div>
                 <Toggle initial={false} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6 mt-4">
               <div>
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Idle Session Timeout (Minutes)</label>
                 <select className="input-field">
                   <option>15 Minutes</option>
                   <option>30 Minutes</option>
                   <option>60 Minutes</option>
                   <option>Never Timeout</option>
                 </select>
               </div>
               <div>
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">IP Whitelisting</label>
                 <input className="input-field" placeholder="192.168.*, 10.0.*" />
               </div>
            </div>
            <button onClick={handleSave} className="bg-blue-600 dark:bg-blue-500 text-white px-5 py-2.5 rounded-lg mt-4 font-medium hover:bg-blue-700 transition-colors">Enforce Security Policies</button>
          </div>
        );

      case 'database':
         return (
           <div className="space-y-6 animate-in fade-in">
             <div>
              <h3 className="text-lg font-bold text-blue-900 dark:text-blue-300 mb-1">Database & Backup Architecture</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Perform disaster recovery operations and snapshot management.</p>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 mb-6 transition-colors">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-slate-800 dark:text-slate-200">Current Database Status</span>
                <span className="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-200 dark:border-green-800">Online / Connected</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Last Automatic Backup: <strong className="text-slate-900 dark:text-slate-200">Today, 03:00 AM UTC</strong></p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Storage Used: <strong className="text-slate-900 dark:text-slate-200">142.5 MB / 10 GB (1.4%)</strong></p>
            </div>

            <div className="flex gap-4">
              <button onClick={handleSave} className="flex-1 bg-blue-600 dark:bg-blue-500 text-white font-medium py-3 rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 shadow-sm flex items-center justify-center gap-2 transition-colors">
                <Database size={18} /> Take Manual Backup
              </button>
              <button className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-colors">
                 Restore from Snapshot
              </button>
            </div>
             <p className="text-xs text-red-500 dark:text-red-400 mt-4 text-center">Warning: Restoring a snapshot will immediately overwrite the active workflow database.</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col relative">
      {/* Toast Notification */}
      {savedParams && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-green-100 dark:bg-green-900/60 border border-green-400 dark:border-green-600 text-green-800 dark:text-green-300 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 z-50 animate-in slide-in-from-top-4">
          <Check size={20} className="text-green-600 dark:text-green-400" />
          <span className="font-semibold text-sm">Settings saved successfully!</span>
        </div>
      )}

      <div className="flex items-center justify-between border-b border-blue-100 dark:border-slate-800 pb-5 mb-4 shrink-0 transition-colors">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-blue-900 dark:text-blue-300">Platform Configurations</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Full control over operations, security, and the rule engine.</p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden bg-white dark:bg-zinc-950 border border-blue-100 dark:border-zinc-800 rounded-2xl shadow-sm transition-colors duration-300">
        {/* Sidebar Nav */}
        <div className="w-64 border-r border-blue-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-black p-4 overflow-y-auto shrink-0 transition-colors">
          <ul className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive 
                        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 font-bold shadow-sm' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-zinc-900 hover:text-blue-600 dark:hover:text-blue-400'
                    }`}
                  >
                    <Icon size={18} className={isActive ? 'text-blue-700 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'} />
                    {tab.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Dynamic Content Pane */}
        <div className="flex-1 p-8 overflow-y-auto relative">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Settings;
