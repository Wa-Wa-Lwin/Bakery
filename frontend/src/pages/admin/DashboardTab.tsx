import { useMemo, useState, useEffect, useCallback } from 'react';
import type { AuthUser } from '../../types/Staff';
import { appendAuditLog } from '../../api/auditLog';
import { getMenuItems } from '../../api/menu';
import { getOrders, type ApiOrder } from '../../api/orders';
import { getWaste, logWaste, deleteWaste, type ApiWasteEntry } from '../../api/waste';
import type { MenuItem } from '../../data/menu';

type WasteFilter = 'today' | 'week' | 'month' | 'year' | 'all';

function fmt(n: number) { return `£${n.toFixed(2)}`; }

const QTY_ROWS = [['7','8','9'],['4','5','6'],['1','2','3'],['','0','C']] as const;

const FILTER_OPTS: { label: string; mode: WasteFilter }[] = [
  { label: 'Today',      mode: 'today' },
  { label: 'This Week',  mode: 'week'  },
  { label: 'This Month', mode: 'month' },
  { label: 'This Year',  mode: 'year'  },
  { label: 'All Time',   mode: 'all'   },
];

interface Props { user: AuthUser }

export default function DashboardTab({ user }: Props) {
  const [menuItems,     setMenuItems]     = useState<MenuItem[]>([]);
  const [wasteEntries,  setWasteEntries]  = useState<ApiWasteEntry[]>([]);
  const [todayOrders,   setTodayOrders]   = useState<ApiOrder[]>([]);
  const [showWasteForm, setShowWasteForm] = useState(false);
  const [wasteCatName,  setWasteCatName]  = useState('');
  const [wasteItemId,   setWasteItemId]   = useState('');
  const [wasteQty,      setWasteQty]      = useState('');
  const [wasteUnit,     setWasteUnit]     = useState('');
  const [wasteFilter,   setWasteFilter]   = useState<WasteFilter>('today');
  const [loadingWaste,  setLoadingWaste]  = useState(false);

  const loadWasteForFilter = useCallback(async (filter: WasteFilter) => {
    setLoadingWaste(true);
    try {
      const entries = await getWaste(filter);
      setWasteEntries(entries);
    } finally {
      setLoadingWaste(false);
    }
  }, []);

  useEffect(() => {
    getMenuItems().then(setMenuItems);
    getOrders('today').then(setTodayOrders);
    loadWasteForFilter('today');
  }, [loadWasteForFilter]);

  useEffect(() => { loadWasteForFilter(wasteFilter); }, [wasteFilter, loadWasteForFilter]);

  // All non-archived items for the waste item picker
  const allAvailableItems = useMemo(
    () => menuItems.filter((m) => !m.is_archived),
    [menuItems],
  );

  function handleWasteItemChange(itemId: string) {
    setWasteItemId(itemId);
    if (!itemId) { setWasteUnit(''); setWasteCatName(''); return; }
    const item = menuItems.find((m) => m.id === Number(itemId));
    if (item) {
      setWasteUnit(item.price.toFixed(2));
      setWasteCatName(item.category_name);
    }
  }

  function pressQtyKey(key: string) {
    if (key === 'C') { setWasteQty(''); return; }
    if (key === '') return;
    setWasteQty((prev) => {
      if (prev.length >= 3) return prev;
      if (prev === '' && key === '0') return '';
      return prev + key;
    });
  }

  const todayWaste   = wasteEntries.filter((w) => w.recorded_at?.startsWith(new Date().toISOString().slice(0, 10)));
  const totalRevenue = todayOrders.reduce((s, o) => s + (o.payment?.total ?? 0), 0);
  const orderCount   = todayOrders.length;
  const avgOrder     = orderCount > 0 ? totalRevenue / orderCount : 0;
  const wasteCost    = todayWaste.reduce((s, w) => s + w.qty * w.unit_cost, 0);
  const netRevenue   = totalRevenue - wasteCost;

  const selectedItem     = menuItems.find((m) => m.id === Number(wasteItemId));
  const selectedItemName = selectedItem?.name ?? '';
  const qtyNum           = parseInt(wasteQty) || 0;
  const unitNum          = parseFloat(wasteUnit) || 0;
  const canRecord        = wasteItemId !== '' && qtyNum > 0;

  async function addWasteEntry() {
    if (!canRecord || !selectedItem) return;
    try {
      const entry = await logWaste({
        staff_id:      user.staff_id,
        item_id:       selectedItem.id,
        item_name:     selectedItemName,
        category_name: wasteCatName,
        quantity:      qtyNum,
        unit_cost:     unitNum,
      });
      setWasteEntries((prev) => [entry, ...prev]);
      appendAuditLog(user, 'Waste recorded',
        `${qtyNum}x ${selectedItemName} @ ${fmt(unitNum)} each = ${fmt(qtyNum * unitNum)}`);
      setWasteItemId('');
      setWasteCatName('');
      setWasteQty('');
      setWasteUnit('');
      setShowWasteForm(false);
    } catch (err) {
      console.error('Failed to record waste:', err);
      alert('Failed to record waste. Please try again.');
    }
  }

  async function removeWasteEntry(id: number) {
    await deleteWaste(id);
    setWasteEntries((prev) => prev.filter((w) => w.id !== id));
  }

  const byMethod = {
    card: todayOrders.filter((o) => o.payment?.method === 'card'),
    cash: todayOrders.filter((o) => o.payment?.method === 'cash'),
    qr:   todayOrders.filter((o) => o.payment?.method === 'qr'),
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

  const recentOrders = [...todayOrders].slice(0, 8);

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
        <StatCard label="Gross Revenue" value={fmt(totalRevenue)} sub={`${orderCount} order${orderCount !== 1 ? 's' : ''}`} color="amber" icon="£" />
        <StatCard label="Waste Cost"    value={fmt(wasteCost)}    sub={`${todayWaste.length} item${todayWaste.length !== 1 ? 's' : ''} wasted`} color="red" icon="X" />
        <StatCard label="Net Revenue"   value={fmt(netRevenue)}   sub="after waste" color={netRevenue >= 0 ? 'stone' : 'red'} icon="$" />
        <StatCard label="Avg Order"     value={fmt(avgOrder)}     sub="per transaction" color="stone" icon="~" />
      </div>

      {/* ── Payment method split ── */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-100">
          <p className="text-sm font-semibold text-stone-700">Payment Methods</p>
        </div>
        <div className="grid grid-cols-3 divide-x divide-stone-100">
          {[
            { label: 'Card', orders: byMethod.card },
            { label: 'Cash', orders: byMethod.cash },
            { label: 'QR',   orders: byMethod.qr   },
          ].map(({ label, orders }) => (
            <div key={label} className="px-5 py-4 text-center">
              <p className="text-xs text-stone-500">{label}</p>
              <p className="text-2xl font-bold text-stone-800 mt-1">{orders.length}</p>
              <p className="text-xs text-stone-400 mt-0.5">{fmt(orders.reduce((s, o) => s + (o.payment?.total ?? 0), 0))}</p>
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
            {showWasteForm ? 'X Cancel' : '+ Add Waste'}
          </button>
        </div>

        {showWasteForm && (
          <div className="px-5 py-4 border-b border-stone-100 bg-red-50">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide">Menu Item</label>
                  <select
                    value={wasteItemId}
                    onChange={(e) => handleWasteItemChange(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800
                      focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 transition bg-white"
                  >
                    <option value="">Select item...</option>
                    {allAvailableItems.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide">Category</label>
                  <input
                    type="text"
                    value={wasteCatName}
                    readOnly
                    placeholder="Auto-filled from item"
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-500
                      bg-stone-100 cursor-default select-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide">Unit Price (£)</label>
                  <input
                    type="text"
                    value={wasteUnit ? `£${wasteUnit}` : ''}
                    readOnly
                    placeholder="Auto-filled from item"
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-500
                      bg-stone-100 cursor-default select-none"
                  />
                </div>

                <div className="rounded-lg bg-white border border-stone-200 px-3 py-2 text-sm">
                  <p className="text-xs text-stone-500">Waste value</p>
                  <p className="text-lg font-bold text-red-600 tabular-nums">{fmt(qtyNum * unitNum)}</p>
                  {selectedItemName && (
                    <p className="text-xs text-stone-400 truncate mt-0.5">{qtyNum || 0}x {selectedItemName}</p>
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

              <div className="space-y-2">
                <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide">Quantity</label>
                <div className="bg-white border border-stone-300 rounded-xl px-3 py-2 text-center">
                  <span className="text-2xl font-bold text-stone-800 tabular-nums">
                    {wasteQty || <span className="text-stone-300">0</span>}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {QTY_ROWS.flat().map((key, i) =>
                    key === '' ? <div key={i} /> : (
                      <button
                        key={i}
                        type="button"
                        onClick={() => pressQtyKey(key)}
                        className={`h-10 rounded-lg text-sm font-semibold transition-all active:scale-95 select-none
                          ${key === 'C'
                            ? 'bg-red-100 hover:bg-red-200 text-red-700'
                            : 'bg-stone-100 hover:bg-amber-100 text-stone-800'
                          }`}
                      >
                        {key}
                      </button>
                    )
                  )}
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
            {loadingWaste ? '...' : `${wasteEntries.length} record${wasteEntries.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        {wasteEntries.length === 0 ? (
          <div className="px-5 py-8 text-center text-stone-400 text-sm">No waste recorded</div>
        ) : (
          <div className="divide-y divide-stone-100">
            {wasteEntries.map((w) => (
              <div key={w.id} className="flex items-center gap-3 px-5 py-3">
                <span className="text-lg">X</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800 truncate">{w.item_name}</p>
                  <p className="text-xs text-stone-400">
                    {w.qty} x {fmt(w.unit_cost)} · by {w.recorded_by} ·{' '}
                    {w.recorded_at && new Date(w.recorded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    {' '}
                    {w.recorded_at && new Date(w.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className="text-sm font-semibold text-red-600">{fmt(w.qty * w.unit_cost)}</span>
                <button
                  onClick={() => removeWasteEntry(w.id)}
                  className="text-stone-300 hover:text-red-400 transition-colors text-sm"
                  title="Remove entry"
                >X</button>
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
                <div key={o.order_id} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-lg">{o.payment?.method === 'card' ? 'C' : o.payment?.method === 'cash' ? '$' : 'Q'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-800 truncate">{o.customer_name}</p>
                    <p className="text-xs text-stone-400">
                      {o.paid_at && new Date(o.paid_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-amber-700">{fmt(o.payment?.total ?? 0)}</span>
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
  label: string; value: string; sub: string; color: 'amber' | 'stone' | 'red'; icon: string;
}) {
  const bg      = color === 'amber' ? 'bg-amber-700 border-amber-600' : color === 'red' ? 'bg-red-50 border-red-200' : 'bg-white border-stone-200';
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
