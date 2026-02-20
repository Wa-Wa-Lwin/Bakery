export interface Category {
  id: number;
  name: string;
  icon: string;
}

export interface MenuItem {
  id: number;
  categoryId: number;
  name: string;
  price: number;
  is_published: boolean;
  is_archived?: boolean;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 1, name: 'Bread',   icon: '🍞' },
  { id: 2, name: 'Pastry',  icon: '🥐' },
  { id: 3, name: 'Cakes',   icon: '🍰' },
  { id: 4, name: 'Drinks',  icon: '☕' },
  { id: 5, name: 'Savory',  icon: '🥖' },
];

const DEFAULT_ITEMS: MenuItem[] = [
  { id:  1, categoryId: 1, name: 'Sourdough Loaf',        price: 8.50, is_published: true },
  { id:  2, categoryId: 1, name: 'White Bloomer',          price: 4.50, is_published: true },
  { id:  3, categoryId: 1, name: 'Rye Bread',              price: 6.00, is_published: true },
  { id:  4, categoryId: 1, name: 'Seeded Roll',            price: 1.80, is_published: true },
  { id:  5, categoryId: 1, name: 'Focaccia',               price: 5.50, is_published: true },
  { id:  6, categoryId: 2, name: 'Croissant',              price: 2.50, is_published: true },
  { id:  7, categoryId: 2, name: 'Pain au Chocolat',       price: 2.80, is_published: true },
  { id:  8, categoryId: 2, name: 'Almond Danish',          price: 3.20, is_published: true },
  { id:  9, categoryId: 2, name: 'Cinnamon Roll',          price: 3.50, is_published: true },
  { id: 10, categoryId: 2, name: 'Fruit Danish',           price: 3.00, is_published: true },
  { id: 11, categoryId: 3, name: 'Victoria Sponge',        price: 3.80, is_published: true },
  { id: 12, categoryId: 3, name: 'Lemon Drizzle',          price: 3.50, is_published: true },
  { id: 13, categoryId: 3, name: 'Carrot Cake',            price: 4.00, is_published: true },
  { id: 14, categoryId: 3, name: 'Brownie',                price: 2.80, is_published: true },
  { id: 15, categoryId: 3, name: 'Cheesecake',             price: 4.50, is_published: true },
  { id: 16, categoryId: 4, name: 'Americano',              price: 2.80, is_published: true },
  { id: 17, categoryId: 4, name: 'Flat White',             price: 3.20, is_published: true },
  { id: 18, categoryId: 4, name: 'Cappuccino',             price: 3.50, is_published: true },
  { id: 19, categoryId: 4, name: 'Tea',                    price: 2.20, is_published: true },
  { id: 20, categoryId: 4, name: 'Fresh OJ',               price: 3.80, is_published: true },
  { id: 21, categoryId: 5, name: 'Cheese Twist',           price: 2.20, is_published: true },
  { id: 22, categoryId: 5, name: 'Sausage Roll',           price: 3.50, is_published: true },
  { id: 23, categoryId: 5, name: 'Ham & Cheese Croissant', price: 4.50, is_published: true },
  { id: 24, categoryId: 5, name: 'Spinach Quiche',         price: 4.80, is_published: true },
  { id: 25, categoryId: 5, name: 'Cheese & Onion Pasty',   price: 4.20, is_published: true },
];

const MENU_KEY = 'bakery_menu';

export function loadMenu(): MenuItem[] {
  try {
    const raw = localStorage.getItem(MENU_KEY);
    if (raw) return JSON.parse(raw) as MenuItem[];
  } catch { /* fallthrough */ }
  const defaults = DEFAULT_ITEMS;
  localStorage.setItem(MENU_KEY, JSON.stringify(defaults));
  return defaults;
}

export function saveMenu(items: MenuItem[]): void {
  localStorage.setItem(MENU_KEY, JSON.stringify(items));
}

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
