const BASE = '/api';

export interface ApiMenuItem {
  id: number;
  name: string;
  price: number;
  category_name: string;
  is_published: boolean;
  is_archived: boolean;
  channels: { order_type_id: number; is_available: boolean }[];
}

export async function getMenuItems(): Promise<ApiMenuItem[]> {
  const res = await fetch(`${BASE}/menu-items`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to fetch menu items');
  return res.json();
}

export async function getCategories(): Promise<string[]> {
  const res = await fetch(`${BASE}/categories`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function createMenuItem(data: {
  item_name: string;
  unit_cost: number;
  category_name: string;
  is_published?: boolean;
}): Promise<ApiMenuItem> {
  const res = await fetch(`${BASE}/menu-items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function updateMenuItem(
  id: number,
  data: Partial<{ unit_cost: number; is_published: boolean; is_archived: boolean }>,
): Promise<ApiMenuItem> {
  const res = await fetch(`${BASE}/menu-items/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function updateChannelStatus(
  itemId: number,
  orderTypeId: number,
  isAvailable: boolean,
): Promise<void> {
  const res = await fetch(`${BASE}/menu-channel-statuses/${itemId}/${orderTypeId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ is_available: isAvailable }),
  });
  if (!res.ok) throw new Error('Failed to update channel status');
}
