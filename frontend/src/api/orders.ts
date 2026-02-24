const BASE = '/api';

export interface ApiOrderItem {
  item_id: number;
  name: string;
  price: number;
  qty: number;
}

export interface ApiOrder {
  order_id: number;
  customer_name: string;
  order_type: string;
  status: string;
  paid_at: string | null;
  created_at: string | null;
  items: ApiOrderItem[];
  payment: {
    total: number;
    subtotal: number;
    vat_amount: number;
    service_amount: number;
    method: string;
  } | null;
}

export async function getOrders(period: 'today' | 'week' | 'month' | 'year' | 'all' = 'today'): Promise<ApiOrder[]> {
  const res = await fetch(`${BASE}/orders?period=${period}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
}

export async function createOrder(data: {
  customer_name: string;
  order_type: string;
  staff_id: number;
  payment_method: string;
  total: number;
  subtotal: number;
  vat_amount: number;
  service_amount: number;
  items: { item_id: number; quantity: number }[];
}): Promise<ApiOrder> {
  const res = await fetch(`${BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}
