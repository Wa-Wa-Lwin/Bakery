import { useState, useEffect } from 'react';
import { getCategoryIcon } from '../../data/menu';
import type { MenuItem } from '../../data/menu';
import type { AuthUser } from '../../types/Staff';
import { appendAuditLog } from '../../api/auditLog';
import { getMenuItems, getCategories, createMenuItem, updateMenuItem, updateChannelStatus } from '../../api/menu';
import CategoryCombobox from '../../components/CategoryCombobox';

interface Props { user: AuthUser }

/* ── Add item modal ── */
function AddItemModal({ categories, onAdd, onCancel }: {
  categories: string[];
  onAdd: (data: { name: string; price: number; category_name: string }) => void;
  onCancel: () => void;
}) {
  const [itemName, setItemName] = useState('');
  const [price,    setPrice]    = useState('');
  const [catName,  setCatName]  = useState(categories[0] ?? '');

  const valid = itemName.trim() && parseFloat(price) > 0 && catName.trim();

  function handleSubmit() {
    if (!valid) return;
    onAdd({ name: itemName.trim(), price: parseFloat(price), category_name: catName.trim() });
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-6">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="bg-amber-700 px-5 py-4 rounded-t-2xl">
          <h3 className="text-white font-semibold text-base">Add Menu Item</h3>
          <p className="text-amber-200 text-xs mt-0.5">New item will be published by default</p>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide">Item Name</label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g. Blueberry Muffin"
              autoFocus
              className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-800
                focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-stone-50 focus:bg-white transition"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide">Price (£)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-800
                focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-stone-50 focus:bg-white transition"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide">Category</label>
            <CategoryCombobox
              value={catName}
              onChange={setCatName}
              categories={categories}
              placeholder="Select or type a category..."
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              onClick={onCancel}
              className="flex-1 rounded-xl border border-stone-200 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50 transition"
            >Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={!valid}
              className="flex-1 rounded-xl bg-amber-700 hover:bg-amber-800 py-2.5 text-sm font-semibold text-white transition
                disabled:opacity-50 disabled:cursor-not-allowed"
            >Add Item</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Inline price editor ── */
function PriceCell({ price, onSave }: { price: number; onSave: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(String(price.toFixed(2)));

  function commit() {
    const n = parseFloat(val);
    if (!isNaN(n) && n > 0) onSave(n);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
        className="w-20 rounded-lg border border-amber-400 px-2 py-1 text-sm text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-400"
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="text-sm font-medium text-stone-700 hover:text-amber-700 transition-colors"
      title="Click to edit price"
    >
      £{price.toFixed(2)}
    </button>
  );
}

/* ── Publish toggle ── */
function PublishToggle({ published, onChange }: { published: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!published)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none
        ${published ? 'bg-amber-500' : 'bg-stone-300'}`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform
        ${published ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
    </button>
  );
}

export default function MenuTab({ user }: Props) {
  const [items,        setItems]        = useState<MenuItem[]>([]);
  const [categories,   setCategories]   = useState<string[]>([]);
  const [selectedCat,  setSelectedCat]  = useState('');
  const [showAdd,      setShowAdd]      = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    Promise.all([getMenuItems(), getCategories()])
      .then(([its, cats]) => {
        setItems(its);
        setCategories(cats);
        if (cats.length > 0) setSelectedCat(cats[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  const catNames      = [...new Set([...categories, ...items.map((i) => i.category_name)])].sort();
  const visibleItems  = items.filter((i) => i.category_name === selectedCat && !i.is_archived);
  const archivedItems = items.filter((i) => i.category_name === selectedCat && i.is_archived);

  async function togglePublish(item: MenuItem) {
    const next    = !item.is_published;
    const updated = await updateMenuItem(item.id, { is_published: next });
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, ...updated } : i));
    appendAuditLog(user, next ? 'Item published' : 'Item unpublished', `${item.name} (${item.category_name})`);
  }

  async function updatePrice(item: MenuItem, price: number) {
    const updated = await updateMenuItem(item.id, { unit_cost: price });
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, ...updated } : i));
    appendAuditLog(user, 'Price updated', `${item.name}: £${item.price.toFixed(2)} -> £${price.toFixed(2)}`);
  }

  async function archiveItem(item: MenuItem) {
    const updated = await updateMenuItem(item.id, { is_archived: true, is_published: false });
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, ...updated } : i));
    appendAuditLog(user, 'Item archived', item.name);
  }

  async function restoreItem(item: MenuItem) {
    const updated = await updateMenuItem(item.id, { is_archived: false });
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, ...updated } : i));
    appendAuditLog(user, 'Item restored', item.name);
  }

  async function toggleChannel(item: MenuItem, orderTypeId: number) {
    const channel = item.channels?.find((c) => c.order_type_id === orderTypeId);
    const next = !(channel?.is_available ?? false);
    await updateChannelStatus(item.id, orderTypeId, next);
    setItems((prev) => prev.map((i) =>
      i.id === item.id
        ? { ...i, channels: i.channels?.map((c) => c.order_type_id === orderTypeId ? { ...c, is_available: next } : c) }
        : i,
    ));
    appendAuditLog(user, `Channel ${next ? 'enabled' : 'disabled'}`,
      `${item.name} - ${orderTypeId === 1 ? 'Takeaway' : 'Eat In'}`);
  }

  async function addItem(data: { name: string; price: number; category_name: string }) {
    const newItem = await createMenuItem({
      item_name:     data.name,
      unit_cost:     data.price,
      category_name: data.category_name,
      is_published:  true,
    });
    setItems((prev) => [...prev, newItem]);
    if (!categories.includes(data.category_name)) {
      setCategories((prev) => [...prev, data.category_name].sort());
    }
    setSelectedCat(data.category_name);
    setShowAdd(false);
    appendAuditLog(user, 'Item added', `${newItem.name} - £${newItem.price.toFixed(2)}`);
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((n) => <div key={n} className="h-12 bg-stone-100 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-stone-800 font-semibold text-xl">Menu Management</h2>
          <p className="text-stone-500 text-sm mt-0.5">Update prices, publish items, add or remove from menu</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-700 hover:bg-amber-800
            text-white text-sm font-semibold px-4 py-2.5 transition-colors"
        >
          <span className="text-lg leading-none">+</span> Add Item
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {catNames.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCat(cat)}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors
              ${selectedCat === cat
                ? 'bg-amber-700 text-white'
                : 'bg-white border border-stone-200 text-stone-600 hover:border-amber-300'
              }`}
          >
            <span>{getCategoryIcon(cat)}</span> {cat}
            <span className={`text-xs ml-0.5 ${selectedCat === cat ? 'text-amber-200' : 'text-stone-400'}`}>
              ({items.filter((i) => i.category_name === cat && !i.is_archived).length})
            </span>
          </button>
        ))}
      </div>

      {/* Items table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-200">
              <th className="px-5 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Item</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Price</th>
              <th className="px-5 py-3 text-center text-xs font-semibold text-stone-500 uppercase tracking-wide">Published</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-stone-500 uppercase tracking-wide">Takeaway</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-stone-500 uppercase tracking-wide">Eat In</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-stone-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-stone-400 text-sm">No items in this category</td>
              </tr>
            ) : (
              visibleItems.map((item) => (
                <tr key={item.id} className={`border-b border-stone-100 hover:bg-stone-50 transition-colors ${!item.is_published ? 'opacity-60' : ''}`}>
                  <td className="px-5 py-3.5 font-medium text-stone-800">{item.name}</td>
                  <td className="px-5 py-3.5">
                    <PriceCell price={item.price} onSave={(v) => updatePrice(item, v)} />
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <PublishToggle published={item.is_published} onChange={() => togglePublish(item)} />
                      <span className={`text-xs font-medium ${item.is_published ? 'text-amber-700' : 'text-stone-400'}`}>
                        {item.is_published ? 'Live' : 'Hidden'}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-center">
                    <PublishToggle
                      published={item.channels?.find((c) => c.order_type_id === 1)?.is_available ?? false}
                      onChange={() => toggleChannel(item, 1)}
                    />
                  </td>
                  <td className="px-3 py-3.5 text-center">
                    <PublishToggle
                      published={item.channels?.find((c) => c.order_type_id === 2)?.is_available ?? false}
                      onChange={() => toggleChannel(item, 2)}
                    />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => archiveItem(item)}
                      className="text-xs text-stone-400 hover:text-red-500 transition-colors font-medium"
                      title="Archive - can be restored later"
                    >
                      Archive
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {visibleItems.length > 0 && (
          <div className="px-5 py-2.5 bg-stone-50 border-t border-stone-100 text-xs text-stone-400 flex justify-between">
            <span>{visibleItems.filter((i) => i.is_published).length} published · {visibleItems.filter((i) => !i.is_published).length} hidden</span>
            <span>{visibleItems.length} items</span>
          </div>
        )}
      </div>

      {/* Archived items */}
      {archivedItems.length > 0 && (
        <div className="mt-4 bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowArchived((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-stone-50 transition-colors"
          >
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
              Archived ({archivedItems.length})
            </span>
            <span className="text-stone-400 text-xs">{showArchived ? 'Hide' : 'Show'}</span>
          </button>
          {showArchived && (
            <table className="w-full text-sm border-t border-stone-100">
              <tbody>
                {archivedItems.map((item) => (
                  <tr key={item.id} className="border-b border-stone-100 bg-stone-50 opacity-60">
                    <td className="px-5 py-3 font-medium text-stone-500 line-through">{item.name}</td>
                    <td className="px-5 py-3 text-stone-400">£{item.price.toFixed(2)}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => restoreItem(item)}
                        className="text-xs text-amber-700 hover:text-amber-900 font-semibold transition-colors"
                      >
                        Restore
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showAdd && (
        <AddItemModal
          categories={catNames}
          onAdd={addItem}
          onCancel={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}
