import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employee', department: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    React.useEffect(() => {
      if (localStorage.getItem('user')) {
        navigate('/');
      }
    }, [navigate]);

    const submit = async (e) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);
        setError(null);
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/auth/register`, form);
            
            // Auto-login after registration for better UX
            localStorage.setItem('user', JSON.stringify(res.data.user));
            localStorage.setItem('role', res.data.user.role);
            window.location.href = '/';
        } catch (err) {
            setLoading(false);
            setError(err.response?.data?.message || 'Failed to register account.');
        }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black p-4">
        <form onSubmit={submit} className="w-full max-w-md bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-blue-900/5 border border-blue-100 dark:border-zinc-800">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-blue-700 dark:text-blue-400">Create Account</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Join FlowHub to design and execute workflows.</p>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-6 text-sm font-medium">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
                <input required className="input-field" placeholder="Enter your full name" onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Email Address *</label>
                <input required type="email" className="input-field" placeholder="Enter your email" onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Password *</label>
                <input required className="input-field" placeholder="Enter your password" type="password" onChange={e => setForm({ ...form, password: e.target.value })} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">System Role *</label>
                  <select required className="input-field cursor-pointer" onChange={e => setForm({ ...form, role: e.target.value })}>
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                      <option value="finance">Finance Dept</option>
                      <option value="high_authority">High Authority (CEO/VP)</option>
                      <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">Department *</label>
                  <input required className="input-field" placeholder="e.g. Sales" onChange={e => setForm({ ...form, department: e.target.value })} />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl mt-8 transition-colors shadow-sm flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Registering...
                </>
              ) : 'Register Securely'}
            </button>
            <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 hover:underline transition-colors">
                Log in here
              </Link>
            </p>
        </form>
      </div>
    );
}