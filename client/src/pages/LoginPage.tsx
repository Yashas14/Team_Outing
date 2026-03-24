import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LogIn, Mail, Lock, Sparkles, PartyPopper, KeyRound, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

// ── Schemas ──────────────────────────────────────────────────────────────────

const SIEMENS_DOMAIN = '@siemens.com';

const loginSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email')
    .refine((v) => v.toLowerCase().endsWith(SIEMENS_DOMAIN), {
      message: 'Only @siemens.com email addresses are allowed',
    }),
  password: z.string(), // intentionally no min — blank = first login
});

const setupSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type LoginForm = z.infer<typeof loginSchema>;
type SetupForm = z.infer<typeof setupSchema>;

// ── Helpers ───────────────────────────────────────────────────────────────────

const FLOATING_EMOJIS = ['🎉', '🎊', '🌴', '🎈', '✨', '🎵', '🍕', '🌟', '🎸', '🎯'];

// ── Component ─────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const [step, setStep] = useState<'login' | 'setup'>('login');
  const [pendingEmail, setPendingEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { loadUser, isAuthenticated, user, login, setupNewPassword } = useAuthStore();
  const navigate = useNavigate();

  // ── Login form ──────────────────────────────────────────────────────────────
  const {
    register: regLogin,
    handleSubmit: handleLogin,
    formState: { errors: loginErrors },
    watch: watchLogin,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const emailValue = watchLogin('email', '');
  const isSiemensEmail = emailValue.toLowerCase().endsWith(SIEMENS_DOMAIN);

  // ── Setup form ──────────────────────────────────────────────────────────────
  const {
    register: regSetup,
    handleSubmit: handleSetup,
    formState: { errors: setupErrors },
  } = useForm<SetupForm>({ resolver: zodResolver(setupSchema) });

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === 'ADMIN' ? '/admin' : '/employee', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // ── Submit login ────────────────────────────────────────────────────────────
  const onLogin = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const result = await login(data.email.toLowerCase(), data.password);

      if (result.requiresPasswordSetup) {
        // First-time employee — move to password-creation step
        setPendingEmail(data.email.toLowerCase());
        setStep('setup');
        toast('👋 Welcome! Please create your password to continue.', { icon: '🔑' });
        return;
      }

      // Navigate directly — don't rely solely on useEffect
      toast.success('Welcome back! 🎉');
      const role = result.user?.role;
      navigate(role === 'ADMIN' ? '/admin' : '/employee', { replace: true });
    } catch (err: any) {
      toast.error(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Submit first-time password setup ───────────────────────────────────────
  const onSetup = async (data: SetupForm) => {
    setIsLoading(true);
    try {
      await setupNewPassword(pendingEmail, data.password);
      toast.success('Password created! You\'re all set 🎊');
      navigate('/employee', { replace: true });
    } catch (err: any) {
      toast.error(err.message || 'Setup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex overflow-hidden relative bg-gradient-to-br from-dark via-[#16213E] to-[#0F3460]">
      {/* Floating emojis background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {FLOATING_EMOJIS.map((emoji, i) => (
          <div
            key={i}
            className="absolute text-3xl floating-emoji opacity-20"
            style={{
              left: `${(i * 11 + 5) % 100}%`,
              top: `${(i * 17 + 8) % 100}%`,
              '--duration': `${8 + (i % 5) * 2}s`,
              '--delay': `${(i % 4) * 1.2}s`,
              fontSize: `${1.5 + (i % 3) * 0.5}rem`,
            } as React.CSSProperties}
          >
            {emoji}
          </div>
        ))}
      </div>

      {/* Left — Branding */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative"
      >
        <div className="text-center">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-8xl mb-6"
          >
            🏖️
          </motion.div>
          <h1 className="font-display text-5xl xl:text-6xl font-bold text-white mb-4 leading-tight">
            Team Outing
            <span className="block text-secondary">2026</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-md mx-auto mb-8">
            Get ready for an unforgettable day of fun, food, and bonding with the team! 🌴✨
          </p>
          <div className="flex items-center justify-center gap-4 text-gray-400">
            <div className="flex items-center gap-2">
              <PartyPopper size={18} />
              <span>April 1, 2026</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-2">
              <Sparkles size={18} />
              <span>Fun Awaits!</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <span className="text-5xl">🏖️</span>
            <h1 className="font-display text-3xl font-bold text-white mt-2">
              Team Outing <span className="text-secondary">2026</span>
            </h1>
          </div>

          <AnimatePresence mode="wait">
            {/* ── STEP: LOGIN ── */}
            {step === 'login' && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="bg-white/10 backdrop-blur-xl rounded-4xl p-8 border border-white/10 shadow-2xl"
              >
                <h2 className="font-display text-2xl font-bold text-white text-center mb-1">
                  Welcome Back!
                </h2>
                <p className="text-gray-400 text-center text-sm mb-8">
                  Sign in with your <span className="text-accent font-medium">@siemens.com</span> account
                </p>

                <form onSubmit={handleLogin(onLogin)} className="space-y-5">
                  {/* Email */}
                  <div>
                    <label className="text-gray-300 text-sm font-medium mb-1.5 block">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        {...regLogin('email')}
                        type="email"
                        placeholder="yourname@siemens.com"
                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/10
                                 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2
                                 focus:ring-primary/50 focus:border-primary transition-all"
                      />
                      {emailValue && isSiemensEmail && (
                        <ShieldCheck className="absolute right-4 top-1/2 -translate-y-1/2 text-accent" size={16} />
                      )}
                    </div>
                    {loginErrors.email && (
                      <p className="text-red-400 text-xs mt-1">{loginErrors.email.message}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="text-gray-300 text-sm font-medium mb-1.5 block">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        {...regLogin('password')}
                        type="password"
                        placeholder="••••••••"
                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/10
                                 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2
                                 focus:ring-primary/50 focus:border-primary transition-all"
                      />
                    </div>
                    <p className="text-gray-500 text-xs mt-1.5">
                      🆕 First time logging in? Leave blank and submit — you'll create your password next.
                    </p>
                    {loginErrors.password && (
                      <p className="text-red-400 text-xs mt-1">{loginErrors.password.message}</p>
                    )}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-gradient-to-r from-primary to-primary-600 text-white
                             rounded-2xl font-semibold text-lg shadow-lg shadow-primary/25
                             hover:shadow-xl hover:shadow-primary/30 transition-all duration-300
                             disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <LogIn size={20} />
                        Sign In
                      </>
                    )}
                  </motion.button>
                </form>

                <div className="mt-6 p-3 bg-white/5 border border-white/10 rounded-xl">
                  <p className="text-gray-500 text-xs text-center leading-relaxed">
                    🔒 Secure portal — Siemens employees only<br />
                    Admins: use your assigned password &nbsp;·&nbsp; Employees: set on first login
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── STEP: SETUP PASSWORD ── */}
            {step === 'setup' && (
              <motion.div
                key="setup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-white/10 backdrop-blur-xl rounded-4xl p-8 border border-white/10 shadow-2xl"
              >
                <div className="text-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                    className="text-5xl mb-4"
                  >
                    🔑
                  </motion.div>
                  <h2 className="font-display text-2xl font-bold text-white mb-1">
                    Create Your Password
                  </h2>
                  <p className="text-gray-400 text-sm">
                    First time here? Set a password for your account.
                  </p>
                  <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/20 rounded-full">
                    <KeyRound size={14} className="text-accent" />
                    <span className="text-accent text-sm font-medium">{pendingEmail}</span>
                  </div>
                </div>

                <form onSubmit={handleSetup(onSetup)} className="space-y-5">
                  {/* New password */}
                  <div>
                    <label className="text-gray-300 text-sm font-medium mb-1.5 block">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        {...regSetup('password')}
                        type="password"
                        placeholder="Min 8 characters"
                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/10
                                 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2
                                 focus:ring-accent/50 focus:border-accent transition-all"
                      />
                    </div>
                    {setupErrors.password && (
                      <p className="text-red-400 text-xs mt-1">{setupErrors.password.message}</p>
                    )}
                  </div>

                  {/* Confirm password */}
                  <div>
                    <label className="text-gray-300 text-sm font-medium mb-1.5 block">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        {...regSetup('confirmPassword')}
                        type="password"
                        placeholder="Re-enter your password"
                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/10
                                 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2
                                 focus:ring-accent/50 focus:border-accent transition-all"
                      />
                    </div>
                    {setupErrors.confirmPassword && (
                      <p className="text-red-400 text-xs mt-1">{setupErrors.confirmPassword.message}</p>
                    )}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-gradient-to-r from-accent to-emerald-400 text-dark
                             rounded-2xl font-semibold text-lg shadow-lg shadow-accent/25
                             hover:shadow-xl hover:shadow-accent/30 transition-all duration-300
                             disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-dark border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck size={20} />
                        Create Password &amp; Log In
                      </>
                    )}
                  </motion.button>

                  <button
                    type="button"
                    onClick={() => setStep('login')}
                    className="w-full text-gray-500 text-sm hover:text-gray-300 transition-colors"
                  >
                    ← Back to login
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
