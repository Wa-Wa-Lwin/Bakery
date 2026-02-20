import { useState } from 'react';
import { updateStaff } from '../api/staff';
import type { Staff } from '../types/Staff';

/* ── Eye icons ── */
function EyeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

interface Props {
  staff: Staff[];
  loading: boolean;
  error: string;
  onStaffUpdated: (updated: Staff) => void;
}

/* ── Avatar with initials ── */
function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  return (
    <div className="w-9 h-9 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center
      text-xs font-bold text-amber-700 shrink-0">
      {initials}
    </div>
  );
}

/* ── Status toggle switch ── */
function StatusToggle({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-2"
    >
      <div className={`relative w-9 h-5 rounded-full transition-colors ${active ? 'bg-emerald-500' : 'bg-stone-300'}`}>
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${active ? 'translate-x-4' : 'translate-x-0'}`} />
      </div>
      <span className={`text-xs font-medium ${active ? 'text-emerald-600' : 'text-stone-400'}`}>
        {active ? 'Active' : 'Inactive'}
      </span>
    </button>
  );
}

/* ── Permission dropdown (Yes/No with color) ── */
function PermSelect({ value, onChange }: { value: boolean; onChange: (val: boolean) => void }) {
  return (
    <select
      value={value ? 'yes' : 'no'}
      onChange={(e) => onChange(e.target.value === 'yes')}
      className={`rounded-md border text-xs font-medium px-2 py-1 cursor-pointer transition-colors
        focus:outline-none focus:ring-1 focus:ring-amber-400
        ${value
          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
          : 'bg-red-50 text-red-600 border-red-300'
        }`}
    >
      <option value="yes">Yes</option>
      <option value="no">No</option>
    </select>
  );
}

/* ── Loading skeleton row ── */
function SkeletonRow() {
  return (
    <tr className="border-b border-stone-100">
      {[40, 24, 48, 28, 24, 20, 20, 20, 20].map((w, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-3 bg-stone-200 rounded animate-pulse" style={{ width: `${w * 2}px` }} />
        </td>
      ))}
    </tr>
  );
}

/** Strip timestamp portion — "2026-02-19T00:00:00.000000Z" → "2026-02-19" */
function formatDate(dateStr: string): string {
  return dateStr.slice(0, 10);
}

/* ── Single staff row ── */
function StaffRow({ s, idx, isUpdating, onFieldChange, inactive }: {
  s: Staff;
  idx: number;
  isUpdating: boolean;
  onFieldChange: (s: Staff, field: keyof Staff, value: boolean) => void;
  inactive?: boolean;
}) {
  const [showCode, setShowCode] = useState(false);
  return (
    <tr
      className={`border-b border-stone-100 transition-colors
        ${inactive ? 'bg-stone-50/70' : idx % 2 === 0 ? 'bg-white' : 'bg-stone-50/50'}
        ${inactive ? 'hover:bg-stone-100' : 'hover:bg-amber-50'}
        ${isUpdating ? 'opacity-60 pointer-events-none' : ''}`}
    >
      {/* Name + avatar */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <Avatar name={s.full_name} />
          <span className={`font-medium ${inactive ? 'text-stone-400' : 'text-stone-800'}`}>{s.full_name}</span>
        </div>
      </td>

      {/* Access code */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1.5">
          <code className="rounded-lg bg-stone-100 border border-stone-200 px-2 py-0.5 text-xs font-mono text-stone-600 min-w-[52px] text-center tracking-widest">
            {showCode ? s.access_code : '•••••'}
          </code>
          <button
            type="button"
            onClick={() => setShowCode((v) => !v)}
            className="text-stone-400 hover:text-stone-600 transition-colors p-0.5"
            title={showCode ? 'Hide code' : 'Show code'}
          >
            {showCode ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
      </td>

      {/* Email */}
      <td className={`px-4 py-3.5 ${inactive ? 'text-stone-400' : 'text-stone-600'}`}>{s.email}</td>

      {/* Role */}
      <td className="px-4 py-3.5">
        <span className={`font-medium ${inactive ? 'text-stone-400' : 'text-stone-700'}`}>{s.role_name}</span>
      </td>

      {/* Joined date */}
      <td className={`px-4 py-3.5 whitespace-nowrap ${inactive ? 'text-stone-400' : 'text-stone-500'}`}>
        {formatDate(s.joined_date)}
      </td>

      {/* Status toggle */}
      <td className="px-4 py-3.5">
        <StatusToggle active={s.is_active} onToggle={() => onFieldChange(s, 'is_active', !s.is_active)} />
      </td>

      {/* Can Refund — show No when inactive; DB value preserved for restore on reactivation */}
      <td className="px-4 py-3.5 text-center">
        <PermSelect value={s.is_active && s.can_refund} onChange={(val) => onFieldChange(s, 'can_refund', val)} />
      </td>

      {/* Can Waste */}
      <td className="px-4 py-3.5 text-center">
        <PermSelect value={s.is_active && s.can_waste} onChange={(val) => onFieldChange(s, 'can_waste', val)} />
      </td>

      {/* Toggle Channel */}
      <td className="px-4 py-3.5 text-center">
        <PermSelect value={s.is_active && s.can_toggle_channel} onChange={(val) => onFieldChange(s, 'can_toggle_channel', val)} />
      </td>
    </tr>
  );
}

export default function StaffList({ staff, loading, error, onStaffUpdated }: Props) {

  const [updating, setUpdating] = useState<number | null>(null);

  async function handleFieldChange(s: Staff, field: keyof Staff, value: boolean) {
    setUpdating(s.staff_id);
    try {
      // Only save what changed — permissions are never overwritten on deactivation.
      // The UI shows them as No when inactive, but DB values are preserved so they
      // restore automatically when the staff member is reactivated.
      const updated = await updateStaff(s.staff_id, { [field]: value });
      onStaffUpdated(updated);
    } catch {
      /* silently keep current state on error */
    } finally {
      setUpdating(null);
    }
  }

  const activeStaff = staff.filter((s) => s.is_active);
  const inactiveStaff = staff.filter((s) => !s.is_active);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">

      {/* ── Card header ── */}
      <div className="bg-stone-800 px-6 py-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-stone-700 border border-stone-600 flex items-center justify-center text-white text-lg shrink-0">
          👥
        </div>
        <div>
          <h2 className="text-white font-semibold text-base">Registered Staff</h2>
          <p className="text-stone-400 text-xs mt-0.5">All current team members</p>
        </div>
      </div>

      {/* ── Error state ── */}
      {error && (
        <div className="mx-6 mt-5 flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
          <span className="text-red-400 text-lg shrink-0">⚠</span>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* ── Table ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-200 text-xs font-semibold text-stone-500 uppercase tracking-wider">
              <th className="text-left px-4 py-3">Staff Member</th>
              <th className="text-left px-4 py-3">Code</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Role</th>
              <th className="text-left px-4 py-3">Joined</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-center px-4 py-3">Can Refund</th>
              <th className="text-center px-4 py-3">Can Waste</th>
              <th className="text-center px-4 py-3">Toggle Channel</th>
            </tr>
          </thead>
          <tbody>
            {/* Loading skeletons */}
            {loading && (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            )}

            {/* Empty state */}
            {!loading && !error && staff.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-14 text-center">
                  <div className="flex flex-col items-center gap-2 text-stone-400">
                    <span className="text-4xl">🧑‍🍳</span>
                    <p className="text-sm font-medium text-stone-500">No staff registered yet</p>
                    <p className="text-xs">Use the form above to add your first team member.</p>
                  </div>
                </td>
              </tr>
            )}

            {/* Active staff rows */}
            {!loading && activeStaff.map((s, idx) => (
              <StaffRow key={s.staff_id} s={s} idx={idx} isUpdating={updating === s.staff_id} onFieldChange={handleFieldChange} />
            ))}

            {/* Divider between active and inactive */}
            {!loading && activeStaff.length > 0 && inactiveStaff.length > 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-2 bg-stone-100 border-y border-stone-200">
                  <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Inactive Staff</span>
                </td>
              </tr>
            )}

            {/* Inactive-only label when no active staff */}
            {!loading && activeStaff.length === 0 && inactiveStaff.length > 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-2 bg-stone-100 border-y border-stone-200">
                  <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Inactive Staff</span>
                </td>
              </tr>
            )}

            {/* Inactive staff rows */}
            {!loading && inactiveStaff.map((s, idx) => (
              <StaffRow key={s.staff_id} s={s} idx={idx} isUpdating={updating === s.staff_id} onFieldChange={handleFieldChange} inactive />
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Footer ── */}
      {!loading && staff.length > 0 && (
        <div className="px-6 py-3 bg-stone-50 border-t border-stone-200 text-xs text-stone-400 flex justify-between">
          <span>{activeStaff.length} active · {inactiveStaff.length} inactive</span>
          <span>{staff.length} total</span>
        </div>
      )}
    </div>
  );
}
