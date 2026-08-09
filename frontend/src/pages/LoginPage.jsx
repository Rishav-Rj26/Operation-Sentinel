import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, UserPlus, LogIn, Zap, Radio } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

const LoginPage = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'officer', badge: '',
  });

  const { login, register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        await register(form);
        toast.success('Account created successfully!');
      } else {
        await login(form.email, form.password);
        toast.success('Welcome back, Officer!');
      }
      navigate('/');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-4 py-3 rounded-xl text-white placeholder:text-slate-500 input-field";

  return (
    <div className="min-h-screen w-full bg-[#0b1220] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1 bg-sky-500" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-5">
            <div className="w-16 h-16 rounded-xl bg-sky-500 flex items-center justify-center border border-sky-400">
              <Shield className="w-8 h-8 text-slate-950" />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#0b1220] flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-100 tracking-tight">
            Sentinel
          </h1>
          <p className="text-slate-500 text-sm mt-2 flex items-center justify-center gap-2">
            <Radio className="w-3.5 h-3.5 text-blue-500" />
            {isRegister ? 'Create your officer account' : 'Police Command Center'}
          </p>
        </div>

        {/* Form Card */}
        <div className="glass-card rounded-xl p-7">
          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && (
              <div className="space-y-4 animate-slide-up">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                  <input type="text" name="name" value={form.name} onChange={handleChange} required placeholder="Officer John Doe" className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Role</label>
                    <select name="role" value={form.role} onChange={handleChange} className={inputCls}>
                      <option value="officer">Officer</option>
                      <option value="dispatcher">Dispatcher</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Badge #</label>
                    <input type="text" name="badge" value={form.badge} onChange={handleChange} placeholder="B-1234" className={inputCls} />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="officer@sentinel.gov" className={inputCls} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} required minLength={6} placeholder="••••••••" className={`${inputCls} pr-11`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary btn-press w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isRegister ? (
                <><UserPlus className="w-4 h-4" /> Create Account</>
              ) : (
                <><LogIn className="w-4 h-4" /> Sign In</>
              )}
            </button>
          </form>

          <div className="border-t border-slate-800 mt-6 mb-5" />

          <button onClick={() => setIsRegister(!isRegister)} className="w-full text-center text-sm text-slate-500 hover:text-blue-400 transition-colors duration-200">
            {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
          </button>
        </div>

        <p className="text-center text-[11px] text-slate-700 mt-8 tracking-wider uppercase">
          Sentinel v2.0 — Authorized Personnel Only
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
