import type { AuthUser } from '../types/Staff';

interface Props {
  user: AuthUser;
  onLogout: () => void;
}

export default function CateringPage({ user, onLogout }: Props) {
  return (
    <div className="min-h-screen bg-stone-100">

      {/* ── Header ── */}
      <header className="bg-stone-800">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-500 flex items-center justify-center text-2xl shrink-0 shadow-inner">
              🥐
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight leading-snug">
                Happy Day Everyday Bakery
              </h1>
              <p className="text-stone-400 text-xs">Catering Orders</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-stone-300 text-sm">{user.full_name}</span>
            <button
              onClick={onLogout}
              className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>
      <div className="h-1 bg-gradient-to-r from-amber-700 via-amber-400 to-amber-700" />

      {/* ── Placeholder content ── */}
      <main className="max-w-6xl mx-auto px-6 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-3xl mx-auto mb-4">
          🍰
        </div>
        <h2 className="text-stone-800 font-semibold text-xl">Catering Orders</h2>
        <p className="text-stone-500 mt-2 max-w-md mx-auto">
          This section is coming soon. You will be able to manage catering orders here.
        </p>
      </main>
    </div>
  );
}
