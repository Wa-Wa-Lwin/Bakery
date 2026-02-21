import { useNavigate } from 'react-router-dom';
import type { AuthUser } from '../types/Staff';

interface Props {
  user: AuthUser;
  onLogout: () => void;
}

export default function HomePage({ user, onLogout }: Props) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-stone-100">

      {/* ── Header ── */}
      <header className="bg-stone-800 shrink-0">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-xl shrink-0">🥐</div>
            <div>
              <h1 className="text-base font-bold text-white leading-snug">Happy Day Everyday Bakery</h1>
              <p className="text-stone-400 text-xs">Welcome back</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-stone-300 text-sm">{user.full_name}</span>
            <span className="text-stone-500 text-xs">({user.role_name})</span>
            <button
              onClick={onLogout}
              className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
        <div className="h-0.5 bg-gradient-to-r from-amber-700 via-amber-400 to-amber-700" />
      </header>

      {/* ── Choice area ── */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-xs space-y-4">
          <p className="text-center text-stone-500 text-sm font-medium mb-2">What would you like to do?</p>

          <button
            onClick={() => navigate('/catering')}
            className="w-full rounded-2xl bg-amber-700 hover:bg-amber-800 active:scale-[0.98] text-white font-semibold py-6 text-base transition-all shadow-sm flex items-center justify-center gap-3"
          >
            <span className="text-2xl">🧾</span>
            <span>Catering / Order Entry</span>
          </button>

          <button
            onClick={() => navigate('/admin')}
            className="w-full rounded-2xl bg-stone-700 hover:bg-stone-800 active:scale-[0.98] text-white font-semibold py-6 text-base transition-all shadow-sm flex items-center justify-center gap-3"
          >
            <span className="text-2xl">⚙️</span>
            <span>Admin Panel</span>
          </button>
        </div>
      </div>
    </div>
  );
}
