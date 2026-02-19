import { useEffect, useState } from 'react';
import StaffRegisterForm from '../components/StaffRegisterForm';
import StaffList from '../components/StaffList';
import { getStaff } from '../api/staff';
import type { Staff } from '../types/Staff';

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStaff();
  }, []);

  async function fetchStaff() {
    setLoading(true);
    setError('');
    try {
      const data = await getStaff();
      setStaff(data);
    } catch {
      setError('Could not load staff list. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }

  function handleRegistered(newStaff: Staff) {
    setStaff((prev) => [newStaff, ...prev]);
  }

  return (
    <div className="min-h-screen bg-stone-100">

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
            <p className="text-stone-400 text-xs">Staff Management Portal</p>
          </div>
        </div>
      </header>

      {/* ── Accent bar ── */}
      <div className="h-1 bg-gradient-to-r from-amber-700 via-amber-400 to-amber-700" />

      {/* ── Page title row ── */}
      <div className="max-w-6xl mx-auto px-6 pt-7 pb-1 flex items-center justify-between">
        <div>
          <h2 className="text-stone-800 font-semibold text-xl">Staff Directory</h2>
          <p className="text-stone-500 text-sm mt-0.5">Register and manage your bakery team</p>
        </div>
        <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full border border-amber-200">
          {staff.length} {staff.length === 1 ? 'member' : 'members'}
        </span>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-5 space-y-6">
        <StaffRegisterForm onRegistered={handleRegistered} />
        <StaffList staff={staff} loading={loading} error={error} />
      </main>
    </div>
  );
}
