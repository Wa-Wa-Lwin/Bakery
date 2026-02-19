import type { Staff } from '../types/Staff';

interface Props {
  staff: Staff[];
  loading: boolean;
  error: string;
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

/* ── Status badge ── */
function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium
      ${active
        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        : 'bg-stone-100 text-stone-500 border border-stone-200'
      }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-stone-400'}`} />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

/* ── Permission chip ── */
function Chip({ label }: { label: string }) {
  return (
    <span className="inline-block rounded-md bg-amber-100 text-amber-700 border border-amber-200
      px-2 py-0.5 text-xs font-medium">
      {label}
    </span>
  );
}

/* ── Loading skeleton row ── */
function SkeletonRow() {
  return (
    <tr className="border-b border-stone-100">
      {[40, 24, 48, 28, 24, 20, 36].map((w, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className={`h-3 bg-stone-200 rounded animate-pulse`} style={{ width: `${w * 2}px` }} />
        </td>
      ))}
    </tr>
  );
}

export default function StaffList({ staff, loading, error }: Props) {
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
              <th className="text-left px-4 py-3">Permissions</th>
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
                <td colSpan={7} className="px-4 py-14 text-center">
                  <div className="flex flex-col items-center gap-2 text-stone-400">
                    <span className="text-4xl">🧑‍🍳</span>
                    <p className="text-sm font-medium text-stone-500">No staff registered yet</p>
                    <p className="text-xs">Use the form above to add your first team member.</p>
                  </div>
                </td>
              </tr>
            )}

            {/* Data rows */}
            {!loading && staff.map((s, idx) => (
              <tr
                key={s.staff_id}
                className={`border-b border-stone-100 hover:bg-amber-50 transition-colors
                  ${idx % 2 === 0 ? 'bg-white' : 'bg-stone-50/50'}`}
              >
                {/* Name + avatar */}
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar name={s.full_name} />
                    <span className="font-medium text-stone-800">{s.full_name}</span>
                  </div>
                </td>

                {/* Access code */}
                <td className="px-4 py-3.5">
                  <code className="rounded-lg bg-stone-100 border border-stone-200 px-2 py-0.5 text-xs font-mono text-stone-600">
                    {s.access_code}
                  </code>
                </td>

                {/* Email */}
                <td className="px-4 py-3.5 text-stone-600">{s.email}</td>

                {/* Role */}
                <td className="px-4 py-3.5">
                  <span className="text-stone-700 font-medium">{s.role_name}</span>
                </td>

                {/* Joined date */}
                <td className="px-4 py-3.5 text-stone-500 whitespace-nowrap">{s.joined_date}</td>

                {/* Status */}
                <td className="px-4 py-3.5">
                  <StatusBadge active={s.is_active} />
                </td>

                {/* Permissions */}
                <td className="px-4 py-3.5">
                  <div className="flex flex-wrap gap-1">
                    {s.can_toggle_channel && <Chip label="Toggle Channel" />}
                    {s.can_waste && <Chip label="Waste" />}
                    {s.can_refund && <Chip label="Refund" />}
                    {!s.can_toggle_channel && !s.can_waste && !s.can_refund && (
                      <span className="text-stone-400 text-xs italic">None</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Footer ── */}
      {!loading && staff.length > 0 && (
        <div className="px-6 py-3 bg-stone-50 border-t border-stone-200 text-xs text-stone-400 text-right">
          Showing {staff.length} {staff.length === 1 ? 'staff member' : 'staff members'}
        </div>
      )}
    </div>
  );
}
