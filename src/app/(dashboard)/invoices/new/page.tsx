"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/store";
import {
  generateInvoiceNumber, generateId, formatNaira, formatDateInput,
  addDays, calculateInvoiceTotals,
} from "@/lib/utils";
import type { LineItem } from "@/lib/types";
import { IconArrowLeft, IconPlus, IconTrash } from "@/components/Icons";

const DEFAULT_PAYMENT = "Bank transfer to Zenith Bank 2012345678 (Adeola Creative Studio)";

export default function NewInvoicePage() {
  const { invoices, clients, addInvoice, addClient } = useApp();
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
  });

  const [items, setItems] = useState<LineItem[]>([
    { id: generateId(), description: "", quantity: 1, unitPrice: 0, taxRate: 7.5 },
  ]);

  const [newClient, setNewClient] = useState({ name: "", email: "", phone: "", city: "" });
  const [showNewClient, setShowNewClient] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const invoiceNumber = useMemo(
    () => generateInvoiceNumber(invoices.map((i) => i.invoiceNumber)),
    [invoices]
  );

  const totals = useMemo(() => calculateInvoiceTotals(items, form.discount), [items, form.discount]);

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
              Notes & Payment Instructions
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
                <span className="font-bold text-slate-900 text-base">Total</span>
                <span className="font-bold text-xl text-amber-600">{formatNaira(totals.total)}</span>
              </div>
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
          </div>
        </div>
      </div>
    </div>
  );
}
