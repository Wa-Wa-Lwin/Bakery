import type { AuthUser } from '../types/Staff';
import StaffPage from './StaffPage';

interface Props {
  user: AuthUser;
  onLogout: () => void;
}

export default function AdminPage({ user, onLogout }: Props) {
  return (
    <div className="min-h-screen bg-stone-100">

      {/* ── Top bar with user info ── */}
      <div className="bg-stone-900 border-b border-stone-700">
        <div className="max-w-6xl mx-auto px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-stone-300 text-xs">
              Signed in as <span className="text-white font-medium">{user.full_name}</span>
            </span>
            <span className="text-stone-500 text-xs">({user.role_name})</span>
          </div>
          <button
            onClick={onLogout}
            className="text-xs text-stone-400 hover:text-amber-400 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* ── Existing staff page ── */}
      <StaffPage />
    </div>
  );
}
