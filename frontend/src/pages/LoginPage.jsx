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

  const inputCls = "w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700/50 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all duration-200";

  return (
    <div className="min-h-screen w-full bg-[#050a18] flex items-center justify-center px-4 relative overflow-hidden grid-bg">
      {/* Animated Background Orbs */}
      <div className="absolute top-[-20%] left-[20%] w-[500px] h-[500px] rounded-full bg-blue-600/8 blur-[150px] animate-float" />
      <div className="absolute bottom-[-10%] right-[15%] w-[400px] h-[400px] rounded-full bg-indigo-600/10 blur-[130px] animate-float" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-[40%] left-[-5%] w-[300px] h-[300px] rounded-full bg-cyan-600/6 blur-[100px] animate-float" style={{ animationDelay: '3s' }} />

      {/* Rotating ring decoration */}
      <div className="absolute top-[10%] right-[8%] w-32 h-32 border border-slate-700/20 rounded-full" style={{ animation: 'rotate-slow 30s linear infinite' }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500/60" />
      </div>
      <div className="absolute bottom-[15%] left-[5%] w-20 h-20 border border-slate-700/15 rounded-full" style={{ animation: 'rotate-slow 20s linear infinite reverse' }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-500/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="relative inline-block mb-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/30 border border-blue-400/30 animate-pulse-glow">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#050a18] flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 tracking-tight">
            Sentinel
          </h1>
          <p className="text-slate-500 text-sm mt-2 flex items-center justify-center gap-2">
            <Radio className="w-3.5 h-3.5 text-blue-500" />
            {isRegister ? 'Create your officer account' : 'Police Command Center'}
          </p>
        </div>

        {/* Form Card */}
        <div className="glass-card rounded-2xl p-7">
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

            <button type="submit" disabled={loading} className="btn-press w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-bold text-sm shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isRegister ? (
                <><UserPlus className="w-4 h-4" /> Create Account</>
              ) : (
                <><LogIn className="w-4 h-4" /> Sign In</>
              )}
            </button>
          </form>

          <div className="neon-line mt-6 mb-5 rounded-full" />

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
