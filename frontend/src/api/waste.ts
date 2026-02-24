const BASE = '/api';

export interface ApiWasteEntry {
  id: number;
  item_name: string;
  category_name: string;
  qty: number;
  unit_cost: number;
  recorded_by: string;
  recorded_at: string;
}

export async function getWaste(
  period: 'today' | 'week' | 'month' | 'year' | 'all' = 'today',
): Promise<ApiWasteEntry[]> {
  const res = await fetch(`${BASE}/waste?period=${period}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to fetch waste');
  return res.json();
}

export async function logWaste(payload: {
  staff_id: number;
  item_id?: number;
  item_name: string;
  category_name: string;
  quantity: number;
  unit_cost: number;
}): Promise<ApiWasteEntry> {
  const res = await fetch(`${BASE}/waste`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function deleteWaste(id: number): Promise<void> {
  const res = await fetch(`${BASE}/waste/${id}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to delete waste entry');
}
