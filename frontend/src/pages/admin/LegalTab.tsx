import { useState, useEffect } from 'react';
import { loadRates, saveRates } from '../../data/menu';
import { appendAuditLog, getAuditLogs, type ApiAuditEntry } from '../../api/auditLog';
import { getOrders, type ApiOrder } from '../../api/orders';
import type { AuthUser } from '../../types/Staff';

interface Props { user: AuthUser }

function fmt(n: number) { return `£${n.toFixed(2)}`; }

export default function LegalTab({ user }: Props) {
  const rates = loadRates();
  const [vatInput,     setVatInput]     = useState(String((rates.vat * 100).toFixed(1)));
  const [serviceInput, setServiceInput] = useState(String((rates.service * 100).toFixed(1)));
  const [ratesSaved,   setRatesSaved]   = useState(false);
  const [actualCash,   setActualCash]   = useState('');
  const [eodSaved,     setEodSaved]     = useState(false);
  const [auditEntries, setAuditEntries] = useState<ApiAuditEntry[]>([]);
  const [cashOrders,   setCashOrders]   = useState<ApiOrder[]>([]);

  useEffect(() => {
    getAuditLogs().then(setAuditEntries);
    getOrders('today').then((orders) =>
      setCashOrders(orders.filter((o) => o.payment?.method === 'cash'))
    );
  }, []);

  const expectedCash  = cashOrders.reduce((s, o) => s + (o.payment?.total ?? 0), 0);
  const actualCashVal = parseFloat(actualCash) || 0;
  const discrepancy   = actualCashVal - expectedCash;

  function saveRatesHandler() {
    const vat     = parseFloat(vatInput) / 100;
    const service = parseFloat(serviceInput) / 100;
    if (isNaN(vat) || isNaN(service) || vat < 0 || service < 0) return;
    saveRates({ vat, service });
    appendAuditLog(user, 'Rates updated', `VAT ${(vat * 100).toFixed(1)}% - Service ${(service * 100).toFixed(1)}%`);
    setRatesSaved(true);
    setTimeout(() => setRatesSaved(false), 2500);
  }

  async function saveEod() {
    await appendAuditLog(user, 'EOD cash reconciliation',
      `Expected ${fmt(expectedCash)} - Actual ${fmt(actualCashVal)} - Discrepancy ${discrepancy >= 0 ? '+' : ''}${fmt(discrepancy)}`);
    getAuditLogs().then(setAuditEntries);
    setEodSaved(true);
    setTimeout(() => setEodSaved(false), 2500);
  }

  function formatTs(iso: string) {
    const d = new Date(iso);
    return d.toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">

      <div>
        <h2 className="text-stone-800 font-semibold text-xl">Legal & Tax</h2>
        <p className="text-stone-500 text-sm mt-0.5">Rate configuration, end-of-day reconciliation, and audit log</p>
      </div>

      {/* ── VAT & Service rates ── */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-stone-100">
          <p className="text-sm font-semibold text-stone-700">Tax & Service Rates</p>
          <p className="text-xs text-stone-400 mt-0.5">Changes take effect on the next order</p>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 gap-4 max-w-sm">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide">VAT Rate (%)</label>
              <input
                type="number"
                value={vatInput}
                onChange={(e) => setVatInput(e.target.value)}
                min="0" max="100" step="0.1"
                className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-800
                  focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide">Service Rate (%)</label>
              <input
                type="number"
                value={serviceInput}
                onChange={(e) => setServiceInput(e.target.value)}
                min="0" max="100" step="0.1"
                className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-800
                  focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition"
              />
            </div>
          </div>
          <button
            onClick={saveRatesHandler}
            className={`mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors
              ${ratesSaved ? 'bg-emerald-600' : 'bg-amber-700 hover:bg-amber-800'}`}
          >
            {ratesSaved ? 'Saved' : 'Save Rates'}
          </button>
        </div>
      </div>

      {/* ── EOD Cash Reconciliation ── */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-stone-100">
          <p className="text-sm font-semibold text-stone-700">End-of-Day Cash Reconciliation</p>
          <p className="text-xs text-stone-400 mt-0.5">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-stone-50 rounded-xl border border-stone-200 px-4 py-3">
              <p className="text-xs text-stone-500">Cash orders</p>
              <p className="text-xl font-bold text-stone-800 mt-1">{cashOrders.length}</p>
            </div>
            <div className="bg-amber-50 rounded-xl border border-amber-200 px-4 py-3">
              <p className="text-xs text-amber-700">Expected cash</p>
              <p className="text-xl font-bold text-amber-800 mt-1">{fmt(expectedCash)}</p>
            </div>
            <div className={`rounded-xl border px-4 py-3
              ${actualCash === '' ? 'bg-stone-50 border-stone-200' :
                discrepancy === 0 ? 'bg-emerald-50 border-emerald-200' :
                discrepancy > 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}
            >
              <p className={`text-xs ${actualCash === '' ? 'text-stone-500' :
                discrepancy === 0 ? 'text-emerald-700' :
                discrepancy > 0 ? 'text-blue-700' : 'text-red-700'}`}>
                Discrepancy
              </p>
              <p className={`text-xl font-bold mt-1 ${actualCash === '' ? 'text-stone-400' :
                discrepancy === 0 ? 'text-emerald-700' :
                discrepancy > 0 ? 'text-blue-700' : 'text-red-700'}`}>
                {actualCash === '' ? '-' : `${discrepancy >= 0 ? '+' : ''}${fmt(discrepancy)}`}
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-end max-w-sm">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide">Actual cash counted (£)</label>
              <input
                type="number"
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value)}
                placeholder="0.00"
                min="0" step="0.01"
                className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-800
                  focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition"
              />
            </div>
            <button
              onClick={saveEod}
              disabled={!actualCash}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors
                ${eodSaved ? 'bg-emerald-600' : 'bg-stone-700 hover:bg-stone-800'}
                disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {eodSaved ? 'Logged' : 'Log to Audit'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Audit log ── */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-stone-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-stone-700">Audit Log</p>
            <p className="text-xs text-stone-400 mt-0.5">Read-only · {auditEntries.length} entries</p>
          </div>
          <span className="text-xs bg-stone-100 text-stone-500 px-2.5 py-1 rounded-full font-medium">Confidential</span>
        </div>

        {auditEntries.length === 0 ? (
          <div className="px-5 py-10 text-center text-stone-400 text-sm">No audit entries yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-100">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide whitespace-nowrap">Date / Time</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Staff</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Role</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Action</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Details</th>
                </tr>
              </thead>
              <tbody>
                {auditEntries.map((e) => (
                  <tr key={e.id} className="border-b border-stone-100 hover:bg-stone-50">
                    <td className="px-5 py-3 text-xs text-stone-500 whitespace-nowrap font-mono">{formatTs(e.timestamp)}</td>
                    <td className="px-5 py-3 text-sm font-medium text-stone-800 whitespace-nowrap">{e.user_name}</td>
                    <td className="px-5 py-3 text-xs text-stone-500">{e.role}</td>
                    <td className="px-5 py-3 text-sm text-stone-700 whitespace-nowrap">{e.action}</td>
                    <td className="px-5 py-3 text-xs text-stone-500">{e.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
