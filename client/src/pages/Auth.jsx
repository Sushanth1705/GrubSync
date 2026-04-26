import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const Auth = () => {
  const { login, register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', upiId: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.email || !form.password || (mode === 'register' && !form.name)) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login({ email: form.email, password: form.password });
        showToast('Welcome back!');
      } else {
        await register({ name: form.name, email: form.email, password: form.password, upiId: form.upiId });
        showToast('Account created successfully');
      }
      navigate('/');
    } catch (error) {
      showToast(error?.response?.data?.message || error?.message || 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-[32px] bg-slate-900/95 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.65)] ring-1 ring-slate-800 sm:p-10">
      <h1 className="text-3xl font-semibold text-slate-100">{mode === 'login' ? 'Login' : 'Register'}</h1>
      <p className="mt-3 text-slate-400">{mode === 'login' ? 'Sign in to access your rounds' : 'Create an account to start a round'}</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {mode === 'register' && (
          <div>
            <label className="block text-sm font-medium text-slate-400">Name</label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="Your full name" className="mt-2 w-full" />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-400">Email</label>
          <input name="email" value={form.email} onChange={handleChange} type="email" placeholder="email@example.com" className="mt-2 w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-400">Password</label>
          <input name="password" value={form.password} onChange={handleChange} type="password" placeholder="••••••••" className="mt-2 w-full" />
        </div>
        {mode === 'register' && (
          <div>
            <label className="block text-sm font-medium text-slate-400">UPI ID</label>
            <input name="upiId" value={form.upiId} onChange={handleChange} placeholder="your@bank" className="mt-2 w-full" />
          </div>
        )}
        <button type="submit" className="w-full rounded-2xl bg-orange py-3 text-white disabled:opacity-70" disabled={loading}>
          {loading ? 'Working…' : mode === 'login' ? 'Login' : 'Register'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-slate-600">
        {mode === 'login' ? (
          <p>
            New to GrubSync?{' '}
            <button type="button" onClick={() => setMode('register')} className="font-semibold text-orange">Create account</button>
          </p>
        ) : (
          <p>
            Already registered?{' '}
            <button type="button" onClick={() => setMode('login')} className="font-semibold text-orange">Login</button>
          </p>
        )}
      </div>
    </div>
  );
};

export default Auth;
