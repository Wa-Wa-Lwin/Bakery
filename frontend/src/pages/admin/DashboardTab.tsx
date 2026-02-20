import { useMemo } from 'react';

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

function fmt(n: number) { return `£${n.toFixed(2)}`; }

function todayPrefix() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

export default function DashboardTab() {
  const todayOrders = useMemo<OrderRecord[]>(() => {
    try {
      const all: OrderRecord[] = JSON.parse(localStorage.getItem('bakery_orders') ?? '[]');
      const prefix = todayPrefix();
      return all.filter((o) => o.paidAt?.startsWith(prefix));
    } catch {
      return [];
    }
  }, []);

  const totalRevenue  = todayOrders.reduce((s, o) => s + o.total, 0);
  const orderCount    = todayOrders.length;
  const avgOrder      = orderCount > 0 ? totalRevenue / orderCount : 0;

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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Revenue" value={fmt(totalRevenue)} sub={`${orderCount} order${orderCount !== 1 ? 's' : ''}`} color="amber" icon="💷" />
        <StatCard label="Orders Processed" value={String(orderCount)} sub={orderCount > 0 ? `avg ${fmt(avgOrder)}` : 'none yet'} color="stone" icon="🧾" />
        <StatCard label="Avg Order Value" value={fmt(avgOrder)} sub="per transaction" color="stone" icon="📊" />
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
  color: 'amber' | 'stone';
  icon: string;
}) {
  return (
    <div className={`rounded-2xl border shadow-sm px-5 py-4 flex items-center gap-4
      ${color === 'amber' ? 'bg-amber-700 border-amber-600 text-white' : 'bg-white border-stone-200'}`}
    >
      <span className="text-3xl">{icon}</span>
      <div>
        <p className={`text-xs font-medium ${color === 'amber' ? 'text-amber-200' : 'text-stone-500'}`}>{label}</p>
        <p className={`text-2xl font-bold mt-0.5 ${color === 'amber' ? 'text-white' : 'text-stone-800'}`}>{value}</p>
        <p className={`text-xs mt-0.5 ${color === 'amber' ? 'text-amber-200' : 'text-stone-400'}`}>{sub}</p>
      </div>
    </div>
  );
}
