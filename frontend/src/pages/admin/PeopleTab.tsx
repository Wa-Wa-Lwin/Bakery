import { useEffect, useState } from 'react';
import StaffRegisterForm from '../../components/StaffRegisterForm';
import StaffList from '../../components/StaffList';
import { getStaff } from '../../api/staff';
import type { Staff } from '../../types/Staff';
import type { AuthUser } from '../../types/Staff';
import { appendAudit } from '../../data/audit';

interface Props { user: AuthUser }

export default function PeopleTab({ user }: Props) {
  const [staff, setStaff]   = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

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
    appendAudit(user, 'Staff registered', `${newStaff.full_name} (${newStaff.role_name})`);
  }

  function handleStaffUpdated(updated: Staff) {
    const prev = staff.find((s) => s.staff_id === updated.staff_id);
    if (prev && prev.is_active !== updated.is_active) {
      appendAudit(user, updated.is_active ? 'Staff activated' : 'Staff deactivated', updated.full_name);
    }
    setStaff((prevList) => prevList.map((s) => s.staff_id === updated.staff_id ? updated : s));
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-stone-800 font-semibold text-xl">People & Permissions</h2>
          <p className="text-stone-500 text-sm mt-0.5">Register and manage your bakery team</p>
        </div>
        <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full border border-amber-200">
          {staff.length} {staff.length === 1 ? 'member' : 'members'}
        </span>
      </div>
      <StaffRegisterForm onRegistered={handleRegistered} />
      <StaffList staff={staff} loading={loading} error={error} onStaffUpdated={handleStaffUpdated} />
    </div>
  );
}
