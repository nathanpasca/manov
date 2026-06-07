import { useState, useEffect } from 'react';
import { BookOpen, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import toast from 'react-hot-toast';

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

interface AuthFormsProps {
  mode: AuthMode;
}

export default function AuthForms({ mode: initialMode }: AuthFormsProps) {
  const { login } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login state
  const [loginData, setLoginData] = useState({ email: '', password: '' });

  // Register state
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
  });

  // Forgot state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotToken, setForgotToken] = useState('');

  // Reset state
  const [resetToken, setResetToken] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirm, setResetConfirm] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Read token from URL for reset mode
  useEffect(() => {
    if (initialMode === 'reset') {
      const params = new URLSearchParams(window.location.search);
      const t = params.get('token');
      if (t) setResetToken(t);
    }
  }, [initialMode]);

  const handleChange = (
    setter: React.Dispatch<React.SetStateAction<any>>,
    field: string,
    value: string
  ) => {
    setter((prev: any) => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.login(loginData);
      login(res.access_token, res.user);
      toast.success('Welcome back!');
      window.location.href = '/';
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.register(registerData);
      login(res.access_token, res.user);
      toast.success('Account created!');
      window.location.href = '/';
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.forgotPassword(forgotEmail);
      setForgotSuccess(true);
      if (res.token) setForgotToken(res.token);
      toast.success(res.message);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 'Something went wrong. Try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (resetPassword !== resetConfirm) {
      setError('Passwords do not match');
      return;
    }
    if (resetPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await api.resetPassword(resetToken, resetPassword);
      setResetSuccess(true);
      toast.success(res.message);
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 'Failed to reset password. Try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 transition focus:outline-none focus:ring-1 focus:ring-stone-400 dark:border-white/10 dark:bg-white/5 dark:text-white';

  const buttonClass =
    'flex w-full items-center justify-center gap-2 rounded-lg bg-stone-900 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700 disabled:opacity-50';

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#faf8f5] px-4 dark:bg-[#1c1917]">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-stone-900 text-white">
            <BookOpen size={24} />
          </div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-white">
            {mode === 'login' && 'Welcome back'}
            {mode === 'register' && 'Create an account'}
            {mode === 'forgot' && 'Reset Password'}
            {mode === 'reset' && 'New Password'}
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            {mode === 'login' && 'Sign in to continue reading'}
            {mode === 'register' && 'Start reading translated novels today'}
            {mode === 'forgot' && "Enter your email and we'll send you a reset link"}
            {mode === 'reset' && 'Enter your new password below'}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={loginData.email}
                  onChange={(e) =>
                    handleChange(setLoginData, 'email', e.target.value)
                  }
                  className={inputClass}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={loginData.password}
                  onChange={(e) =>
                    handleChange(setLoginData, 'password', e.target.value)
                  }
                  className={inputClass}
                  placeholder="••••••••"
                />
              </div>
              <button type="submit" disabled={loading} className={buttonClass}>
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
            <div className="mt-6 space-y-2 text-center text-sm text-stone-500">
              <p>
                Don&apos;t have an account?{' '}
                <a
                  href="/register"
                  className="font-medium text-stone-800 underline underline-offset-2 hover:text-stone-600 dark:text-stone-300"
                >
                  Create one
                </a>
              </p>
              <a
                href="/forgot-password"
                className="inline-block text-xs text-stone-500 transition hover:text-stone-800 dark:text-stone-400"
              >
                Forgot password?
              </a>
            </div>
          </>
        )}

        {/* REGISTER FORM */}
        {mode === 'register' && (
          <>
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={registerData.username}
                  onChange={(e) =>
                    handleChange(setRegisterData, 'username', e.target.value)
                  }
                  className={inputClass}
                  placeholder="reader123"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={registerData.email}
                  onChange={(e) =>
                    handleChange(setRegisterData, 'email', e.target.value)
                  }
                  className={inputClass}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={registerData.password}
                  onChange={(e) =>
                    handleChange(setRegisterData, 'password', e.target.value)
                  }
                  className={inputClass}
                  placeholder="••••••••"
                />
              </div>
              <button type="submit" disabled={loading} className={buttonClass}>
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-stone-500">
              Already have an account?{' '}
              <a
                href="/login"
                className="font-medium text-stone-800 underline underline-offset-2 hover:text-stone-600 dark:text-stone-300"
              >
                Sign in
              </a>
            </p>
          </>
        )}

        {/* FORGOT PASSWORD FORM */}
        {mode === 'forgot' && (
          <>
            {forgotSuccess ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-300">
                  <p className="font-medium">Check your email!</p>
                  <p className="mt-1">
                    If the email exists, a reset link has been sent.
                  </p>
                </div>
                {forgotToken && (
                  <div className="rounded-lg border border-stone-200 bg-stone-50 p-4 dark:border-white/10 dark:bg-white/5">
                    <p className="mb-2 text-xs font-medium text-stone-500">
                      Dev mode — your reset token:
                    </p>
                    <code className="block break-all rounded bg-white p-2 text-xs text-stone-800 dark:bg-black/30 dark:text-stone-200">
                      {forgotToken}
                    </code>
                    <a
                      href={`/reset-password?token=${forgotToken}`}
                      className="mt-3 inline-block text-sm font-medium text-stone-800 underline dark:text-stone-300"
                    >
                      Continue to reset →
                    </a>
                  </div>
                )}
                <a
                  href="/login"
                  className="flex items-center justify-center gap-2 text-sm text-stone-500 transition hover:text-stone-800 dark:text-stone-400"
                >
                  <ArrowLeft size={14} />
                  Back to login
                </a>
              </div>
            ) : (
              <>
                <form onSubmit={handleForgot} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className={inputClass}
                      placeholder="you@example.com"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className={buttonClass}
                  >
                    {loading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      'Send Reset Link'
                    )}
                  </button>
                </form>
                <a
                  href="/login"
                  className="mt-6 flex items-center justify-center gap-2 text-sm text-stone-500 transition hover:text-stone-800 dark:text-stone-400"
                >
                  <ArrowLeft size={14} />
                  Back to login
                </a>
              </>
            )}
          </>
        )}

        {/* RESET PASSWORD FORM */}
        {mode === 'reset' && (
          <>
            {resetSuccess ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center text-sm text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-300">
                  <CheckCircle size={32} className="mx-auto mb-2" />
                  <p className="font-medium">Password reset successful!</p>
                  <p className="mt-1">Redirecting to login...</p>
                </div>
                <a
                  href="/login"
                  className="flex items-center justify-center gap-2 text-sm text-stone-500 transition hover:text-stone-800 dark:text-stone-400"
                >
                  <ArrowLeft size={14} />
                  Go to login
                </a>
              </div>
            ) : (
              <>
                <form onSubmit={handleReset} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
                      Reset Token
                    </label>
                    <input
                      type="text"
                      required
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      className={inputClass}
                      placeholder="Paste your reset token"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      className={inputClass}
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      required
                      value={resetConfirm}
                      onChange={(e) => setResetConfirm(e.target.value)}
                      className={inputClass}
                      placeholder="••••••••"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className={buttonClass}
                  >
                    {loading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      'Reset Password'
                    )}
                  </button>
                </form>
                <a
                  href="/login"
                  className="mt-6 flex items-center justify-center gap-2 text-sm text-stone-500 transition hover:text-stone-800 dark:text-stone-400"
                >
                  <ArrowLeft size={14} />
                  Back to login
                </a>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
