import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AuthUser } from '../types/Staff';
import NumPad from '../components/NumPad';
import { loadRates, getCategoryIcon } from '../data/menu';
import type { MenuItem } from '../data/menu';
import { getMenuItems } from '../api/menu';

/* ── Data types ──────────────────────────────────────────────── */
interface CartEntry { item: MenuItem; qty: number; deletedAt?: string }

interface HeldOrder {
  id: string;
  customerName: string | null;
  cart: CartEntry[];
  orderType: 'takeaway' | 'eat_in' | null;
  heldAt: string;
  heldBy: string;
}

const HELD_KEY = 'bakery_held_orders';

function loadHeld(): HeldOrder[] {
  try {
    const raw = localStorage.getItem(HELD_KEY);
    if (raw) return JSON.parse(raw) as HeldOrder[];
  } catch { /* fallthrough */ }
  return [];
}
function saveHeld(orders: HeldOrder[]) {
  localStorage.setItem(HELD_KEY, JSON.stringify(orders));
}

function fmt(n: number) { return `£${n.toFixed(2)}`; }

/* ── Icons ───────────────────────────────────────────────────── */
function XIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/* ── Qty direct-entry modal ──────────────────────────────────── */
function QtyModal({ current, itemName, onConfirm, onCancel }: {
  current: number;
  itemName: string;
  onConfirm: (qty: number) => void;
  onCancel: () => void;
}) {
  const [input, setInput] = useState(String(current));

  function handleChange(v: string) {
    const clean = v.replace(/^0+(\d)/, '$1');
    setInput(clean);
  }

  const parsed = parseInt(input) || 0;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-6">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs overflow-hidden">
        <div className="bg-stone-800 px-5 py-4 text-center">
          <p className="text-white font-semibold text-sm truncate">{itemName}</p>
          <p className="text-stone-400 text-xs mt-0.5">Set quantity</p>
        </div>
        <div className="p-5 space-y-4">
          <div className="text-center text-4xl font-bold text-stone-800 h-14 flex items-center justify-center
            bg-stone-50 rounded-xl border border-stone-200">
            {input === '' ? <span className="text-stone-300">0</span> : input}
          </div>
          <NumPad value={input} onChange={handleChange} maxLength={2} />
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 rounded-xl border border-stone-200 py-2.5 text-sm font-medium text-stone-600
                hover:bg-stone-50 transition"
            >Cancel</button>
            <button
              onClick={() => onConfirm(parsed)}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition
                ${parsed === 0
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-amber-700 hover:bg-amber-800'
                }`}
            >
              {parsed === 0 ? 'Remove' : `Set ${parsed}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Swipeable cart row ──────────────────────────────────────── */
function CartRow({ entry, onRemove, onQtyChange, onSetQty }: {
  entry: CartEntry;
  onRemove: () => void;
  onQtyChange: (delta: number) => void;
  onSetQty: (qty: number) => void;
}) {
  const DELETE_W    = 72;
  const rowRef      = useRef<HTMLDivElement>(null);
  const revealed    = useRef(false);
  const touchStartX = useRef(0);
  const [showQtyModal, setShowQtyModal] = useState(false);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    if (rowRef.current) rowRef.current.style.transition = 'none';
  }

  function handleTouchMove(e: React.TouchEvent) {
    const delta     = e.touches[0].clientX - touchStartX.current;
    const base      = revealed.current ? -DELETE_W : 0;
    const newOffset = Math.max(-DELETE_W, Math.min(0, base + delta));
    if (rowRef.current) rowRef.current.style.transform = `translateX(${newOffset}px)`;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const delta  = e.changedTouches[0].clientX - touchStartX.current;
    const base   = revealed.current ? -DELETE_W : 0;
    const final  = base + delta;
    const snap   = final < -(DELETE_W / 2) ? -DELETE_W : 0;
    revealed.current = snap < 0;
    if (rowRef.current) {
      rowRef.current.style.transition = 'transform 0.2s ease';
      rowRef.current.style.transform  = `translateX(${snap}px)`;
    }
  }

  function handleRemove() {
    revealed.current = false;
    if (rowRef.current) {
      rowRef.current.style.transition = 'transform 0.2s ease';
      rowRef.current.style.transform  = 'translateX(0)';
    }
    onRemove();
  }

  return (
    <>
      <div className="relative overflow-hidden group">
        <button
          onClick={handleRemove}
          className="absolute inset-y-0 right-0 w-[72px] bg-red-500 hover:bg-red-600 text-white
            flex flex-col items-center justify-center gap-0.5 transition-colors"
        >
          <XIcon />
          <span className="text-xs font-medium">Remove</span>
        </button>

        <div
          ref={rowRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative bg-white flex items-center gap-2 px-3 py-2.5 border-b border-stone-100"
          style={{ transform: 'translateX(0)' }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-stone-800 leading-snug truncate">{entry.item.name}</p>
            <p className="text-xs text-stone-400">{fmt(entry.item.price)} each</p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onQtyChange(-1)}
              className="w-6 h-6 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold text-sm
                flex items-center justify-center transition-colors"
            >-</button>
            <button
              onClick={() => setShowQtyModal(true)}
              className="text-sm font-semibold text-stone-800 w-7 h-7 rounded-lg bg-stone-50 border border-stone-200
                flex items-center justify-center hover:bg-amber-50 hover:border-amber-300 transition-colors"
            >{entry.qty}</button>
            <button
              onClick={() => onQtyChange(1)}
              className="w-6 h-6 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-700 font-bold text-sm
                flex items-center justify-center transition-colors"
            >+</button>
          </div>

          <span className="text-sm font-semibold text-stone-700 w-14 text-right shrink-0">
            {fmt(entry.item.price * entry.qty)}
          </span>

          <button
            onClick={handleRemove}
            className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-400 transition-opacity shrink-0"
            title="Remove"
          >
            <XIcon />
          </button>
        </div>
      </div>

      {showQtyModal && (
        <QtyModal
          current={entry.qty}
          itemName={entry.item.name}
          onConfirm={(qty) => {
            setShowQtyModal(false);
            onSetQty(qty);
          }}
          onCancel={() => setShowQtyModal(false)}
        />
      )}
    </>
  );
}

/* ── Customer name modal with QWERTY keyboard ────────────────── */
const QWERTY_ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['S','Z','X','C','V','B','N','M','B'],
];

