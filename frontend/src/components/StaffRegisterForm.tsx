import { useState, useEffect } from 'react';
import { createStaff } from '../api/staff';
import type { ApiError } from '../api/staff';
import type { Staff, StaffFormData, ValidationErrors } from '../types/Staff';

const STORAGE_KEY = 'staff_register_form';

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function generateAccessCode(): string {
  const digits = '0123456789';
  let code = '';
  for (let i = 0; i < 5; i++) code += digits[Math.floor(Math.random() * digits.length)];
  return code;
}

function freshForm(): StaffFormData {
  return {
    full_name: '',
    access_code: generateAccessCode(),
    dob: '',
    email: '',
    joined_date: todayStr(),
    is_active: true,
    role_name: '',
    can_toggle_channel: false,
    can_waste: false,
    can_refund: false,
  };
}

function loadForm(): StaffFormData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved) as StaffFormData;
  } catch { /* ignore */ }
  return freshForm();
}

/** Max date for DOB: must be at least 15 years old */
const DOB_MAX = `${new Date().getFullYear() - 15}-12-31`;

interface FieldProps {
  label: string;
  name: keyof StaffFormData;
  type?: string;
  placeholder?: string;
  maxLength?: number;
  max?: string;
  min?: string;
  readOnly?: boolean;
  form: StaffFormData;
  errors: ValidationErrors;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function Field({ label, name, type = 'text', placeholder, maxLength, max, min, readOnly, form, errors, onChange }: FieldProps) {
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
        max={max}
        min={min}
        readOnly={readOnly}
        className={`rounded-lg border px-3 py-2.5 text-sm text-stone-800 placeholder-stone-400
          transition focus:outline-none focus:ring-2 focus:bg-white
          ${readOnly ? 'bg-stone-200 cursor-not-allowed text-stone-500' : 'bg-stone-50'}
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

const ROLE_OPTIONS = ['Staff', 'Manager', 'Owner'];

interface SelectFieldProps {
  label: string;
  name: keyof StaffFormData;
  options: string[];
  form: StaffFormData;
  errors: ValidationErrors;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

function SelectField({ label, name, options, form, errors, onChange }: SelectFieldProps) {
  const fieldErrors = errors[name] ?? [];
  const hasError = fieldErrors.length > 0;
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide">
        {label}
      </label>
      <select
        name={name}
        value={form[name] as string}
        onChange={onChange}
        className={`rounded-lg border px-3 py-2.5 text-sm text-stone-800 bg-stone-50
          transition focus:outline-none focus:ring-2 focus:bg-white
          ${hasError
            ? 'border-red-400 bg-red-50 focus:ring-red-300'
            : 'border-stone-300 focus:ring-amber-400 focus:border-amber-400'
          }`}
      >
        <option value="">Select a role</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
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
  onToggle: (name: keyof StaffFormData) => void;
}

function PermToggle({ label, name, desc, form, onToggle }: PermToggleProps) {
  const active = form[name] as boolean;
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer hover:bg-amber-50 hover:border-amber-300
        ${active ? 'bg-amber-50 border-amber-400' : ''}
      `}
      onClick={() => onToggle(name)}
    >
      <div>
        <p className="text-sm font-medium text-stone-700">{label}</p>
        <p className="text-xs text-stone-400">{desc}</p>
      </div>
      <div className={`relative w-11 h-6 rounded-full transition-colors ${active ? 'bg-amber-600' : 'bg-stone-300'}`}>
        <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${active ? 'translate-x-5' : 'translate-x-0'}`} />
      </div>
    </div>
  );
}

interface Props {
  onRegistered: (staff: Staff) => void;
}

export default function StaffRegisterForm({ onRegistered }: Props) {
  const [form, setForm] = useState<StaffFormData>(loadForm);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Persist form to localStorage on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  }, [form]);

  // When role becomes "staff" (case-insensitive), auto-turn off manager/owner permissions
  useEffect(() => {
    if (form.role_name.trim().toLowerCase() === 'staff') {
      setForm((prev) => ({
        ...prev,
        can_refund: false,
        can_waste: false,
        can_toggle_channel: false,
      }));
    }
  }, [form.role_name]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    const isCheckbox = 'checked' in e.target && e.target.type === 'checkbox';
    setForm((prev) => ({ ...prev, [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value }));
    setErrors((prev) => ({ ...prev, [name]: [] }));
  }

  function handleToggle(name: keyof StaffFormData) {
    setForm((prev) => ({ ...prev, [name]: !prev[name] }));
    setErrors((prev) => ({ ...prev, [name]: [] }));
  }

  const isStaffRole = form.role_name.trim().toLowerCase() === 'staff';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setSuccessMsg('');
    setSubmitting(true);
    try {
      const created = await createStaff(form);
      const fresh = freshForm();
      setForm(fresh);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
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
              <Field label="Full Name" name="full_name" placeholder="e.g. aung aung" form={form} errors={errors} onChange={handleChange} />
              <Field label="Access Code" name="access_code" readOnly form={form} errors={errors} onChange={handleChange} />
              <Field label="Email Address" name="email" type="email" placeholder="staff@bakery.com" form={form} errors={errors} onChange={handleChange} />
              <SelectField label="Role" name="role_name" options={ROLE_OPTIONS} form={form} errors={errors} onChange={handleChange} />
              <Field label="Date of Birth" name="dob" type="date" max={DOB_MAX} form={form} errors={errors} onChange={handleChange} />
              <Field label="Joined Date" name="joined_date" type="date" max={todayStr()} form={form} errors={errors} onChange={handleChange} />
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
              <PermToggle name="is_active" label="Active" desc="Staff can log in and use the system" form={form} onToggle={handleToggle} />
              <PermToggle name="can_toggle_channel" label="Toggle Channel" desc="Can enable or disable order channels" form={form} onToggle={handleToggle} />
              <PermToggle name="can_waste" label="Waste" desc="Can record wastage entries" form={form} onToggle={handleToggle} />
              <PermToggle name="can_refund" label="Refund" desc="Can process customer refunds" form={form} onToggle={handleToggle} />
            </div>
            {isStaffRole && (
              <p className="text-xs text-amber-600 mt-2">Staff role permissions are automatically turned off. You can still toggle them on if needed.</p>
            )}
          </div>

          {/* ── Actions ── */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => { const f = freshForm(); setForm(f); localStorage.setItem(STORAGE_KEY, JSON.stringify(f)); setErrors({}); setSuccessMsg(''); }}
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
