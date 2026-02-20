import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AuthUser } from '../types/Staff';
import DashboardTab from './admin/DashboardTab';
import PeopleTab    from './admin/PeopleTab';
import MenuTab      from './admin/MenuTab';
import LegalTab     from './admin/LegalTab';

type Tab = 'dashboard' | 'people' | 'menu' | 'legal';

interface Props {
  user: AuthUser;
  onLogout: () => void;
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard',     icon: '📊' },
  { id: 'people',    label: 'People',         icon: '👥' },
  { id: 'menu',      label: 'Menu',           icon: '🧾' },
  { id: 'legal',     label: 'Legal & Tax',    icon: '⚖️' },
];

export default function AdminPage({ user, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const navigate = useNavigate();

  function goToCatering() {
    if (window.confirm('Switch to catering view? You will leave the admin panel.')) {
      navigate('/catering');
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-stone-100">

      {/* ── Top header ── */}
      <header className="bg-stone-800 shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-xl shrink-0 shadow-inner">🥐</div>
            <div>
              <h1 className="text-base font-bold text-white leading-snug">Happy Day Everyday Bakery</h1>
              <p className="text-stone-400 text-xs">Admin Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              <span className="text-stone-300 text-sm">{user.full_name}</span>
              <span className="text-stone-500 text-xs">({user.role_name})</span>
            </div>
            <button
              onClick={goToCatering}
              className="text-sm text-stone-300 hover:text-white border border-stone-600 hover:border-stone-400 rounded-lg px-3 py-1.5 transition-colors"
            >
              🧾 Catering
            </button>
            <button
              onClick={onLogout}
              className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                  ${activeTab === tab.id
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-stone-400 hover:text-stone-200'
                  }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="h-0.5 bg-gradient-to-r from-amber-700 via-amber-400 to-amber-700" />
      </header>

      {/* ── Tab content ── */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'people'    && <PeopleTab user={user} />}
        {activeTab === 'menu'      && <MenuTab user={user} />}
        {activeTab === 'legal'     && <LegalTab user={user} />}
      </div>
    </div>
  );
}
