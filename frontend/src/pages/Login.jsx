import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    if (localStorage.getItem('user')) {
      navigate('/');
    }
  }, [navigate]);

  const login = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/auth/login`, {
        email, password
      });

      localStorage.setItem('user', JSON.stringify(res.data));
      localStorage.setItem('role', res.data.role);
      
      window.location.href = '/';
    } catch (err) {
      setLoading(false);
      if (err.response) {
        setError(err.response.data.message || 'Invalid credentials');
      } else {
        setError('Network error, please check if backend is running.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black p-4">
      <form onSubmit={login} className="w-full max-w-md bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-blue-900/5 border border-blue-100 dark:border-zinc-800">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-700 dark:text-blue-400">Welcome Back</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Log in to your FlowHub account.</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-6 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
            <input
              required
              type="email"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
              placeholder="Enter your email"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <input
              required
              type="password"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
              placeholder="Enter your password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className={`w-full bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl mt-8 transition-colors shadow-sm flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Signing In...
            </>
          ) : 'Sign In'}
        </button>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 hover:underline transition-colors">
            Register here
          </Link>
        </p>
      </form>
    </div>
  );
}