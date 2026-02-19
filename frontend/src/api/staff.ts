import type { Staff, StaffFormData, ValidationErrors } from '../types/Staff';

const BASE = '/api';

export async function getStaff(): Promise<Staff[]> {
  const res = await fetch(`${BASE}/staff`);
  if (!res.ok) throw new Error('Failed to fetch staff list');
  return res.json();
}

export interface ApiError {
  message: string;
  errors?: ValidationErrors;
}

export async function updateStaff(id: number, data: Partial<Pick<Staff, 'is_active' | 'can_toggle_channel' | 'can_waste' | 'can_refund'>>): Promise<Staff> {
  const res = await fetch(`${BASE}/staff/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const body: ApiError = await res.json();
    throw body;
  }

  return res.json();
}

export async function createStaff(data: StaffFormData): Promise<Staff> {
  const res = await fetch(`${BASE}/staff`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const body: ApiError = await res.json();
    throw body;
  }

  return res.json();
}