function CustomerNameModal({ onConfirm, onCancel }: {
  onConfirm: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setCurName] = useState('');
  const [caps, setCaps]    = useState(true);

  function pressKey(key: string) {
    if (key === 'S' && QWERTY_ROWS[2][0] === key) { setCaps((c) => !c); return; }
    if (key === 'B' && QWERTY_ROWS[2][8] === key) {
      setCurName((n) => {
        const next = n.slice(0, -1);
        setCaps(next === '' || next.endsWith(' '));
        return next;
      });
      return;
    }
    const char = caps ? key.toUpperCase() : key.toLowerCase();
    setCurName((n) => n + char);
    setCaps(false);
  }

  function pressSpace() {
    setCurName((n) => n + ' ');
    setCaps(true);
  }

  const ROWS = [
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L'],
    ['Z','X','C','V','B','N','M'],
  ];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="bg-amber-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-600 border-2 border-amber-500 flex items-center justify-center text-xl">
              C
            </div>
            <div>
              <h3 className="text-white font-semibold text-base">Customer Name</h3>
              <p className="text-amber-200 text-xs">For order identification</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-amber-300 hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center">x</button>
        </div>

        <div className="p-4 space-y-3">
          <div className="bg-stone-50 rounded-xl border border-stone-200 px-4 py-3 min-h-[52px] flex items-center">
            <span className={`text-xl font-medium tracking-wide flex-1 ${name ? 'text-stone-800' : 'text-stone-300'}`}>
              {name || 'Enter customer name...'}
            </span>
            {caps && (
              <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-md shrink-0">CAPS</span>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="grid grid-cols-10 gap-1">
              {ROWS[0].map((k) => (
                <button
                  key={k} type="button" onClick={() => pressKey(k)}
                  className="h-11 rounded-lg bg-stone-100 hover:bg-amber-100 text-stone-800 font-semibold text-sm
                    transition-all active:scale-95 select-none"
                >
                  {caps ? k : k.toLowerCase()}
                </button>
              ))}
            </div>

            <div className="flex justify-center gap-1">
              {ROWS[1].map((k) => (
                <button
                  key={k} type="button" onClick={() => pressKey(k)}
                  className="w-[9.5%] min-w-[36px] h-11 rounded-lg bg-stone-100 hover:bg-amber-100 text-stone-800
                    font-semibold text-sm transition-all active:scale-95 select-none"
                >
                  {caps ? k : k.toLowerCase()}
                </button>
              ))}
            </div>

            <div className="flex gap-1">
              <button
                type="button" onClick={() => setCaps((c) => !c)}
                className={`flex-[1.5] h-11 rounded-lg font-semibold text-sm transition-all active:scale-95 select-none
                  ${caps ? 'bg-amber-500 text-white' : 'bg-stone-200 hover:bg-stone-300 text-stone-600'}`}
              >
                Shift
              </button>
              {ROWS[2].map((k) => (
                <button
                  key={k} type="button" onClick={() => pressKey(k)}
                  className="flex-1 h-11 rounded-lg bg-stone-100 hover:bg-amber-100 text-stone-800
                    font-semibold text-sm transition-all active:scale-95 select-none"
                >
                  {caps ? k : k.toLowerCase()}
                </button>
              ))}
              <button
                type="button" onClick={() => {
                  setCurName((n) => {
                    const next = n.slice(0, -1);
                    setCaps(next === '' || next.endsWith(' '));
                    return next;
                  });
                }}
                className="flex-[1.5] h-11 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-600
                  font-semibold text-xl transition-all active:scale-95 select-none"
              >
                Del
              </button>
            </div>

            <div className="flex gap-1">
              <button
                type="button" onClick={pressSpace}
                className="flex-1 h-11 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-500
                  text-sm font-medium transition-all active:scale-95 select-none"
              >
                SPACE
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={onCancel}
              className="flex-1 rounded-xl border border-stone-200 px-4 py-3 text-sm font-medium
                text-stone-600 hover:bg-stone-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => { if (name.trim()) onConfirm(name.trim()); }}
              disabled={!name.trim()}
              className="flex-[2] rounded-xl bg-amber-700 hover:bg-amber-800 px-4 py-3 text-sm font-semibold
                text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main CateringPage ───────────────────────────────────────── */
interface Props { user: AuthUser; onLogout: () => void }

export default function CateringPage({ user, onLogout }: Props) {
  const navigate = useNavigate();

  const [menuItems,      setMenuItems]      = useState<MenuItem[]>([]);
  const [categories,     setCategories]     = useState<string[]>([]);
  const [vatRate,        setVatRate]        = useState(0.20);
  const [serviceRate,    setServiceRate]    = useState(0.10);
  const [selectedCat,    setSelectedCat]    = useState<string | null>(null);
  const [cart,           setCart]           = useState<CartEntry[]>([]);
  const [orderType,      setOrderType]      = useState<'takeaway' | 'eat_in' | null>(null);
  const [showModal,      setShowModal]      = useState(false);
  const [heldOrders,     setHeldOrders]     = useState<HeldOrder[]>(loadHeld);
  const [heldOpen,       setHeldOpen]       = useState(false);
  const [undoItem,       setUndoItem]       = useState<CartEntry | null>(null);
  const undoTimeout                         = useRef<number | null>(null);

  const activeCart = cart.filter((e) => !e.deletedAt);

  useEffect(() => {
    getMenuItems().then((items) => {
      setMenuItems(items);
      const cats = [...new Set(items.map((m) => m.category_name))].sort();
      setCategories(cats);
    });
    const rates = loadRates();
    setVatRate(rates.vat);
    setServiceRate(rates.service);
  }, []);

  const items = selectedCat
    ? menuItems.filter((m) => m.category_name === selectedCat && !m.is_archived)
    : [];

  function addToCart(item: MenuItem) {
    if (!item.is_published) return;
    setCart((prev) => {
      const existing = prev.find((e) => e.item.id === item.id && !e.deletedAt);
      if (existing) return prev.map((e) => e.item.id === item.id && !e.deletedAt ? { ...e, qty: e.qty + 1 } : e);
      return [...prev, { item, qty: 1 }];
    });
  }

  function removeFromCart(itemId: number) {
    const entry = activeCart.find((e) => e.item.id === itemId);
    if (!entry) return;
    const ts = new Date().toISOString();
    setCart((prev) => prev.map((e) =>
      e.item.id === itemId && !e.deletedAt ? { ...e, deletedAt: ts } : e,
    ));
    setUndoItem({ ...entry, deletedAt: ts });
    if (undoTimeout.current !== null) window.clearTimeout(undoTimeout.current);
    undoTimeout.current = window.setTimeout(() => setUndoItem(null), 3000);
  }

  function undoRemove() {
    if (!undoItem) return;
    setCart((prev) => prev.map((e) =>
      e.item.id === undoItem.item.id && e.deletedAt === undoItem.deletedAt
        ? { ...e, deletedAt: undefined }
        : e,
    ));
    setUndoItem(null);
    if (undoTimeout.current !== null) window.clearTimeout(undoTimeout.current);
  }

  function updateQty(itemId: number, delta: number) {
    const entry = activeCart.find((e) => e.item.id === itemId);
    if (!entry) return;
    const newQty = entry.qty + delta;
    if (newQty <= 0) { removeFromCart(itemId); return; }
    setCart((prev) => prev.map((e) => e.item.id === itemId && !e.deletedAt ? { ...e, qty: newQty } : e));
  }

  function setQty(itemId: number, qty: number) {
    if (qty <= 0) {
      removeFromCart(itemId);
    } else {
      setCart((prev) => prev.map((e) => e.item.id === itemId && !e.deletedAt ? { ...e, qty } : e));
    }
  }

  function holdOrder() {
    if (activeCart.length === 0) return;
    const held: HeldOrder = {
      id: `HOLD-${Date.now()}`,
      customerName: null,
      cart: [...activeCart],
      orderType,
      heldAt: new Date().toISOString(),
      heldBy: user.full_name,
    };
    const updated = [held, ...heldOrders];
    saveHeld(updated);
    setHeldOrders(updated);
    setCart([]);
    setOrderType(null);
    setHeldOpen(true);
  }

  function resumeHeld(held: HeldOrder) {
    if (cart.length > 0 && !window.confirm('This will replace your current cart. Continue?')) return;
    setCart(held.cart);
    setOrderType(held.orderType);
    const updated = heldOrders.filter((h) => h.id !== held.id);
    saveHeld(updated);
    setHeldOrders(updated);
    setHeldOpen(false);
  }

  function deleteHeld(id: string) {
    const updated = heldOrders.filter((h) => h.id !== id);
    saveHeld(updated);
    setHeldOrders(updated);
  }

  function handleConfirmOrder(customerName: string) {
    const subtotal = activeCart.reduce((s, e) => s + e.item.price * e.qty, 0);
    const vat      = subtotal * vatRate;
    const service  = orderType === 'eat_in' ? subtotal * serviceRate : 0;
    const total    = subtotal + vat + service;

    setShowModal(false);
    navigate('/payment', {
      state: {
        orderId: `ORD-${Date.now()}`,
        customerName,
        items: activeCart.map((e) => ({ name: e.item.name, qty: e.qty, price: e.item.price })),
        subtotal, vat, service, total,
        orderType,
        timestamp: new Date().toISOString(),
        vatRate,
        serviceRate,
        cartEntries: activeCart.map((e) => ({
          id:            e.item.id,
          category_name: e.item.category_name,
          name:          e.item.name,
          price:         e.item.price,
          is_published:  e.item.is_published,
          qty:           e.qty,
        })),
      },
    });
  }

  const subtotal = activeCart.reduce((s, e) => s + e.item.price * e.qty, 0);
  const vat      = subtotal * vatRate;
  const service  = orderType === 'eat_in' ? subtotal * serviceRate : 0;
  const total    = subtotal + vat + service;

  return (
    <div className="flex flex-col h-screen bg-stone-100">

      {/* ── Header ── */}
      <header className="bg-stone-800 shrink-0">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-xl shrink-0 shadow-inner">B</div>
            <div>
              <h1 className="text-base font-bold text-white leading-snug">Happy Day Everyday Bakery</h1>
              <p className="text-stone-400 text-xs">Catering Orders</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-stone-300 text-sm">{user.full_name}</span>
            {user.role_name !== 'Staff' && (
              <button
                onClick={() => navigate('/home')}
                className="text-sm text-stone-400 hover:text-stone-200 transition-colors"
              >
                Home
              </button>
            )}
            <button onClick={onLogout} className="text-sm text-amber-400 hover:text-amber-300 transition-colors">Sign Out</button>
          </div>
        </div>
        <div className="h-0.5 bg-gradient-to-r from-amber-700 via-amber-400 to-amber-700" />
      </header>

      {/* ── Three-panel layout ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Category sidebar ── */}
        <aside className="w-36 bg-stone-800 shrink-0 overflow-y-auto flex flex-col">

          {heldOrders.length > 0 && (
            <div className="border-b border-stone-700">
              <button
                onClick={() => setHeldOpen((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-stone-700 transition-colors"
              >
                <span className="text-xs font-semibold text-amber-400">On Hold</span>
                <span className="bg-amber-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {heldOrders.length}
                </span>
              </button>
              {heldOpen && (
                <div className="bg-stone-900 py-1">
                  {heldOrders.map((h) => (
                    <div key={h.id} className="px-2 py-2 border-b border-stone-700/50 last:border-0">
                      <p className="text-xs font-medium text-stone-200 truncate">
                        {h.customerName ? `Customer: ${h.customerName}` : 'Unnamed'}
                      </p>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {new Date(h.heldAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <div className="flex gap-1 mt-1.5">
                        <button
                          onClick={() => resumeHeld(h)}
                          className="flex-1 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-md py-1 font-medium transition-colors"
                        >Resume</button>
                        <button
                          onClick={() => deleteHeld(h.id)}
                          className="text-xs bg-stone-700 hover:bg-red-600 text-stone-300 hover:text-white rounded-md px-1.5 py-1 transition-colors"
                        >x</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Categories */}
          <div className="flex flex-col gap-1 p-2 flex-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={`flex flex-col items-center gap-1 rounded-xl px-2 py-3 text-center transition-colors
                  ${selectedCat === cat
                    ? 'bg-amber-500 text-white'
                    : 'text-stone-400 hover:bg-stone-700 hover:text-stone-200'
                  }`}
              >
                <span className="text-2xl">{getCategoryIcon(cat)}</span>
                <span className="text-xs font-medium leading-tight">{cat}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* ── Items grid ── */}
        <main className="flex-1 overflow-y-auto p-4">
          {selectedCat === null ? (
            <div className="h-full flex flex-col items-center justify-center text-stone-400 gap-3 select-none">
              <span className="text-5xl">👈</span>
              <p className="text-sm font-medium text-stone-500">Select a category to view items</p>
            </div>
          ) : (
            <>
              <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">
                {selectedCat}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {items.map((item) => {
                  const inCart      = activeCart.find((e) => e.item.id === item.id);
                  const unavailable = !item.is_published;
                  return (
                    <button
                      key={item.id}
                      onClick={() => addToCart(item)}
                      disabled={unavailable}
                      className={`relative rounded-xl border text-left p-3 transition-all active:scale-95
                        ${unavailable
                          ? 'bg-stone-100 border-stone-200 opacity-50 cursor-not-allowed'
                          : inCart
                            ? 'bg-amber-50 border-amber-300 shadow-sm'
                            : 'bg-white border-stone-200 hover:border-amber-300 hover:shadow-sm'
                        }`}
                    >
                      {unavailable && (
                        <span className="absolute top-2 right-2 text-[9px] font-semibold text-stone-400 bg-stone-200
                          px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                          Unavail.
                        </span>
                      )}
                      {inCart && !unavailable && (
                        <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-500 text-white
                          text-xs font-bold flex items-center justify-center">
                          {inCart.qty}
                        </span>
                      )}
                      <p className={`text-sm font-medium leading-snug pr-6 ${unavailable ? 'text-stone-400' : 'text-stone-800'}`}>
                        {item.name}
                      </p>
                      <p className={`text-sm font-semibold mt-1 ${unavailable ? 'text-stone-400' : 'text-amber-700'}`}>
                        {fmt(item.price)}
                      </p>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </main>

        {/* ── Cart panel ── */}
        <aside className="w-72 bg-white border-l border-stone-200 flex flex-col shrink-0">

          <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between shrink-0">
            <h3 className="font-semibold text-stone-800 text-sm">
              Order
              {activeCart.length > 0 && (
                <span className="ml-2 text-xs font-medium text-stone-400">
                  {activeCart.reduce((s, e) => s + e.qty, 0)} items
                </span>
              )}
            </h3>
            {activeCart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-xs text-stone-400 hover:text-red-400 transition-colors"
              >Clear all</button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {activeCart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-stone-300 gap-2 px-4 select-none">
                <span className="text-4xl">👍</span>
                <p className="text-xs text-center text-stone-400">
                  No items added yet.<br />Tap an item to add.
                </p>
              </div>
            ) : (
              activeCart.map((entry) => (
                <CartRow
                  key={entry.item.id}
                  entry={entry}
                  onRemove={() => removeFromCart(entry.item.id)}
                  onQtyChange={(delta) => updateQty(entry.item.id, delta)}
                  onSetQty={(qty) => setQty(entry.item.id, qty)}
                />
              ))
            )}
          </div>

          {activeCart.length > 0 && (
            <div className="border-t border-stone-100 shrink-0">

              <div className="px-4 py-3 space-y-1.5">
                <div className="flex justify-between text-xs text-stone-500">
                  <span>Subtotal</span>
                  <span>{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-stone-500">
                  <span>VAT ({(vatRate * 100).toFixed(0)}%)</span>
                  <span>{fmt(vat)}</span>
                </div>
                <div className="flex justify-between text-xs text-stone-500">
                  <span>Service {orderType === 'eat_in' ? `(${(serviceRate * 100).toFixed(0)}%)` : '-'}</span>
                  <span>{orderType === 'eat_in' ? fmt(service) : '£0.00'}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-stone-800 pt-1.5 border-t border-stone-100">
                  <span>Total</span>
                  <span className="text-amber-700">{fmt(total)}</span>
                </div>
              </div>

              <div className="px-4 pb-3 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setOrderType('takeaway')}
                  className={`rounded-xl py-2 text-xs font-semibold border transition-colors
                    ${orderType === 'takeaway'
                      ? 'bg-stone-800 text-white border-stone-800'
                      : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                    }`}
                >Takeaway</button>
                <button
                  onClick={() => setOrderType('eat_in')}
                  className={`rounded-xl py-2 text-xs font-semibold border transition-colors
                    ${orderType === 'eat_in'
                      ? 'bg-amber-700 text-white border-amber-700'
                      : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                    }`}
                >Eat In</button>
              </div>

              <div className="px-4 pb-4 flex gap-2">
                <button
                  onClick={holdOrder}
                  className="flex-none rounded-xl border border-stone-200 px-3 py-3 text-xs font-semibold
                    text-stone-600 hover:bg-stone-50 transition-colors"
                  title="Hold order"
                >
                  Hold
                </button>
                <button
                  onClick={() => setShowModal(true)}
                  disabled={!orderType}
                  className="flex-1 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-sm font-semibold
                    py-3 transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                    flex items-center justify-center gap-2"
                >
                  Submit Order
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>

      {undoItem && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3
          bg-stone-800 text-white rounded-xl px-4 py-3 shadow-xl">
          <span className="text-sm">Removed <span className="font-semibold">{undoItem.item.name}</span></span>
          <button
            onClick={undoRemove}
            className="text-amber-400 text-sm font-semibold hover:text-amber-300 transition-colors"
          >
            Undo
          </button>
        </div>
      )}

      {showModal && (
        <CustomerNameModal
          onConfirm={handleConfirmOrder}
          onCancel={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
