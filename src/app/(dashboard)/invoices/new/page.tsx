"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/store";
import {
  generateInvoiceNumber, generateId, formatNaira, formatDateInput,
  addDays, calculateInvoiceTotals, calculateWHT, getNextRecurringDate,
} from "@/lib/utils";
import type { LineItem, RecurringInterval } from "@/lib/types";
import { IconArrowLeft, IconPlus, IconTrash } from "@/components/Icons";
import { getTemplate } from "@/components/InvoiceTemplate";
import { formatCurrency } from "@/lib/utils";

const DEFAULT_PAYMENT = "Bank transfer to Zenith Bank 2012345678 (Adeola Creative Studio)";

export default function NewInvoicePage() {
  const { invoices, clients, addInvoice, addClient, user } = useApp();
  const router = useRouter();

  const today = formatDateInput(new Date());
  const due30 = addDays(today, 30);

  const [form, setForm] = useState({
    clientId: "",
    issueDate: today,
    dueDate: due30,
    notes: "",
    paymentInstructions: DEFAULT_PAYMENT,
    discount: 0,
    whtRate: 0,
    currency: "NGN",
    isRecurring: false,
    recurringInterval: "monthly" as RecurringInterval,
  });

  const [items, setItems] = useState<LineItem[]>([
    { id: generateId(), description: "", quantity: 1, unitPrice: 0, taxRate: 7.5 },
  ]);

  const [newClient, setNewClient] = useState({ name: "", email: "", phone: "", city: "" });
  const [showNewClient, setShowNewClient] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);

  const invoiceNumber = useMemo(
    () => generateInvoiceNumber(invoices.map((i) => i.invoiceNumber)),
    [invoices]
  );

  const totals = useMemo(() => calculateInvoiceTotals(items, form.discount), [items, form.discount]);
  const whtCalc = useMemo(() => calculateWHT(totals.total, form.whtRate), [totals.total, form.whtRate]);
  const nextInvoiceDate = useMemo(
    () => form.isRecurring ? getNextRecurringDate(form.issueDate, form.recurringInterval) : undefined,
    [form.isRecurring, form.issueDate, form.recurringInterval]
  );

  function updateItem(id: string, field: keyof LineItem, value: string | number) {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, [field]: value } : item));
  }

  function addItem() {
    setItems((prev) => [...prev, { id: generateId(), description: "", quantity: 1, unitPrice: 0, taxRate: 7.5 }]);
  }

  function removeItem(id: string) {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.clientId && !showNewClient) e.client = "Please select a client";
    if (showNewClient && !newClient.name) e.clientName = "Client name is required";
    if (showNewClient && !newClient.email) e.clientEmail = "Client email is required";
    if (items.every((i) => !i.description)) e.items = "Add at least one item";
    if (totals.total <= 0) e.total = "Invoice total must be greater than 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave(status: "draft" | "sent") {
    if (!validate()) return;
    setSaving(true);

    let clientId = form.clientId;
    if (showNewClient) {
      const created = await addClient({
        name: newClient.name,
        email: newClient.email,
        phone: newClient.phone,
        address: "",
        city: newClient.city,
      });
      clientId = created.id;
    }

    await addInvoice({
      invoiceNumber,
      clientId,
      status,
      issueDate: form.issueDate,
      dueDate: form.dueDate,
      items,
      ...totals,
      discount: form.discount,
      notes: form.notes,
      paymentInstructions: form.paymentInstructions,
      showPaymentDetails: true,
      whtRate: form.whtRate,
      currency: form.currency,
      isRecurring: form.isRecurring,
      recurringInterval: form.isRecurring ? form.recurringInterval : undefined,
      nextInvoiceDate: form.isRecurring ? nextInvoiceDate : undefined,
    });

    router.push("/invoices");
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/invoices" className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200">
            <IconArrowLeft size={20} />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-slate-900">New Invoice</h2>
            <p className="text-slate-500 text-sm">{invoiceNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPreview(true)}
            className="px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-sm font-semibold rounded-xl transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Preview
          </button>
          <button
            onClick={() => handleSave("draft")}
            disabled={saving}
            className="px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition-all"
          >
            Save Draft
          </button>
          <button
            onClick={() => handleSave("sent")}
            disabled={saving}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2"
          >
            {saving ? "Saving…" : "Send Invoice →"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="xl:col-span-2 space-y-6">
          {/* Client selection */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
              <span className="w-6 h-6 bg-amber-100 text-amber-600 rounded-lg text-xs font-bold flex items-center justify-center">1</span>
              Client
            </h3>

            {!showNewClient ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Select client</label>
                  <select
                    value={form.clientId}
                    onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all bg-white"
                  >
                    <option value="">— Choose a client —</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {errors.client && <p className="text-red-500 text-xs mt-1">{errors.client}</p>}
                </div>

                {form.clientId && (
                  <div className="bg-slate-50 rounded-xl p-4 text-sm">
                    {(() => {
                      const c = clients.find((cl) => cl.id === form.clientId);
                      return c ? (
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-900">{c.name}</p>
                          <p className="text-slate-500">{c.email}</p>
                          {c.phone && <p className="text-slate-500">{c.phone}</p>}
                          {c.city && <p className="text-slate-400">{c.city}</p>}
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}

                <button
                  onClick={() => setShowNewClient(true)}
                  className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                >
                  + Add new client
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Name *</label>
                    <input
                      value={newClient.name}
                      onChange={(e) => setNewClient((n) => ({ ...n, name: e.target.value }))}
                      placeholder="Business name"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                    />
                    {errors.clientName && <p className="text-red-500 text-xs mt-1">{errors.clientName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Email *</label>
                    <input
                      type="email"
                      value={newClient.email}
                      onChange={(e) => setNewClient((n) => ({ ...n, email: e.target.value }))}
                      placeholder="client@email.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                    />
                    {errors.clientEmail && <p className="text-red-500 text-xs mt-1">{errors.clientEmail}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
                    <input
                      value={newClient.phone}
                      onChange={(e) => setNewClient((n) => ({ ...n, phone: e.target.value }))}
                      placeholder="+234 801 234 5678"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">City</label>
                    <input
                      value={newClient.city}
                      onChange={(e) => setNewClient((n) => ({ ...n, city: e.target.value }))}
                      placeholder="Lagos"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                    />
                  </div>
                </div>
                <button
                  onClick={() => setShowNewClient(false)}
                  className="text-sm text-slate-500 hover:text-slate-700"
                >
                  ← Select existing client
                </button>
              </div>
            )}
          </div>

          {/* Invoice details */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
              <span className="w-6 h-6 bg-amber-100 text-amber-600 rounded-lg text-xs font-bold flex items-center justify-center">2</span>
              Invoice Details
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Invoice #</label>
                <input
                  value={invoiceNumber}
                  readOnly
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm font-mono cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Issue Date</label>
                <input
                  type="date"
                  value={form.issueDate}
                  onChange={(e) => setForm((f) => ({ ...f, issueDate: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Due Date</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Line items */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
              <span className="w-6 h-6 bg-amber-100 text-amber-600 rounded-lg text-xs font-bold flex items-center justify-center">3</span>
              Line Items
            </h3>

            {errors.items && (
              <p className="text-red-500 text-xs mb-3">{errors.items}</p>
            )}

            {/* Table header */}
            <div className="hidden sm:grid grid-cols-12 gap-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
              <div className="col-span-5">Description</div>
              <div className="col-span-2">Qty</div>
              <div className="col-span-2">Unit Price (₦)</div>
              <div className="col-span-2">Tax %</div>
              <div className="col-span-1" />
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => {
                const lineTotal = item.quantity * item.unitPrice * (1 + item.taxRate / 100);
                return (
                  <div key={item.id} className="grid grid-cols-12 gap-3 items-center p-3 bg-slate-50 rounded-xl group">
                    <div className="col-span-12 sm:col-span-5">
                      <input
                        value={item.description}
                        onChange={(e) => updateItem(item.id, "description", e.target.value)}
                        placeholder={`Item ${idx + 1} description`}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <input
                        type="number"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div className="col-span-3 sm:col-span-2">
                      <select
                        value={item.taxRate}
                        onChange={(e) => updateItem(item.id, "taxRate", parseFloat(e.target.value))}
                        className="w-full px-2 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value={0}>0%</option>
                        <option value={5}>5%</option>
                        <option value={7.5}>7.5%</option>
                        <option value={10}>10%</option>
                      </select>
                    </div>
                    <div className="col-span-1 flex items-center justify-between sm:justify-end">
                      <span className="sm:hidden text-xs text-slate-500">{formatNaira(lineTotal)}</span>
                      <button
                        onClick={() => removeItem(item.id)}
                        disabled={items.length === 1}
                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:cursor-not-allowed"
                      >
                        <IconTrash size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={addItem}
              className="mt-3 flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700 font-medium py-2 px-3 hover:bg-amber-50 rounded-xl transition-all"
            >
              <IconPlus size={16} /> Add line item
            </button>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
              <span className="w-6 h-6 bg-amber-100 text-amber-600 rounded-lg text-xs font-bold flex items-center justify-center">4</span>
              Notes & Options
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes (optional)</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  placeholder="e.g. Thank you for your business! Payment due within 30 days."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment Instructions</label>
                <textarea
                  value={form.paymentInstructions}
                  onChange={(e) => setForm((f) => ({ ...f, paymentInstructions: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

              {/* Currency + WHT */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Currency</label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-white"
                  >
                    <option value="NGN">₦ NGN — Naira</option>
                    <option value="USD">$ USD — Dollar</option>
                    <option value="GBP">£ GBP — Pound</option>
                    <option value="EUR">€ EUR — Euro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Withholding Tax (WHT)</label>
                  <select
                    value={form.whtRate}
                    onChange={(e) => setForm((f) => ({ ...f, whtRate: parseFloat(e.target.value) }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-white"
                  >
                    <option value={0}>No WHT (0%)</option>
                    <option value={5}>5% — Goods</option>
                    <option value={10}>10% — Services</option>
                  </select>
                  <p className="text-xs text-slate-400 mt-1">Client-deducted tax per FIRS</p>
                </div>
              </div>

              {/* Recurring toggle */}
              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => setForm((f) => ({ ...f, isRecurring: !f.isRecurring }))}
                    className={`relative w-11 h-6 rounded-full transition-colors ${form.isRecurring ? "bg-teal-500" : "bg-slate-200"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isRecurring ? "translate-x-5" : ""}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">♻️ Recurring invoice</p>
                    <p className="text-xs text-slate-400">Auto-generate next invoice on schedule</p>
                  </div>
                </label>

                {form.isRecurring && (
                  <div className="mt-3 ml-14 space-y-2">
                    <div>
                      <label className="text-xs text-slate-500 font-medium">Repeat every</label>
                      <select
                        value={form.recurringInterval}
                        onChange={(e) => setForm((f) => ({ ...f, recurringInterval: e.target.value as RecurringInterval }))}
                        className="ml-2 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                      >
                        <option value="weekly">Week</option>
                        <option value="monthly">Month</option>
                        <option value="quarterly">Quarter</option>
                        <option value="yearly">Year</option>
                      </select>
                    </div>
                    {nextInvoiceDate && (
                      <p className="text-xs text-teal-600 font-medium">Next invoice: {nextInvoiceDate}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar – totals & actions */}
        <div className="space-y-5">
          {/* Totals card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 sticky top-24">
            <h3 className="font-bold text-slate-900 mb-5">Summary</h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-medium text-slate-900">{formatNaira(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>VAT / Tax</span>
                <span className="font-medium text-slate-900">{formatNaira(totals.taxAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Discount (₦)</span>
                <input
                  type="number"
                  min="0"
                  value={form.discount}
                  onChange={(e) => setForm((f) => ({ ...f, discount: parseFloat(e.target.value) || 0 }))}
                  className="w-28 text-right px-2 py-1 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between">
                <span className="font-bold text-slate-900 text-base">Gross Total</span>
                <span className="font-bold text-xl text-amber-600">{formatNaira(totals.total)}</span>
              </div>
              {form.whtRate > 0 && (
                <>
                  <div className="flex justify-between text-slate-500 text-sm">
                    <span>Less WHT ({form.whtRate}%)</span>
                    <span className="text-red-500">−{formatNaira(whtCalc.whtAmount)}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 flex justify-between">
                    <span className="font-bold text-slate-900 text-sm">Net Amount Due</span>
                    <span className="font-bold text-emerald-600">{formatNaira(whtCalc.netAmount)}</span>
                  </div>
                </>
              )}
            </div>

            {errors.total && <p className="text-red-500 text-xs mt-2">{errors.total}</p>}

            <div className="mt-6 space-y-3">
              <button
                onClick={() => handleSave("sent")}
                disabled={saving}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-bold rounded-xl transition-all"
              >
                {saving ? "Saving…" : "Send Invoice"}
              </button>
              <button
                onClick={() => handleSave("draft")}
                disabled={saving}
                className="w-full py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-all text-sm"
              >
                Save as Draft
              </button>
            </div>

            {/* Item count */}
            <div className="mt-5 pt-4 border-t border-slate-100 space-y-1.5">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Items</span>
                <span>{items.length}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Invoice #</span>
                <span className="font-mono">{invoiceNumber}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Due date</span>
                <span>{form.dueDate}</span>
              </div>
            </div>

            <button
              onClick={() => setShowPreview(true)}
              className="mt-4 w-full py-2.5 border border-dashed border-slate-300 hover:border-amber-400 hover:bg-amber-50 text-slate-500 hover:text-amber-600 text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview Invoice
            </button>
          </div>
        </div>
      </div>

      {/* Live Preview Slide-Over */}
      {showPreview && (() => {
        const bp = user?.businessProfile;
        const brandColor = bp?.brandColor ?? "#f59e0b";
        const template = getTemplate(bp?.templateStyle);
        const previewClient = clients.find((c) => c.id === form.clientId);
        const fmt = (n: number) => formatCurrency(n, form.currency);
        const hasBankDetails = !!(bp?.bankName && bp?.accountNumber);
        const headerTextColor = template.headerTextColor(brandColor);

        return (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setShowPreview(false)}
            />

            {/* Panel */}
            <div className="fixed inset-y-0 right-0 w-full max-w-2xl z-50 flex flex-col bg-slate-100 shadow-2xl border-l border-slate-200">
              {/* Panel header */}
              <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shrink-0">
                <div>
                  <p className="font-bold text-slate-900">Live Preview</p>
                  <p className="text-xs text-slate-400">Updates as you fill the form</p>
                </div>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-800 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Scrollable invoice */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className={template.wrapperClass}>
                  {/* Invoice header */}
                  <div className="p-8 pb-6" style={template.headerBg(brandColor)}>
                    <div className="flex justify-between items-start gap-4">
                      {/* Business info */}
                      <div>
                        {bp?.logo ? (
                          <img src={bp.logo} alt="Logo" className="h-12 w-auto object-contain mb-3 rounded" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 text-lg font-black" style={{ backgroundColor: `${headerTextColor}22`, color: headerTextColor }}>
                            {(bp?.name ?? "B").charAt(0)}
                          </div>
                        )}
                        <p className="font-bold text-lg" style={{ color: headerTextColor }}>{bp?.name ?? "Your Business"}</p>
                        {bp?.city && <p className="text-sm opacity-80" style={{ color: headerTextColor }}>{bp.city}</p>}
                        {bp?.email && <p className="text-sm opacity-70" style={{ color: headerTextColor }}>{bp.email}</p>}
                      </div>
                      {/* Invoice details */}
                      <div className="text-right">
                        <p className="text-xs font-semibold opacity-70 uppercase tracking-wider mb-1" style={{ color: headerTextColor }}>Invoice</p>
                        <p className="text-xl font-black font-mono" style={{ color: headerTextColor }}>{invoiceNumber}</p>
                        <div className="mt-2 space-y-0.5">
                          <p className="text-xs opacity-70" style={{ color: headerTextColor }}>Issued: {form.issueDate || "—"}</p>
                          <p className="text-xs opacity-70" style={{ color: headerTextColor }}>Due: {form.dueDate || "—"}</p>
                        </div>
                        <span className="mt-2 inline-block text-xs font-bold px-2.5 py-1 rounded-full" style={template.badgeBg(brandColor)}>DRAFT</span>
                      </div>
                    </div>
                  </div>

                  {/* Bill To + Amount */}
                  <div className="px-8 py-5 flex justify-between items-start gap-4 border-b border-slate-100">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Bill To</p>
                      {previewClient ? (
                        <>
                          <p className="font-bold text-slate-900">{previewClient.name}</p>
                          {previewClient.email && <p className="text-sm text-slate-500">{previewClient.email}</p>}
                          {previewClient.city && <p className="text-sm text-slate-400">{previewClient.city}</p>}
                        </>
                      ) : showNewClient && newClient.name ? (
                        <>
                          <p className="font-bold text-slate-900">{newClient.name}</p>
                          {newClient.email && <p className="text-sm text-slate-500">{newClient.email}</p>}
                          {newClient.city && <p className="text-sm text-slate-400">{newClient.city}</p>}
                        </>
                      ) : (
                        <p className="text-slate-400 italic text-sm">No client selected</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Amount Due</p>
                      <p className="text-2xl font-black" style={{ color: brandColor }}>{fmt(totals.total)}</p>
                    </div>
                  </div>

                  {/* Line items */}
                  <div className="px-8 py-5">
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          <th className={`text-left py-2.5 px-3 ${template.tableTh}`}>Description</th>
                          <th className={`text-center py-2.5 px-3 ${template.tableTh}`}>Qty</th>
                          <th className={`text-right py-2.5 px-3 ${template.tableTh}`}>Price</th>
                          <th className={`text-right py-2.5 px-3 ${template.tableTh}`}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr key={item.id} className={template.tableRowAlt}>
                            <td className="py-3 px-3 text-slate-900">{item.description || <span className="text-slate-300 italic">Item description</span>}</td>
                            <td className="py-3 px-3 text-center text-slate-600">{item.quantity}</td>
                            <td className="py-3 px-3 text-right text-slate-600">{fmt(item.unitPrice)}</td>
                            <td className="py-3 px-3 text-right font-medium text-slate-900">{fmt(item.quantity * item.unitPrice * (1 + item.taxRate / 100))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Totals */}
                    <div className={`mt-4 pt-4 border-t-2 ${template.totalBorderColor} space-y-2 text-sm`}>
                      <div className="flex justify-between text-slate-600">
                        <span>Subtotal</span><span>{fmt(totals.subtotal)}</span>
                      </div>
                      {totals.taxAmount > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>VAT / Tax</span><span>{fmt(totals.taxAmount)}</span>
                        </div>
                      )}
                      {form.discount > 0 && (
                        <div className="flex justify-between text-emerald-600">
                          <span>Discount</span><span>−{fmt(form.discount)}</span>
                        </div>
                      )}
                      <div className={`flex justify-between font-bold text-base pt-2 border-t ${template.totalBorderColor}`}>
                        <span className="text-slate-900">{form.whtRate > 0 ? "Gross Total" : "Total"}</span>
                        <span className={template.totalAccentClass} style={template.totalAccentClass === "font-bold" ? { color: brandColor } : undefined}>{fmt(totals.total)}</span>
                      </div>
                      {form.whtRate > 0 && (
                        <>
                          <div className="flex justify-between text-slate-500">
                            <span>Less WHT ({form.whtRate}%)</span>
                            <span className="text-red-500">−{fmt(whtCalc.whtAmount)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-emerald-600">
                            <span>Net Amount Due</span><span>{fmt(whtCalc.netAmount)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Bank details */}
                  {hasBankDetails && (
                    <div className="mx-8 mb-6 p-4 bg-slate-50 rounded-xl text-sm">
                      <p className="font-semibold text-slate-700 mb-2">Payment Details</p>
                      <p className="text-slate-600">{bp?.bankName} · {bp?.accountNumber}</p>
                      {bp?.accountName && <p className="text-slate-500">{bp.accountName}</p>}
                      {form.paymentInstructions && <p className="text-slate-500 mt-1 text-xs">{form.paymentInstructions}</p>}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="px-8 py-4 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-400">{bp?.customFooter || "Thank you for your business!"}</p>
                    <p className="text-[10px] text-slate-300 mt-1">Generated with InvoiceHive</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
}
