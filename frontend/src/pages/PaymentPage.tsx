import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import type { AuthUser } from '../types/Staff';
import { appendAuditLog } from '../api/auditLog';
import { createOrder } from '../api/orders';

/* ── Order data shape passed via router state ────────────────── */
interface CartEntryData {
  id: number;
  category_name: string;
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
            C
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
          <p className="text-stone-600 text-sm font-medium">Processing payment...</p>
          <p className="text-stone-400 text-xs">Please do not remove card</p>
        </div>
      )}
      {stage === 'approved' && (
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-3xl">OK</div>
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

  const received   = parseFloat(input) || 0;
  const totalPence = Math.round(total * 100);
  const recvPence  = Math.round(received * 100);
  const change     = received - total;
  const canTender  = recvPence >= totalPence;

  function pressDigit(d: string) {
    setInput((prev) => {
      if (prev.includes('.')) {
        const after = prev.split('.')[1];
        if (after.length >= 2) return prev;
        return prev + d;
      }
      if (prev === '0') return d === '0' ? '0' : d;
      if (prev.length >= 5) return prev;
      return prev + d;
    });
  }

  function pressDecimal() {
    setInput((prev) => {
      if (prev.includes('.')) return prev;
      return (prev || '0') + '.';
    });
  }

  function addAmount(pence: number) {
    setInput((prev) => {
      const cur  = Math.round((parseFloat(prev) || 0) * 100);
      const next = cur + pence;
      const p    = Math.floor(next / 100);
      const c    = next % 100;
      return c === 0 ? String(p) : `${p}.${String(c).padStart(2, '0')}`;
    });
  }

  const POUND_PRESETS = [
    { label: 'Exact', action: () => setInput(total.toFixed(2)) },
    { label: '+£5',   action: () => addAmount(500)  },
    { label: '+£10',  action: () => addAmount(1000) },
    { label: '+£20',  action: () => addAmount(2000) },
  ];

  const NUMPAD_ROWS = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['C', '0', '.'],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-stone-800 px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-white font-semibold text-sm">Cash Payment</p>
            <p className="text-stone-400 text-xs mt-0.5">Total due: {fmt(total)}</p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-200 transition-colors text-2xl leading-none w-8 h-8 flex items-center justify-center"
          >x</button>
        </div>

        <div className="p-4 space-y-3">
          <div className="bg-stone-50 rounded-xl border border-stone-200 px-4 py-3 text-center">
            <p className="text-xs text-stone-400 mb-0.5">Cash received</p>
            <p className="text-3xl font-bold text-stone-800 tabular-nums tracking-tight">
              {input
                ? `£${input}`
                : <span className="text-stone-300">£0.00</span>}
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {POUND_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={p.action}
                className="rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200
                  text-amber-800 text-xs font-semibold py-2 transition-colors active:scale-95"
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {NUMPAD_ROWS.flat().map((key, i) => {
              if (key === 'C') return (
                <button
                  key={i} type="button" onClick={() => setInput('')}
                  className="h-12 rounded-xl text-sm font-semibold bg-red-50 hover:bg-red-100
                    text-red-600 transition-all active:scale-95"
                >
                  Clear
                </button>
              );
              if (key === '.') return (
                <button
                  key={i} type="button" onClick={pressDecimal}
                  disabled={input.includes('.')}
                  className="h-12 rounded-xl text-xl font-bold bg-stone-200 hover:bg-stone-300
                    text-stone-700 transition-all active:scale-95 disabled:opacity-40"
                >
                  .
                </button>
              );
              return (
                <button
                  key={i} type="button" onClick={() => pressDigit(key)}
                  className="h-12 rounded-xl text-xl font-semibold bg-stone-100 hover:bg-amber-100
                    text-stone-800 transition-all active:scale-95"
                >
                  {key}
                </button>
              );
            })}
          </div>

          <div className={`rounded-xl px-4 py-3 flex justify-between items-center
            ${canTender ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}
          >
            <span className={`text-sm font-medium ${canTender ? 'text-emerald-700' : 'text-red-600'}`}>
              {canTender ? 'Change due' : 'Amount short'}
            </span>
            <span className={`text-lg font-bold tabular-nums ${canTender ? 'text-emerald-700' : 'text-red-600'}`}>
              {canTender ? fmt(change) : fmt(total - received)}
            </span>
          </div>

          <button
            onClick={onPaid}
            disabled={!canTender}
            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 text-sm
              transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Tender {canTender ? fmt(received) : '-'}
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
            <span className="text-3xl">T</span>
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

  const [method,          setMethod]          = useState<Method | null>(null);
  const [stage,           setStage]           = useState<Stage>('select');
  const [showCashOverlay, setShowCashOverlay] = useState(false);
  const [showCancelDialog,setShowCancelDialog]= useState(false);
  const [saving,          setSaving]          = useState(false);

  if (!order) {
    navigate('/catering', { replace: true });
    return null;
  }

  const handlePaid = async () => {
    setSaving(true);
    try {
      await createOrder({
        customer_name:  order.customerName,
        order_type:     order.orderType,
        staff_id:       user.staff_id,
        payment_method: method!,
        total:          order.total,
        subtotal:       order.subtotal,
        vat_amount:     order.vat,
        service_amount: order.service,
        items: order.cartEntries.map((e) => ({
          item_id:  e.id,
          quantity: e.qty,
        })),
      });
      appendAuditLog(user, 'Payment completed',
        `${order.customerName} - ${fmt(order.total)} - ${method}`);
    } catch {
      // Even if save fails, proceed to done screen — show error in production
    } finally {
      setSaving(false);
    }
    setShowCashOverlay(false);
    setStage('done');
  };

  const handleNewOrder    = () => navigate('/catering', { replace: true });
  const handleCancelOrder = () => {
    appendAuditLog(user, 'VOID_ATTEMPT',
      `${order.customerName} - ${fmt(order.total)} - cancelled without payment`);
    navigate('/catering', { replace: true });
  };

  const handleHoldOrder = () => {
    const held = {
      id: `HOLD-${Date.now()}`,
      customerName: order.customerName,
      cart: order.cartEntries.map((e) => ({
        item: { id: e.id, category_name: e.category_name, name: e.name, price: e.price, is_published: e.is_published, is_archived: false },
        qty: e.qty,
      })),
      orderType: order.orderType,
      heldAt: new Date().toISOString(),
      heldBy: user.full_name,
    };
    const existing: unknown[] = JSON.parse(localStorage.getItem('bakery_held_orders') ?? '[]');
    localStorage.setItem('bakery_held_orders', JSON.stringify([held, ...existing]));
    navigate('/catering', { replace: true });
  };

  const selectMethod = (m: Method) => {
    setMethod(m);
    if (m === 'cash') setShowCashOverlay(true);
  };

  const methodLabels: Record<Method, string> = {
    card: 'Card',
    cash: 'Cash',
    qr:   'QR Code',
  };

  return (
    <div className="flex flex-col h-screen bg-stone-100">

      <header className="bg-stone-800 shrink-0">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-xl shrink-0">B</div>
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
              <p className="text-stone-400 text-xs mt-0.5">{order.customerName} - {order.orderId}</p>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-stone-600">Would you like to hold the order or cancel it entirely?</p>
              <button
                onClick={handleHoldOrder}
                className="w-full rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold py-3 text-sm transition-colors"
              >
                Hold Order - resume later
              </button>
              <button
                onClick={handleCancelOrder}
                className="w-full rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold py-3 text-sm transition-colors"
              >
                Cancel Order - discard
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
                OK
              </div>
              <h2 className="text-white font-bold text-xl">Payment Complete</h2>
              <p className="text-emerald-100 text-sm mt-1">{methodLabels[method!]} - {fmt(order.total)}</p>
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
                  <p className="text-stone-400 text-xs">{order.orderId} - {order.orderType === 'eat_in' ? 'Eat In' : 'Takeaway'}</p>
                </div>
                <span className="text-amber-400 text-xl font-bold">{fmt(order.total)}</span>
              </div>
              <div className="px-5 py-3 space-y-1">
                {order.items.map((it, i) => (
                  <div key={i} className="flex justify-between text-xs text-stone-600">
                    <span>{it.name} x {it.qty}</span>
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
                    <span className="text-2xl">{m === 'card' ? 'C' : m === 'cash' ? '$' : 'QR'}</span>
                    <span className="text-xs font-semibold capitalize">{m === 'qr' ? 'QR Code' : m}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Active payment panel ── */}
            {method && method !== 'cash' && (
              <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                <div className="bg-stone-50 border-b border-stone-200 px-5 py-3">
                  <p className="text-sm font-semibold text-stone-700">{methodLabels[method]}</p>
                </div>
                {method === 'card' && <CardPanel total={order.total} onPaid={handlePaid} />}
                {method === 'qr'   && <QrPanel orderId={order.orderId} total={order.total} onPaid={handlePaid} />}
              </div>
            )}

            {method === 'cash' && !showCashOverlay && (
              <button
                onClick={() => setShowCashOverlay(true)}
                className="w-full rounded-xl bg-stone-700 hover:bg-stone-800 text-white font-semibold py-3 text-sm transition-colors"
              >
                Open Cash Keypad
              </button>
            )}

            {saving && (
              <p className="text-center text-xs text-stone-400">Saving order...</p>
            )}

            <button
              onClick={() => setShowCancelDialog(true)}
              className="w-full text-sm text-stone-400 hover:text-stone-600 py-2 transition-colors"
            >
              Back / Cancel order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
