import { useState, FormEvent } from 'react';
import { createStaff } from '../api/staff';
import type { ApiError } from '../api/staff';
import type { Staff, StaffFormData, ValidationErrors } from '../types/Staff';

const EMPTY_FORM: StaffFormData = {
  full_name: '',
  access_code: '',
  dob: '',
  email: '',
  joined_date: '',
  is_active: true,
  role_name: '',
  can_toggle_channel: false,
  can_waste: false,
  can_refund: false,
};

interface FieldProps {
  label: string;
  name: keyof StaffFormData;
  type?: string;
  placeholder?: string;
  maxLength?: number;
  form: StaffFormData;
  errors: ValidationErrors;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function Field({ label, name, type = 'text', placeholder, maxLength, form, errors, onChange }: FieldProps) {
  const fieldErrors = errors[name] ?? [];
  const hasError = fieldErrors.length > 0;
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={form[name] as string}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`rounded-lg border px-3 py-2.5 text-sm text-stone-800 bg-stone-50 placeholder-stone-400
          transition focus:outline-none focus:ring-2 focus:bg-white
          ${hasError
            ? 'border-red-400 bg-red-50 focus:ring-red-300'
            : 'border-stone-300 focus:ring-amber-400 focus:border-amber-400'
          }`}
      />
      {fieldErrors.map((msg, i) => (
        <p key={i} className="text-xs text-red-500 flex items-center gap-1">
          <span>⚠</span> {msg}
        </p>
      ))}
    </div>
  );
}

interface PermToggleProps {
  label: string;
  name: keyof StaffFormData;
  desc: string;
  form: StaffFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function PermToggle({ label, name, desc, form, onChange }: PermToggleProps) {
  const active = form[name] as boolean;
  return (
    <label className="flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors
      hover:bg-amber-50 hover:border-amber-300
      has-[:checked]:bg-amber-50 has-[:checked]:border-amber-400">
      <div className="mt-0.5 relative">
        <input
          type="checkbox"
          name={name}
          checked={active}
          onChange={onChange}
          className="sr-only"
        />
        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors
          ${active ? 'bg-amber-600 border-amber-600' : 'bg-white border-stone-300'}`}>
          {active && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-stone-700">{label}</p>
        <p className="text-xs text-stone-400">{desc}</p>
      </div>
    </label>
  );
}

interface Props {
  onRegistered: (staff: Staff) => void;
}

export default function StaffRegisterForm({ onRegistered }: Props) {
  const [form, setForm] = useState<StaffFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setErrors((prev) => ({ ...prev, [name]: [] }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setSuccessMsg('');
    setSubmitting(true);
    try {
      const created = await createStaff(form);
      setForm(EMPTY_FORM);
      setSuccessMsg(`${created.full_name} has been registered successfully.`);
      onRegistered(created);
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.errors) setErrors(apiErr.errors);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">

      {/* ── Card header ── */}
      <div className="bg-amber-700 px-6 py-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-600 border border-amber-500 flex items-center justify-center text-white text-lg shrink-0">
          👤
        </div>
        <div>
          <h2 className="text-white font-semibold text-base">Register New Staff</h2>
          <p className="text-amber-200 text-xs mt-0.5">Add a new team member to the bakery</p>
        </div>
      </div>

      <div className="p-6 space-y-6">

        {/* ── Success banner ── */}
        {successMsg && (
          <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
            <span className="text-emerald-500 text-lg shrink-0">✓</span>
            <p className="text-sm font-medium text-emerald-700">{successMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-6">

          {/* ── Personal details ── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px flex-1 bg-stone-200" />
              <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Personal Details</span>
              <div className="h-px flex-1 bg-stone-200" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name" name="full_name" placeholder="e.g. Jane Doe" form={form} errors={errors} onChange={handleChange} />
              <Field label="Access Code" name="access_code" placeholder="Max 10 characters" maxLength={10} form={form} errors={errors} onChange={handleChange} />
              <Field label="Email Address" name="email" type="email" placeholder="staff@bakery.com" form={form} errors={errors} onChange={handleChange} />
              <Field label="Role" name="role_name" placeholder="e.g. Cashier" form={form} errors={errors} onChange={handleChange} />
              <Field label="Date of Birth" name="dob" type="date" form={form} errors={errors} onChange={handleChange} />
              <Field label="Joined Date" name="joined_date" type="date" form={form} errors={errors} onChange={handleChange} />
            </div>
          </div>

          {/* ── Permissions ── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px flex-1 bg-stone-200" />
              <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Permissions & Status</span>
              <div className="h-px flex-1 bg-stone-200" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <PermToggle name="is_active" label="Active" desc="Staff can log in and use the system" form={form} onChange={handleChange} />
              <PermToggle name="can_toggle_channel" label="Toggle Channel" desc="Can enable or disable order channels" form={form} onChange={handleChange} />
              <PermToggle name="can_waste" label="Waste" desc="Can record wastage entries" form={form} onChange={handleChange} />
              <PermToggle name="can_refund" label="Refund" desc="Can process customer refunds" form={form} onChange={handleChange} />
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => { setForm(EMPTY_FORM); setErrors({}); setSuccessMsg(''); }}
              className="text-sm text-stone-400 hover:text-stone-600 transition-colors"
            >
              Clear form
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-700 hover:bg-amber-800
                px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Registering…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Register Staff
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
