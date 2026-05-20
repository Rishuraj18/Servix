import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../features/authSlice';
import { Mail, Lock, User, Phone, Shield } from 'lucide-react';
import api from '../api/client';

const Register = () => {
  const [role, setRole] = useState('user'); // 'user' or 'admin'
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = role === 'admin' ? '/auth/register/admin' : '/auth/register/user';
      const payload = role === 'admin' 
        ? { name: formData.name, email: formData.email, password: formData.password }
        : formData;

      const res = await api.post(endpoint, payload);
      
      if (res.data.success) {
        dispatch(loginSuccess({ user: res.data.user, token: res.data.token }));
        if (role === 'admin') {
          navigate('/dashboard/admin');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] py-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="glass-card w-full max-w-md p-8"
      >
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold mb-2">Create Account</h2>
          <p className="text-slate-600 dark:text-slate-400">Join Servix platform today</p>
        </div>

        {/* Role Toggle Selector */}
        <div className="grid grid-cols-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-6">
          <button 
            type="button"
            onClick={() => setRole('user')}
            className={`py-2 rounded-lg text-sm font-medium transition-all ${role === 'user' ? 'bg-white dark:bg-slate-700 shadow text-primary' : 'text-slate-500'}`}
          >
            Customer
          </button>
          <button
            type="button"
            onClick={() => setRole('admin')}
            className={`py-2 rounded-lg text-sm font-medium transition-all ${role === 'admin' ? 'bg-white dark:bg-slate-700 shadow text-primary' : 'text-slate-500'}`}
          >
            Admin Account
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User size={18} />
              </div>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-dark/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder={role === 'admin' ? 'e.g. Operations Manager' : 'John Doe'}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail size={18} />
              </div>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-dark/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="you@example.com"
              />
            </div>
          </div>

          {role === 'user' && (
            <div>
              <label className="block text-sm font-medium mb-1">Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone size={18} />
                </div>
                <input 
                  type="tel" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required={role === 'user'}
                  className="w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-dark/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="+91 9876543210"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock size={18} />
              </div>
              <input 
                type="password" 
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-dark/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {role === 'admin' && (
            <div className="p-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl flex items-start gap-2 text-xs">
              <Shield size={16} className="mt-0.5 flex-shrink-0" />
              <span>Registering an Administrative account grants access to security statistics, financial transactions, and client complaints panels.</span>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary hover:bg-secondary text-white py-3 rounded-xl font-medium transition-all shadow-lg shadow-primary/30 flex justify-center items-center mt-6"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          Already have an account? <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
