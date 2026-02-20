import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import type { LoginError } from '../api/auth';
import type { AuthUser } from '../types/Staff';
import NumPad from '../components/NumPad';

interface Props {
  onLogin: (user: AuthUser) => void;
}

export default function LoginPage({ onLogin }: Props) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  function handleCodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '');
    if (digits.length <= 5) setCode(digits);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 5) {
      setError('Please enter a 5-digit access code.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const user = await login(code);
      onLogin(user);
      if (user.role_name === 'Staff') {
        navigate('/catering', { replace: true });
      } else {
        navigate('/admin', { replace: true });
      }
    } catch (err) {
      const loginErr = err as LoginError;
      setError(loginErr.message || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">

      {/* ── Header ── */}
      <header className="bg-stone-800">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-500 flex items-center justify-center text-2xl shrink-0 shadow-inner">
            🥐
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight leading-snug">
              Happy Day Everyday Bakery
            </h1>
            <p className="text-stone-400 text-xs">Point of Sale System</p>
          </div>
        </div>
      </header>
      <div className="h-1 bg-gradient-to-r from-amber-700 via-amber-400 to-amber-700" />

      {/* ── Login card ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="bg-amber-700 px-6 py-4 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-600 border-2 border-amber-500 flex items-center justify-center text-2xl mx-auto mb-2">
                🔑
              </div>
              <h2 className="text-white font-semibold text-base">Staff Sign In</h2>
              <p className="text-amber-200 text-xs mt-0.5">Enter your 5-digit access code</p>
            </div>

            <div className="p-6">
              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 mb-4">
                  <span className="text-red-400 text-sm shrink-0">⚠</span>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide">
                    Access Code
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    value={code}
                    onChange={handleCodeChange}
                    placeholder="00000"
                    maxLength={5}
                    autoFocus
                    className="w-full rounded-lg border border-stone-300 px-3 py-3 text-center text-2xl font-mono
                      tracking-[0.5em] text-stone-800 bg-stone-50 placeholder-stone-300
                      transition focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 focus:bg-white"
                  />
                  <p className="text-xs text-stone-400 text-center mt-1">
                    {code.length}/5 digits
                  </p>
                </div>

                {/* ── Numpad ── */}
                <NumPad value={code} onChange={setCode} maxLength={5} />

                <button
                  type="submit"
                  disabled={submitting || code.length !== 5}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-700 hover:bg-amber-800
                    px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Signing in…
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
