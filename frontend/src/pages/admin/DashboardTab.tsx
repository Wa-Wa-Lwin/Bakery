import { useMemo, useState } from 'react';
import type { AuthUser } from '../../types/Staff';
import { appendAudit } from '../../data/audit';
import { loadMenu, DEFAULT_CATEGORIES } from '../../data/menu';

interface OrderRecord {
  orderId: string;
  customerName: string;
  items: { name: string; qty: number; price: number }[];
  subtotal: number;
  total: number;
  orderType: string;
  paymentMethod: 'card' | 'cash' | 'qr';
  paidAt: string;
}

interface WasteEntry {
  id: string;
  itemName: string;
  qty: number;
  unitCost: number;
  recordedBy: string;
  recordedAt: string;
}

type WasteFilter = 'today' | 'week' | 'month' | 'year' | 'all';

function fmt(n: number) { return `£${n.toFixed(2)}`; }

function todayPrefix() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function filterWasteByMode(entries: WasteEntry[], mode: WasteFilter): WasteEntry[] {
  const now = new Date();
  return entries.filter((w) => {
    const d = new Date(w.recordedAt);
    switch (mode) {
      case 'today':
        return w.recordedAt.startsWith(todayPrefix());
      case 'week': {
        const msPerDay = 1000 * 60 * 60 * 24;
        return (now.getTime() - d.getTime()) / msPerDay < 7;
      }
      case 'month':
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      case 'year':
        return d.getFullYear() === now.getFullYear();
      case 'all':
        return true;
    }
  });
}

const WASTE_KEY = 'bakery_waste';

function loadWaste(): WasteEntry[] {
  try {
    const raw = localStorage.getItem(WASTE_KEY);
    if (raw) return JSON.parse(raw) as WasteEntry[];
  } catch { /* fallthrough */ }
  return [];
}

function saveWaste(entries: WasteEntry[]) {
  localStorage.setItem(WASTE_KEY, JSON.stringify(entries));
}

const QTY_ROWS = [['7','8','9'],['4','5','6'],['1','2','3'],['⌫','0','C']] as const;

const FILTER_OPTS: { label: string; mode: WasteFilter }[] = [
  { label: 'Today',     mode: 'today' },
  { label: 'This Week', mode: 'week'  },
  { label: 'This Month',mode: 'month' },
  { label: 'This Year', mode: 'year'  },
  { label: 'All Time',  mode: 'all'   },
];

interface Props { user: AuthUser }

