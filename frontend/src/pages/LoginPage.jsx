import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
        toast.success('Personnel registered successfully!');
      } else {
        await login(form.email, form.password);
        toast.success('Access granted. Welcome to Sentinel.');
      }
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center font-body-md overflow-hidden relative w-full bg-background">
      <div className="crt-overlay"></div>
      
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-[40vw] h-[40vw] rounded-full bg-primary-fixed-dim/5 blur-[120px]"></div>
        <div class="absolute bottom-[10%] right-[10%] w-[30vw] h-[30vw] rounded-full bg-error/5 blur-[100px]"></div>
      </div>

      {/* Login Container */}
      <main className="relative z-10 w-full max-w-[440px] px-margin-mobile md:px-0 animate-scale-in">
        {/* Header / Logo */}
        <div className="text-center mb-8 flex flex-col items-center">
          <span className="material-symbols-outlined text-surface-tint text-5xl mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
          <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">Operation Sentinel</h1>
          <p className="font-label-caps text-label-caps text-secondary mt-2 tracking-[0.2em]">Command Center Authentication</p>
        </div>

        {/* Glassmorphic Card */}
        <div className="glass-panel rounded-xl p-8 relative overflow-hidden">
          
          {/* Corner Accents */}
          <div className="corner-bracket-tl"></div>
          <div className="corner-bracket-tr"></div>
          <div className="corner-bracket-bl"></div>
          <div className="corner-bracket-br"></div>

          {/* Warning Banner */}
          <div className="bg-error-container/20 border-l-2 border-error px-4 py-3 mb-6 flex items-start gap-3">
            <span className="material-symbols-outlined text-error text-xl shrink-0 mt-0.5">warning</span>
            <div>
              <p className="font-label-caps text-label-caps text-error mb-1">AUTHORIZED ACCESS ONLY</p>
              <p className="text-xs text-on-surface-variant font-data-md">Unauthorized entry attempts are logged and reported.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && (
              <div className="space-y-4 animate-slide-up">
                <div className="space-y-2">
                  <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">person</span>
                    Full Name
                  </label>
                  <input type="text" name="name" value={form.name} onChange={handleChange} required placeholder="Officer Name" className="input-field w-full rounded-DEFAULT font-data-md text-data-md px-4 py-3" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">badge</span>
                      Role
                    </label>
                    <select name="role" value={form.role} onChange={handleChange} className="input-field w-full rounded-DEFAULT font-data-md text-data-md px-4 py-3">
                      <option value="officer">Officer</option>
                      <option value="dispatcher">Dispatcher</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">pin</span>
                      Badge #
                    </label>
                    <input type="text" name="badge" value={form.badge} onChange={handleChange} placeholder="OP-0000" className="input-field w-full rounded-DEFAULT font-data-md text-data-md px-4 py-3" />
                  </div>
                </div>
              </div>
            )}

            {/* Email / Officer ID */}
            <div className="space-y-2">
              <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">badge</span>
                {isRegister ? 'Email Address' : 'Officer Email'}
              </label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="officer@sentinel.gov" className="input-field w-full rounded-DEFAULT font-data-md text-data-md px-4 py-3" />
            </div>

            {/* Security Key */}
            <div className="space-y-2">
              <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">vpn_key</span>
                Security Key
              </label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} required minLength={6} placeholder="••••••••" className="input-field w-full rounded-DEFAULT font-data-md text-data-md px-4 py-3 tracking-widest" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-lg">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            {/* Action Button */}
            <button type="submit" disabled={loading} className="btn-primary btn-press w-full rounded-DEFAULT font-label-caps text-label-caps font-bold py-3.5 mt-4 flex items-center justify-center gap-2 shadow-xl">
              {loading ? (
                <div className="w-5 h-5 border-2 border-primary-fixed/30 border-t-primary-fixed rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">{isRegister ? 'person_add' : 'login'}</span>
                  {isRegister ? 'Register Personnel' : 'Secure Login'}
                </>
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-8 pt-6 border-t border-surface-variant flex flex-col items-center gap-4">
            <button onClick={() => setIsRegister(!isRegister)} className="font-data-md text-sm text-on-surface-variant hover:text-primary transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">{isRegister ? 'login' : 'person_add'}</span>
              {isRegister ? 'Return to Secure Login' : 'Register New Personnel'}
            </button>
          </div>
        </div>

        {/* System Status Footer */}
        <div className="mt-8 text-center flex items-center justify-center gap-2 opacity-60">
          <div className="w-1.5 h-1.5 rounded-full bg-surface-tint shadow-[0_0_8px_#00dbe7] animate-pulse"></div>
          <span className="font-label-caps text-[10px] text-surface-tint tracking-widest uppercase">System Operational • Node 04</span>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
