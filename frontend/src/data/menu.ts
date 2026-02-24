// Menu item shape (matches API response)
export interface MenuItem {
  id: number;
  name: string;
  price: number;
  category_name: string;
  is_published: boolean;
  is_archived: boolean;
  channels?: { order_type_id: number; is_available: boolean }[];
}

// Category icon map (frontend only — icons are decorative)
export const CATEGORY_ICONS: Record<string, string> = {
  Bread:  '🍞',
  Pastry: '🥐',
  Cakes:  '🍰',
  Drinks: '☕',
  Savory: '🥖',
};

export function getCategoryIcon(name: string): string {
  return CATEGORY_ICONS[name] ?? '🏷';
}

// ── Rates (kept in localStorage — not required in DB per spec) ──

export interface Rates {
  vat: number;
  service: number;
}

const RATES_KEY = 'bakery_rates';
const DEFAULT_RATES: Rates = { vat: 0.20, service: 0.10 };

export function loadRates(): Rates {
  try {
    const raw = localStorage.getItem(RATES_KEY);
    if (raw) return JSON.parse(raw) as Rates;
  } catch { /* fallthrough */ }
  return DEFAULT_RATES;
}

export function saveRates(rates: Rates): void {
  localStorage.setItem(RATES_KEY, JSON.stringify(rates));
}