export default function DashboardTab({ user }: Props) {
  const menuItems = useMemo(() => loadMenu(), []);

  const [wasteEntries, setWasteEntries] = useState<WasteEntry[]>(loadWaste);
  const [showWasteForm, setShowWasteForm] = useState(false);
  const [wasteCatId, setWasteCatId]       = useState('');
  const [wasteItemId, setWasteItemId]     = useState('');
  const [wasteQty, setWasteQty]           = useState('');
  const [wasteUnit, setWasteUnit]         = useState('');
  const [wasteFilter, setWasteFilter]     = useState<WasteFilter>('today');

  const wasteCatItems = wasteCatId
    ? menuItems.filter((m) => m.categoryId === Number(wasteCatId) && !m.is_archived)
    : [];

  function handleWasteCatChange(catId: string) {
    setWasteCatId(catId);
    setWasteItemId('');
    setWasteUnit('');
  }

  function handleWasteItemChange(itemId: string) {
    setWasteItemId(itemId);
    if (!itemId) { setWasteUnit(''); return; }
    const item = menuItems.find((m) => m.id === Number(itemId));
    if (item) { setWasteUnit(item.price.toFixed(2)); }
  }

  function pressQtyKey(key: string) {
    if (key === 'C') { setWasteQty(''); return; }
    if (key === '⌫') { setWasteQty((p) => p.slice(0, -1)); return; }
    setWasteQty((prev) => {
      if (prev.length >= 3) return prev; // cap at 999
      if (prev === '' && key === '0') return ''; // no leading zeros
      return prev + key;
    });
  }

  const todayOrders = useMemo<OrderRecord[]>(() => {
    try {
      const all: OrderRecord[] = JSON.parse(localStorage.getItem('bakery_orders') ?? '[]');
      const prefix = todayPrefix();
      return all.filter((o) => o.paidAt?.startsWith(prefix));
    } catch {
      return [];
    }
  }, []);

  const todayWaste    = wasteEntries.filter((w) => w.recordedAt.startsWith(todayPrefix()));
  const filteredWaste = filterWasteByMode(wasteEntries, wasteFilter);

  const totalRevenue  = todayOrders.reduce((s, o) => s + o.total, 0);
  const orderCount    = todayOrders.length;
  const avgOrder      = orderCount > 0 ? totalRevenue / orderCount : 0;
  const wasteCost     = todayWaste.reduce((s, w) => s + w.qty * w.unitCost, 0);
  const netRevenue    = totalRevenue - wasteCost;

  const selectedItemName = menuItems.find((m) => m.id === Number(wasteItemId))?.name ?? '';
  const qtyNum           = parseInt(wasteQty) || 0;
  const unitNum          = parseFloat(wasteUnit) || 0;
  const canRecord        = wasteItemId !== '' && qtyNum > 0;

  function addWasteEntry() {
    if (!canRecord) return;
    const entry: WasteEntry = {
      id: `W-${Date.now()}`,
      itemName: selectedItemName,
      qty: qtyNum,
      unitCost: unitNum,
      recordedBy: user.full_name,
      recordedAt: new Date().toISOString(),
    };
    const updated = [entry, ...wasteEntries];
    saveWaste(updated);
    setWasteEntries(updated);
    appendAudit(user, 'Waste recorded',
      `${qtyNum}× ${selectedItemName} @ ${fmt(unitNum)} each = ${fmt(qtyNum * unitNum)}`);
    // reset form
    setWasteCatId('');
    setWasteItemId('');
    setWasteQty('');
    setWasteUnit('');
    setShowWasteForm(false);
  }

  function removeWasteEntry(id: string) {
    const updated = wasteEntries.filter((w) => w.id !== id);
    saveWaste(updated);
    setWasteEntries(updated);
  }

  const byMethod = {
    card: todayOrders.filter((o) => o.paymentMethod === 'card'),
    cash: todayOrders.filter((o) => o.paymentMethod === 'cash'),
    qr:   todayOrders.filter((o) => o.paymentMethod === 'qr'),
  };

  // Aggregate best sellers
  const itemTotals: Record<string, { qty: number; revenue: number }> = {};
  for (const order of todayOrders) {
    for (const it of order.items) {
      if (!itemTotals[it.name]) itemTotals[it.name] = { qty: 0, revenue: 0 };
      itemTotals[it.name].qty     += it.qty;
      itemTotals[it.name].revenue += it.qty * it.price;
    }
  }
  const bestSellers = Object.entries(itemTotals)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const recentOrders = [...todayOrders].reverse().slice(0, 8);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">

      {/* ── Date heading ── */}
      <div>
        <h2 className="text-stone-800 font-semibold text-xl">Today's Overview</h2>
        <p className="text-stone-500 text-sm mt-0.5">
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Gross Revenue" value={fmt(totalRevenue)} sub={`${orderCount} order${orderCount !== 1 ? 's' : ''}`} color="amber" icon="💷" />
        <StatCard label="Waste Cost"    value={fmt(wasteCost)}    sub={`${todayWaste.length} item${todayWaste.length !== 1 ? 's' : ''} wasted`} color="red"   icon="🗑" />
        <StatCard label="Net Revenue"   value={fmt(netRevenue)}   sub="after waste"          color={netRevenue >= 0 ? 'stone' : 'red'} icon="📊" />
        <StatCard label="Avg Order"     value={fmt(avgOrder)}     sub="per transaction"       color="stone"  icon="🧾" />
      </div>

      {/* ── Payment method split ── */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-100">
          <p className="text-sm font-semibold text-stone-700">Payment Methods</p>
        </div>
        <div className="grid grid-cols-3 divide-x divide-stone-100">
          {[
            { label: '💳 Card', orders: byMethod.card },
            { label: '💵 Cash', orders: byMethod.cash },
            { label: '📱 QR',   orders: byMethod.qr   },
          ].map(({ label, orders }) => (
            <div key={label} className="px-5 py-4 text-center">
              <p className="text-xs text-stone-500">{label}</p>
              <p className="text-2xl font-bold text-stone-800 mt-1">{orders.length}</p>
              <p className="text-xs text-stone-400 mt-0.5">{fmt(orders.reduce((s, o) => s + o.total, 0))}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Waste sheet ── */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-stone-700">Waste Sheet</p>
            <p className="text-xs text-stone-400 mt-0.5">Record unsold / discarded items — today's waste: {fmt(wasteCost)}</p>
          </div>
          <button
            onClick={() => setShowWasteForm((v) => !v)}
            className="text-xs bg-red-50 hover:bg-red-100 border border-red-200 text-red-700
              font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            {showWasteForm ? '✕ Cancel' : '+ Add Waste'}
          </button>
        </div>

        {showWasteForm && (
          <div className="px-5 py-4 border-b border-stone-100 bg-red-50">
            <div className="grid grid-cols-2 gap-4">

              {/* ── Left: dropdowns + price ── */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide">Category</label>
                  <select
                    value={wasteCatId}
                    onChange={(e) => handleWasteCatChange(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800
                      focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 transition bg-white"
                  >
                    <option value="">Select category…</option>
                    {DEFAULT_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide">Menu Item</label>
                  <select
                    value={wasteItemId}
                    onChange={(e) => handleWasteItemChange(e.target.value)}
                    disabled={!wasteCatId}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800
                      focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 transition bg-white
                      disabled:opacity-50"
                  >
                    <option value="">Select item…</option>
                    {wasteCatItems.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide">Unit Price (£)</label>
                  <input
                    type="number"
                    value={wasteUnit}
                    onChange={(e) => setWasteUnit(e.target.value)}
                    placeholder="0.00"
                    min="0" step="0.01"
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800
                      focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 transition bg-white"
                  />
                </div>

                {/* Live calc */}
                <div className="rounded-lg bg-white border border-stone-200 px-3 py-2 text-sm">
                  <p className="text-xs text-stone-500">Waste value</p>
                  <p className="text-lg font-bold text-red-600 tabular-nums">{fmt(qtyNum * unitNum)}</p>
                  {selectedItemName && (
                    <p className="text-xs text-stone-400 truncate mt-0.5">{qtyNum || 0}× {selectedItemName}</p>
                  )}
                </div>

                <button
                  onClick={addWasteEntry}
                  disabled={!canRecord}
                  className="w-full rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold
                    py-2.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Record Waste
                </button>
              </div>

              {/* ── Right: qty numpad ── */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide">Quantity</label>
                <div className="bg-white border border-stone-300 rounded-xl px-3 py-2 text-center">
                  <span className="text-2xl font-bold text-stone-800 tabular-nums">
                    {wasteQty || <span className="text-stone-300">0</span>}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {QTY_ROWS.flat().map((key, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => pressQtyKey(key)}
                      className={`h-10 rounded-lg text-sm font-semibold transition-all active:scale-95 select-none
                        ${key === 'C'
                          ? 'bg-red-100 hover:bg-red-200 text-red-700'
                          : key === '⌫'
                            ? 'bg-stone-200 hover:bg-stone-300 text-stone-600'
                            : 'bg-stone-100 hover:bg-amber-100 text-stone-800'
                        }`}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Filter tabs ── */}
        <div className="px-5 py-2 border-b border-stone-100 flex items-center gap-2 overflow-x-auto">
          {FILTER_OPTS.map(({ label, mode }) => (
            <button
              key={mode}
              onClick={() => setWasteFilter(mode)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap transition-colors
                ${wasteFilter === mode
                  ? 'bg-red-600 text-white'
                  : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                }`}
            >
              {label}
            </button>
          ))}
          <span className="ml-auto text-xs text-stone-400 shrink-0">
            {filteredWaste.length} record{filteredWaste.length !== 1 ? 's' : ''}
          </span>
        </div>

        {filteredWaste.length === 0 ? (
          <div className="px-5 py-8 text-center text-stone-400 text-sm">No waste recorded</div>
        ) : (
          <div className="divide-y divide-stone-100">
            {filteredWaste.map((w) => (
              <div key={w.id} className="flex items-center gap-3 px-5 py-3">
                <span className="text-lg">🗑</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800 truncate">{w.itemName}</p>
                  <p className="text-xs text-stone-400">
                    {w.qty} × {fmt(w.unitCost)} · by {w.recordedBy} ·{' '}
                    {new Date(w.recordedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    {' '}
                    {new Date(w.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className="text-sm font-semibold text-red-600">{fmt(w.qty * w.unitCost)}</span>
                <button
                  onClick={() => removeWasteEntry(w.id)}
                  className="text-stone-300 hover:text-red-400 transition-colors text-sm"
                  title="Remove entry"
                >✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* ── Best sellers ── */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-stone-100">
            <p className="text-sm font-semibold text-stone-700">Best Sellers Today</p>
          </div>
          {bestSellers.length === 0 ? (
            <div className="px-5 py-8 text-center text-stone-400 text-sm">No sales yet today</div>
          ) : (
            <div className="divide-y divide-stone-100">
              {bestSellers.map((item, i) => (
                <div key={item.name} className="flex items-center gap-3 px-5 py-3">
                  <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center
                    ${i === 0 ? 'bg-amber-500 text-white' : i === 1 ? 'bg-stone-200 text-stone-600' : i === 2 ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-500'}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-800 truncate">{item.name}</p>
                    <p className="text-xs text-stone-400">{fmt(item.revenue)} revenue</p>
                  </div>
                  <span className="text-sm font-semibold text-stone-700">{item.qty} sold</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Recent orders ── */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-stone-100">
            <p className="text-sm font-semibold text-stone-700">Recent Orders</p>
          </div>
          {recentOrders.length === 0 ? (
            <div className="px-5 py-8 text-center text-stone-400 text-sm">No orders yet today</div>
          ) : (
            <div className="divide-y divide-stone-100">
              {recentOrders.map((o) => (
                <div key={o.orderId} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-lg">{o.paymentMethod === 'card' ? '💳' : o.paymentMethod === 'cash' ? '💵' : '📱'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-800 truncate">{o.customerName}</p>
                    <p className="text-xs text-stone-400">{new Date(o.paidAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <span className="text-sm font-semibold text-amber-700">{fmt(o.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color, icon }: {
  label: string;
  value: string;
  sub: string;
  color: 'amber' | 'stone' | 'red';
  icon: string;
}) {
  const bg    = color === 'amber' ? 'bg-amber-700 border-amber-600' : color === 'red' ? 'bg-red-50 border-red-200' : 'bg-white border-stone-200';
  const label_c = color === 'amber' ? 'text-amber-200' : color === 'red' ? 'text-red-500' : 'text-stone-500';
  const value_c = color === 'amber' ? 'text-white' : color === 'red' ? 'text-red-700' : 'text-stone-800';
  const sub_c   = color === 'amber' ? 'text-amber-200' : color === 'red' ? 'text-red-400' : 'text-stone-400';
  return (
    <div className={`rounded-2xl border shadow-sm px-4 py-4 flex items-center gap-3 ${bg}`}>
      <span className="text-2xl">{icon}</span>
      <div className="min-w-0">
        <p className={`text-xs font-medium ${label_c}`}>{label}</p>
        <p className={`text-xl font-bold mt-0.5 tabular-nums ${value_c}`}>{value}</p>
        <p className={`text-xs mt-0.5 truncate ${sub_c}`}>{sub}</p>
      </div>
    </div>
  );
}
