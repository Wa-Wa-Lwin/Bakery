import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import type { AuthUser } from '../types/Staff';
import NumPad from '../components/NumPad';
import { appendAudit } from '../data/audit';

/* ── Order data shape passed via router state ────────────────── */
interface CartEntryData {
  id: number;
  categoryId: number;
  name: string;
  price: number;
  is_published: boolean;
  qty: number;
}

interface OrderState {
  orderId: string;
  customerName: string;
  items: { name: string; qty: number; price: number }[];
  subtotal: number;
  vat: number;
  service: number;
  total: number;
  orderType: 'takeaway' | 'eat_in';
  timestamp: string;
  vatRate: number;
  serviceRate: number;
  cartEntries: CartEntryData[];
}

type Method  = 'card' | 'cash' | 'qr';
type Stage   = 'select' | 'processing' | 'done';

const QR_SECS = 300; // 5 minutes

function fmt(n: number) { return `£${n.toFixed(2)}`; }

/* ── Card panel ──────────────────────────────────────────────── */
function CardPanel({ total, onPaid }: { total: number; onPaid: () => void }) {
  const [stage, setStage] = useState<'idle' | 'processing' | 'approved'>('idle');

  function startProcessing() {
    setStage('processing');
    setTimeout(() => {
      setStage('approved');
      setTimeout(onPaid, 1200);
    }, 2000);
  }

  return (
    <div className="flex flex-col items-center gap-6 py-6 px-4">
      {stage === 'idle' && (
        <>
          <div className="w-20 h-20 rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center text-4xl">
            💳
          </div>
          <div className="text-center">
            <p className="text-stone-600 text-sm">Tap, insert, or swipe card</p>
            <p className="text-stone-400 text-xs mt-0.5">Amount: <span className="font-semibold text-stone-700">{fmt(total)}</span></p>
          </div>
          <button
            onClick={startProcessing}
            className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 text-sm transition-colors"
          >
            Simulate Card Tap
          </button>
        </>
      )}
      {stage === 'processing' && (
        <div className="flex flex-col items-center gap-4 py-4">
          <svg className="w-12 h-12 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-stone-600 text-sm font-medium">Processing payment…</p>
          <p className="text-stone-400 text-xs">Please do not remove card</p>
        </div>
      )}
      {stage === 'approved' && (
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-3xl">✓</div>
          <p className="text-emerald-700 font-semibold text-base">Payment Approved</p>
          <p className="text-stone-400 text-xs">{fmt(total)} charged</p>
        </div>
      )}
    </div>
  );
}

/* ── Cash panel — full-screen fixed overlay ──────────────────── */
function CashPanel({ total, onPaid, onClose }: { total: number; onPaid: () => void; onClose: () => void }) {
  const [input, setInput] = useState('');

  function handleChange(v: string) {
    const clean = v.replace(/^0+(\d)/, '$1');
    setInput(clean);
  }

  function applyPreset(offset: number) {
    const target = offset === 0 ? total : total + offset;
    setInput(target.toFixed(2));
  }

  const received  = parseFloat(input) || 0;
  const change    = received - total;
  const canTender = received >= total;

  const presets: { label: string; offset: number }[] = [
    { label: 'Exact', offset: 0  },
    { label: '+£1',   offset: 1  },
    { label: '+£5',   offset: 5  },
    { label: '+£10',  offset: 10 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

        {/* Header */}
        <div className="bg-stone-800 px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-white font-semibold text-sm">💵 Cash Payment</p>
            <p className="text-stone-400 text-xs mt-0.5">Total due: {fmt(total)}</p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-200 transition-colors text-2xl leading-none w-8 h-8 flex items-center justify-center"
          >×</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Amount display */}
          <div className="bg-stone-50 rounded-xl border border-stone-200 px-4 py-3 text-center">
            <p className="text-xs text-stone-400 mb-0.5">Cash received</p>
            <p className="text-3xl font-bold text-stone-800">
              {input === '' ? <span className="text-stone-300">£0.00</span> : `£${input}`}
            </p>
          </div>

          {/* Quick presets */}
          <div className="grid grid-cols-4 gap-2">
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => applyPreset(p.offset)}
                className="rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200
                  text-amber-800 text-xs font-semibold py-2 transition-colors active:scale-95"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* NumPad */}
          <NumPad value={input} onChange={handleChange} decimal maxLength={6} />

          {/* Change */}
          <div className={`rounded-xl px-4 py-3 flex justify-between items-center
            ${canTender ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}
          >
            <span className={`text-sm font-medium ${canTender ? 'text-emerald-700' : 'text-red-600'}`}>
              {canTender ? 'Change due' : 'Amount short'}
            </span>
            <span className={`text-lg font-bold ${canTender ? 'text-emerald-700' : 'text-red-600'}`}>
              {canTender ? fmt(change) : fmt(total - received)}
            </span>
          </div>

          <button
            onClick={onPaid}
            disabled={!canTender}
            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 text-sm
              transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Tender {canTender ? fmt(received) : '—'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── QR panel ────────────────────────────────────────────────── */
function QrPanel({ orderId, total, onPaid }: { orderId: string; total: number; onPaid: () => void }) {
  const [secsLeft, setSecsLeft] = useState(QR_SECS);
  const [expired, setExpired]   = useState(false);
  const [qrRef, setQrRef]       = useState(() => `QR-${Date.now()}`);

  const qrContent = JSON.stringify({
    ref: qrRef,
    orderId,
    amount: total.toFixed(2),
    currency: 'GBP',
    merchant: 'Happy Day Everyday Bakery',
    expires: new Date(Date.now() + secsLeft * 1000).toISOString(),
  });

  useEffect(() => {
    if (expired) return;
    const id = setInterval(() => {
      setSecsLeft((s) => {
        if (s <= 1) { setExpired(true); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [expired]);

  function refresh() {
    setQrRef(`QR-${Date.now()}`);
    setSecsLeft(QR_SECS);
    setExpired(false);
  }

  const mins    = String(Math.floor(secsLeft / 60)).padStart(2, '0');
  const secs    = String(secsLeft % 60).padStart(2, '0');
  const urgency = secsLeft <= 30;

  return (
    <div className="flex flex-col items-center gap-5 py-4 px-4">
      <div className="relative">
        <div className={`p-4 bg-white rounded-2xl shadow border border-stone-200 transition-opacity ${expired ? 'opacity-30' : ''}`}>
          <QRCodeSVG value={qrContent} size={200} />
        </div>
        {expired && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <span className="text-3xl">⏰</span>
            <p className="text-sm font-semibold text-stone-700 bg-white/90 px-3 py-1 rounded-lg">QR Expired</p>
          </div>
        )}
      </div>

      {!expired ? (
        <div className="text-center">
          <p className="text-stone-500 text-xs">Scan with your banking app</p>
          <p className="text-stone-700 text-xs mt-0.5 font-medium">Amount: {fmt(total)}</p>
          <p className={`text-lg font-bold mt-2 tabular-nums ${urgency ? 'text-red-600 animate-pulse' : 'text-stone-600'}`}>
            {mins}:{secs}
          </p>
          <p className="text-xs text-stone-400">remaining</p>
        </div>
      ) : (
        <button
          onClick={refresh}
          className="rounded-xl bg-stone-700 hover:bg-stone-800 text-white text-sm font-semibold px-6 py-2.5 transition-colors"
        >
          Generate New QR
        </button>
      )}

      {!expired && (
        <button
          onClick={onPaid}
          className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 text-sm transition-colors"
        >
          Simulate Payment Received
        </button>
      )}
    </div>
  );
}

/* ── PaymentPage ─────────────────────────────────────────────── */
interface Props { user: AuthUser; onLogout: () => void }

export default function PaymentPage({ user, onLogout }: Props) {
  const navigate = useNavigate();
  const location  = useLocation();
  const order     = location.state as OrderState | null;

  const [method, setMethod]           = useState<Method | null>(null);
  const [stage, setStage]             = useState<Stage>('select');
  const [showCashOverlay, setShowCashOverlay] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Guard: if no order in state, go back
  if (!order) {
    navigate('/catering', { replace: true });
    return null;
  }

  function handlePaid() {
    const paidAt    = new Date().toISOString();
    const completed = { ...order, paymentMethod: method, paidAt };
    const existing: unknown[] = JSON.parse(localStorage.getItem('bakery_orders') ?? '[]');
    localStorage.setItem('bakery_orders', JSON.stringify([...existing, completed]));
    appendAudit(user, 'Payment completed',
      `Order ${order.orderId} · ${order.customerName} · ${fmt(order.total)} · ${method}`);
    setShowCashOverlay(false);
    setStage('done');
  }

  function handleNewOrder() {
    navigate('/catering', { replace: true });
  }

  function handleHoldOrder() {
    const held = {
      id: `HOLD-${Date.now()}`,
      customerName: order.customerName,
      cart: order.cartEntries.map((e) => ({
        item: { id: e.id, categoryId: e.categoryId, name: e.name, price: e.price, is_published: e.is_published },
        qty: e.qty,
      })),
      orderType: order.orderType,
      heldAt: new Date().toISOString(),
      heldBy: user.full_name,
    };
    const existing: unknown[] = JSON.parse(localStorage.getItem('bakery_held_orders') ?? '[]');
    localStorage.setItem('bakery_held_orders', JSON.stringify([held, ...existing]));
    navigate('/catering', { replace: true });
  }

  function selectMethod(m: Method) {
    setMethod(m);
    if (m === 'cash') setShowCashOverlay(true);
  }

  const methodLabels: Record<Method, string> = {
    card: '💳 Card',
    cash: '💵 Cash',
    qr:   '📱 QR Code',
  };

  return (
    <div className="flex flex-col h-screen bg-stone-100">

      {/* ── Header ── */}
      <header className="bg-stone-800 shrink-0">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-xl shrink-0">🥐</div>
            <div>
              <h1 className="text-base font-bold text-white leading-snug">Happy Day Everyday Bakery</h1>
              <p className="text-stone-400 text-xs">Payment</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-stone-300 text-sm">{user.full_name}</span>
            <button onClick={onLogout} className="text-sm text-amber-400 hover:text-amber-300 transition-colors">Sign Out</button>
          </div>
        </div>
        <div className="h-0.5 bg-gradient-to-r from-amber-700 via-amber-400 to-amber-700" />
      </header>

      {/* ── Cancel dialog ── */}
      {showCancelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-6">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="bg-stone-800 px-5 py-4">
              <p className="text-white font-semibold text-sm">Cancel this order?</p>
              <p className="text-stone-400 text-xs mt-0.5">{order.customerName} · {order.orderId}</p>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-stone-600">Would you like to hold the order or cancel it entirely?</p>
              <button
                onClick={handleHoldOrder}
                className="w-full rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold py-3 text-sm transition-colors"
              >
                ⏸ Hold Order — resume later
              </button>
              <button
                onClick={handleNewOrder}
                className="w-full rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold py-3 text-sm transition-colors"
              >
                Cancel Order — discard
              </button>
              <button
                onClick={() => setShowCancelDialog(false)}
                className="w-full text-sm text-stone-400 hover:text-stone-600 py-2 transition-colors"
              >
                Keep going with payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cash overlay ── */}
      {showCashOverlay && (
        <CashPanel
          total={order.total}
          onPaid={handlePaid}
          onClose={() => { setShowCashOverlay(false); setMethod(null); }}
        />
      )}

      {/* ── Content ── */}
      {stage === 'done' ? (
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 w-full max-w-sm overflow-hidden">
            <div className="bg-emerald-600 px-6 py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500 border-2 border-emerald-400 flex items-center justify-center text-3xl mx-auto mb-3">
                ✓
              </div>
              <h2 className="text-white font-bold text-xl">Payment Complete</h2>
              <p className="text-emerald-100 text-sm mt-1">{methodLabels[method!]} · {fmt(order.total)}</p>
            </div>
            <div className="p-6 space-y-3">
              <div className="bg-stone-50 rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-600 space-y-1">
                <div className="flex justify-between"><span>Customer</span><span className="font-medium text-stone-800">{order.customerName}</span></div>
                <div className="flex justify-between"><span>Order</span><span className="font-mono text-xs text-stone-500">{order.orderId}</span></div>
                <div className="flex justify-between"><span>Type</span><span className="capitalize">{order.orderType.replace('_', ' ')}</span></div>
              </div>
              <button
                onClick={handleNewOrder}
                className="w-full rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold py-3 text-sm transition-colors"
              >
                New Order
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

            {/* ── Order summary ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
              <div className="bg-stone-800 px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold text-sm">{order.customerName}</p>
                  <p className="text-stone-400 text-xs">{order.orderId} · {order.orderType === 'eat_in' ? 'Eat In' : 'Takeaway'}</p>
                </div>
                <span className="text-amber-400 text-xl font-bold">{fmt(order.total)}</span>
              </div>
              <div className="px-5 py-3 space-y-1">
                {order.items.map((it, i) => (
                  <div key={i} className="flex justify-between text-xs text-stone-600">
                    <span>{it.name} × {it.qty}</span>
                    <span>{fmt(it.price * it.qty)}</span>
                  </div>
                ))}
                <div className="border-t border-stone-100 mt-2 pt-2 space-y-0.5">
                  <div className="flex justify-between text-xs text-stone-400">
                    <span>Subtotal</span><span>{fmt(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-stone-400">
                    <span>VAT ({(order.vatRate * 100).toFixed(0)}%)</span><span>{fmt(order.vat)}</span>
                  </div>
                  {order.service > 0 && (
                    <div className="flex justify-between text-xs text-stone-400">
                      <span>Service ({(order.serviceRate * 100).toFixed(0)}%)</span><span>{fmt(order.service)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-stone-800 pt-1">
                    <span>Total</span><span className="text-amber-700">{fmt(order.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Payment method selector ── */}
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Payment Method</p>
              <div className="grid grid-cols-3 gap-3">
                {(['card', 'cash', 'qr'] as Method[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => selectMethod(m)}
                    className={`rounded-xl border py-4 flex flex-col items-center gap-2 transition-all
                      ${method === m
                        ? 'bg-amber-700 border-amber-700 text-white shadow-sm'
                        : 'bg-white border-stone-200 text-stone-600 hover:border-amber-300'
                      }`}
                  >
                    <span className="text-2xl">{m === 'card' ? '💳' : m === 'cash' ? '💵' : '📱'}</span>
                    <span className="text-xs font-semibold capitalize">{m === 'qr' ? 'QR Code' : m}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Active payment panel (card / QR only — cash uses overlay) ── */}
            {method && method !== 'cash' && (
              <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                <div className="bg-stone-50 border-b border-stone-200 px-5 py-3">
                  <p className="text-sm font-semibold text-stone-700">{methodLabels[method]}</p>
                </div>
                {method === 'card' && <CardPanel total={order.total} onPaid={handlePaid} />}
                {method === 'qr'   && <QrPanel orderId={order.orderId} total={order.total} onPaid={handlePaid} />}
              </div>
            )}

            {/* Re-open cash overlay if method is cash but overlay was dismissed */}
            {method === 'cash' && !showCashOverlay && (
              <button
                onClick={() => setShowCashOverlay(true)}
                className="w-full rounded-xl bg-stone-700 hover:bg-stone-800 text-white font-semibold py-3 text-sm transition-colors"
              >
                Open Cash Keypad
              </button>
            )}

            {/* Cancel */}
            <button
              onClick={() => setShowCancelDialog(true)}
              className="w-full text-sm text-stone-400 hover:text-stone-600 py-2 transition-colors"
            >
              ← Back / Cancel order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
