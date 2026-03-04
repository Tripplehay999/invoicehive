"use client";
import { useMemo, useRef, useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/store";
import {
  formatNaira, formatDate, getStatusColor, getStatusDot, getStatusLabel,
  calculateInvoiceTotals, generateId,
} from "@/lib/utils";
import type { InvoiceStatus, LineItem } from "@/lib/types";
import {
  IconArrowLeft, IconPrinter, IconShare, IconCheck,
  IconSend, IconMail, IconPhone, IconWhatsApp, IconTrash, IconDollar,
  IconEdit,
} from "@/components/Icons";

const STATUS_FLOW: { from: InvoiceStatus[]; to: InvoiceStatus; label: string; color: string }[] = [
  { from: ["draft"], to: "sent", label: "Mark as Sent", color: "bg-blue-500 hover:bg-blue-600" },
  { from: ["sent", "viewed", "overdue"], to: "paid", label: "Mark as Paid", color: "bg-emerald-500 hover:bg-emerald-600" },
  { from: ["sent", "viewed", "paid"], to: "cancelled", label: "Cancel Invoice", color: "bg-slate-200 hover:bg-slate-300 text-slate-700" },
];

function contrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? "#1e293b" : "#ffffff";
}

interface EmailModal {
  open: boolean;
  to: string;
  message: string;
  sending: boolean;
  sent: boolean;
  error: string;
}

interface EditData {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  clientId: string;
  notes: string;
  paymentInstructions: string;
  discount: string;
}

/* ─── Drag handle icon ──────────────────────────────────────── */
function GripIcon() {
  return (
    <svg className="w-4 h-4 text-slate-300" fill="currentColor" viewBox="0 0 16 16">
      <circle cx="5" cy="4" r="1.2" /><circle cx="11" cy="4" r="1.2" />
      <circle cx="5" cy="8" r="1.2" /><circle cx="11" cy="8" r="1.2" />
      <circle cx="5" cy="12" r="1.2" /><circle cx="11" cy="12" r="1.2" />
    </svg>
  );
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { invoices, clients, user, updateInvoice, deleteInvoice } = useApp();
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [emailModal, setEmailModal] = useState<EmailModal>({
    open: false, to: "", message: "", sending: false, sent: false, error: "",
  });

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<EditData>({
    invoiceNumber: "", issueDate: "", dueDate: "", clientId: "",
    notes: "", paymentInstructions: "", discount: "0",
  });
  const [editItems, setEditItems] = useState<LineItem[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const invoice = useMemo(() => invoices.find((i) => i.id === id), [invoices, id]);
  const client = useMemo(() => clients.find((c) => c.id === invoice?.clientId), [clients, invoice]);
  const business = user?.businessProfile;

  const brandColor = business?.brandColor ?? "#f59e0b";
  const brandText = contrastColor(brandColor);
  const publicUrl = typeof window !== "undefined" ? `${window.location.origin}/i/${id}` : `/i/${id}`;

  // Enter edit mode when ?edit=1 in URL
  useEffect(() => {
    if (searchParams.get("edit") === "1" && invoice && !isEditing) {
      enterEditMode();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, invoice]);

  useEffect(() => {
    if (searchParams.get("paid") === "1" && invoice && invoice.status !== "paid") {
      updateInvoice(invoice.id, { status: "paid" });
    }
  }, [searchParams, invoice, updateInvoice]);

  function enterEditMode() {
    if (!invoice) return;
    setEditData({
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      clientId: invoice.clientId ?? "",
      notes: invoice.notes ?? "",
      paymentInstructions: invoice.paymentInstructions ?? "",
      discount: String(invoice.discount ?? 0),
    });
    setEditItems(invoice.items.map((item) => ({ ...item })));
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
    setEditItems([]);
  }

  async function handleSave() {
    if (!invoice) return;
    setSaving(true);
    try {
      const discount = parseFloat(editData.discount) || 0;
      const { subtotal, taxAmount, total } = calculateInvoiceTotals(editItems, discount);
      await updateInvoice(invoice.id, {
        invoiceNumber: editData.invoiceNumber,
        issueDate: editData.issueDate,
        dueDate: editData.dueDate,
        clientId: editData.clientId || undefined,
        notes: editData.notes,
        paymentInstructions: editData.paymentInstructions,
        discount,
        subtotal,
        taxAmount,
        total,
        items: editItems,
      } as Parameters<typeof updateInvoice>[1]);
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  }

  // Drag & drop for line items
  function handleDragStart(i: number) { setDragIdx(i); }
  function handleDragOver(e: React.DragEvent, i: number) {
    e.preventDefault();
    setDragOverIdx(i);
  }
  function handleDrop(i: number) {
    if (dragIdx === null || dragIdx === i) { setDragIdx(null); setDragOverIdx(null); return; }
    const next = [...editItems];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(i, 0, moved);
    setEditItems(next);
    setDragIdx(null);
    setDragOverIdx(null);
  }
  function handleDragEnd() { setDragIdx(null); setDragOverIdx(null); }

  function addEditItem() {
    setEditItems((items) => [...items, { id: generateId(), description: "", quantity: 1, unitPrice: 0, taxRate: 0 }]);
  }
  function removeEditItem(i: number) {
    setEditItems((items) => items.filter((_, idx) => idx !== i));
  }
  function updateEditItem(i: number, field: keyof LineItem, value: string | number) {
    setEditItems((items) => items.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  }

  // Live totals while editing
  const editTotals = useMemo(() => {
    const discount = parseFloat(editData.discount) || 0;
    return calculateInvoiceTotals(editItems, discount);
  }, [editItems, editData.discount]);

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <p className="text-slate-500 text-lg font-medium">Invoice not found</p>
        <Link href="/invoices" className="mt-4 text-amber-600 hover:text-amber-700 text-sm font-medium">
          ← Back to Invoices
        </Link>
      </div>
    );
  }

  function handleStatusChange(to: InvoiceStatus) {
    updateInvoice(invoice!.id, { status: to });
  }

  async function handleDelete() {
    if (confirm("Delete this invoice? This cannot be undone.")) {
      await deleteInvoice(invoice!.id);
      router.push("/invoices");
    }
  }

  function handlePrint() { window.print(); }

  function handleWhatsApp() {
    if (!client || !invoice) return;
    const bankLine = business?.bankName && invoice.showPaymentDetails
      ? `\n\nBank: ${business.bankName}\nAccount: ${business.accountNumber} (${business.accountName})`
      : "";
    const payLine = business?.paymentLink ? `\n\nPay here: ${business.paymentLink}` : "";
    const viewLine = `\n\nView invoice: ${publicUrl}`;
    const msg = encodeURIComponent(
      `Hello ${client.name},\n\nPlease find your invoice details below:\n\n` +
      `Invoice #: ${invoice.invoiceNumber}\n` +
      `Amount: ${formatNaira(invoice.total)}\n` +
      `Due: ${formatDate(invoice.dueDate)}` +
      bankLine + payLine + viewLine +
      `\n\nThank you for your business!\n${business?.name ?? ""}`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  }

  async function handleGetPaymentLink() {
    setPaymentLoading(true);
    try {
      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: id }),
      });
      const data = await res.json();
      if (data.authorizationUrl) setPaymentLink(data.authorizationUrl);
    } finally {
      setPaymentLoading(false);
    }
  }

  function handleCopyLink() {
    if (!paymentLink) return;
    navigator.clipboard.writeText(paymentLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleCopyPublicLink() {
    navigator.clipboard.writeText(publicUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  function openEmailModal() {
    if (!invoice) return;
    setEmailModal({
      open: true,
      to: client?.email ?? "",
      message: `Hi ${client?.name ?? ""},\n\nPlease find your invoice ${invoice.invoiceNumber} for ${formatNaira(invoice.total)} attached.\n\nDue date: ${formatDate(invoice.dueDate)}\n\nYou can also view it online at: ${publicUrl}\n\nThank you for your business!`,
      sending: false,
      sent: false,
      error: "",
    });
  }

  async function handleSendEmail() {
    setEmailModal((m) => ({ ...m, sending: true, error: "" }));
    const res = await fetch("/api/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId: id, to: emailModal.to, message: emailModal.message }),
    });
    const data = await res.json();
    if (res.ok) {
      setEmailModal((m) => ({ ...m, sending: false, sent: true }));
      setTimeout(() => setEmailModal((m) => ({ ...m, open: false, sent: false })), 2500);
    } else {
      setEmailModal((m) => ({ ...m, sending: false, error: data.error ?? "Failed to send" }));
    }
  }

  function togglePaymentDetails() {
    updateInvoice(invoice!.id, { showPaymentDetails: !invoice!.showPaymentDetails });
  }

  const statusActions = STATUS_FLOW.filter((s) => s.from.includes(invoice.status));
  const hasBankDetails = !!(business?.bankName || business?.accountNumber);
  const showBankOnInvoice = invoice.showPaymentDetails && hasBankDetails;

  // ── Shared input class ──────────────────────────────────────
  const inputCls = "bg-white border border-amber-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 w-full";

  return (
    <>
      {/* ─── Screen view ──────────────────────────── */}
      <div className="max-w-5xl mx-auto animate-fade-in no-print">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <Link href="/invoices" className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200">
              <IconArrowLeft size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900 font-mono">{invoice.invoiceNumber}</h2>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(invoice.status)}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(invoice.status)}`} />
                  {getStatusLabel(invoice.status)}
                </span>
                {isEditing && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-300">
                    ✏️ Editing
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-sm mt-0.5">
                Created {formatDate(invoice.createdAt)} · Due {formatDate(invoice.dueDate)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {!isEditing && (
              <>
                <button onClick={handleWhatsApp} className="flex items-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-xl transition-all">
                  <IconWhatsApp size={16} /><span className="hidden sm:inline">WhatsApp</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="hidden sm:inline">Print / Save PDF</span>
                </button>
                <button onClick={openEmailModal} className="flex items-center gap-2 px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition-all">
                  <IconMail size={16} /><span className="hidden sm:inline">Email</span>
                </button>
              </>
            )}
            {isEditing && (
              <>
                <button onClick={cancelEdit} className="px-4 py-2 border border-slate-200 bg-white text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-all">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 text-sm font-bold rounded-xl disabled:opacity-50 transition-all">
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar — first on mobile */}
          <div className="order-1 lg:order-2 space-y-4 lg:sticky lg:top-6 lg:self-start">
            {/* Actions */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-900 mb-4 text-sm">Actions</h3>
              <div className="space-y-2.5">
                {!isEditing ? (
                  <>
                    {/* Edit button */}
                    <button
                      onClick={enterEditMode}
                      className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900"
                    >
                      <IconEdit size={15} /> Edit Invoice
                    </button>
                    {statusActions.map((action) => (
                      <button
                        key={action.to}
                        onClick={() => handleStatusChange(action.to)}
                        className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-all flex items-center justify-center gap-2 ${action.color}`}
                      >
                        {action.to === "paid" ? <IconCheck size={15} /> : <IconSend size={15} />}
                        {action.label}
                      </button>
                    ))}
                    {/* Payment details toggle */}
                    <button
                      onClick={togglePaymentDetails}
                      className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-600"
                    >
                      {invoice.showPaymentDetails ? (
                        <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg> Hide Payment Details</>
                      ) : (
                        <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> Show Payment Details</>
                      )}
                    </button>
                    <div className="pt-2 border-t border-slate-100">
                      <button onClick={handleDelete} className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-all flex items-center justify-center gap-2">
                        <IconTrash size={15} /> Delete Invoice
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <button onClick={handleSave} disabled={saving} className="w-full py-2.5 px-4 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-900 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                      <IconCheck size={15} /> {saving ? "Saving…" : "Save Changes"}
                    </button>
                    <button onClick={cancelEdit} className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold border border-slate-200 hover:bg-slate-50 text-slate-700 transition-all">
                      Cancel Edit
                    </button>
                    <div className="pt-3 border-t border-slate-100">
                      <p className="text-xs text-slate-400 text-center">Drag ⠿ to reorder items</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-900 mb-4 text-sm">Summary</h3>
              <div className="space-y-3 text-sm">
                {[
                  { label: "Subtotal", value: formatNaira(isEditing ? editTotals.subtotal : invoice.subtotal) },
                  { label: "Tax", value: formatNaira(isEditing ? editTotals.taxAmount : invoice.taxAmount) },
                  { label: "Discount", value: (isEditing ? parseFloat(editData.discount) : invoice.discount) > 0 ? `–${formatNaira(isEditing ? parseFloat(editData.discount) : invoice.discount)}` : "—" },
                  { label: "Total", value: formatNaira(isEditing ? editTotals.total : invoice.total), bold: true },
                ].map(({ label, value, bold }) => (
                  <div key={label} className={`flex justify-between ${bold ? "border-t border-slate-100 pt-3 font-bold text-slate-900" : "text-slate-600"}`}>
                    <span>{label}</span>
                    <span className={bold ? "text-amber-600" : ""}>{value}</span>
                  </div>
                ))}
              </div>
              {isEditing && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <label className="text-xs text-slate-500 block mb-1">Discount (₦)</label>
                  <input
                    type="number"
                    min="0"
                    value={editData.discount}
                    onChange={(e) => setEditData((d) => ({ ...d, discount: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              )}
            </div>

            {/* Client */}
            {client && !isEditing && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-4 text-sm">Client</h3>
                <div className="space-y-2 text-sm">
                  <p className="font-semibold text-slate-900">{client.name}</p>
                  <div className="flex items-center gap-2 text-slate-500"><IconMail size={13} /><span className="truncate">{client.email}</span></div>
                  {client.phone && <div className="flex items-center gap-2 text-slate-500"><IconPhone size={13} />{client.phone}</div>}
                  {client.city && <p className="text-slate-400">{client.city}</p>}
                </div>
                <Link href="/clients" className="mt-4 block text-center text-xs text-amber-600 hover:text-amber-700 font-medium">
                  View all from this client →
                </Link>
              </div>
            )}

            {/* Paystack */}
            {!isEditing && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-3 text-sm flex items-center gap-2">
                  <IconDollar size={16} className="text-emerald-600" /> Online Payment
                </h3>
                {invoice.status === "paid" ? (
                  <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold">
                    <IconCheck size={15} /> Paid
                  </div>
                ) : (
                  <>
                    <button
                      onClick={handleGetPaymentLink}
                      disabled={paymentLoading}
                      className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      {paymentLoading ? (
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : <IconDollar size={15} />}
                      {paymentLoading ? "Generating…" : "Generate Paystack Link"}
                    </button>
                    {paymentLink && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs text-slate-500">Share this Paystack link:</p>
                        <div className="flex gap-2">
                          <input readOnly value={paymentLink} className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 truncate" />
                          <button onClick={handleCopyLink} className="px-3 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-all whitespace-nowrap">
                            {copied ? "Copied!" : "Copy"}
                          </button>
                        </div>
                        <button onClick={() => window.open(paymentLink, "_blank")} className="w-full py-2 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-50 transition-all">
                          Open Payment Page →
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Share */}
            {!isEditing && (
              <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
                <h3 className="font-bold text-slate-900 mb-3 text-sm flex items-center gap-2">
                  <IconShare size={16} className="text-amber-600" /> Share Invoice
                </h3>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input readOnly value={publicUrl} className="flex-1 text-xs px-3 py-2 bg-white border border-amber-200 rounded-lg text-slate-600 truncate" />
                    <button onClick={handleCopyPublicLink} className="px-3 py-2 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 transition-all whitespace-nowrap">
                      {linkCopied ? "Copied!" : "🔗 Copy"}
                    </button>
                  </div>
                  <button onClick={() => window.open(publicUrl, "_blank")} className="w-full py-2 border border-amber-200 bg-white hover:bg-amber-50 text-slate-700 text-xs font-semibold rounded-lg transition-all">
                    Preview Invoice Link →
                  </button>
                  <button onClick={handleWhatsApp} className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2">
                    <IconWhatsApp size={16} /> Share via WhatsApp
                  </button>
                  <button onClick={openEmailModal} className="w-full py-2.5 border border-amber-200 bg-white hover:bg-amber-50 text-slate-700 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2">
                    <IconMail size={16} /> Send via Email
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Invoice preview / edit */}
          <div className="order-2 lg:order-1 lg:col-span-2">
            <div ref={printRef} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              {/* Brand accent */}
              <div style={{ backgroundColor: brandColor, height: "5px" }} />

              {/* Header */}
              <div style={{ backgroundColor: brandColor }} className="px-3 sm:px-8 pt-6 pb-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {business?.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={business.logo} alt={business.name} className="w-12 h-12 rounded-xl object-contain p-1 flex-shrink-0" style={{ backgroundColor: "rgba(255,255,255,0.15)" }} />
                    ) : (
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0" style={{ backgroundColor: "rgba(255,255,255,0.2)", color: brandText }}>
                        {(business?.name ?? "IH").slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-base leading-tight" style={{ color: brandText }}>{business?.name ?? "Your Business"}</p>
                      {business?.city && <p className="text-sm mt-0.5" style={{ color: brandText, opacity: 0.75 }}>{business.city}</p>}
                      {business?.email && <p className="text-xs mt-0.5" style={{ color: brandText, opacity: 0.75 }}>{business.email}</p>}
                      {business?.phone && <p className="text-xs" style={{ color: brandText, opacity: 0.75 }}>{business.phone}</p>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs uppercase tracking-widest font-bold mb-1" style={{ color: brandText, opacity: 0.6 }}>Invoice</p>
                    {isEditing ? (
                      <input
                        value={editData.invoiceNumber}
                        onChange={(e) => setEditData((d) => ({ ...d, invoiceNumber: e.target.value }))}
                        className="text-right font-bold font-mono text-xl bg-white/20 border border-white/40 rounded-lg px-2 py-1 text-white placeholder-white/60 w-44 focus:outline-none focus:ring-2 focus:ring-white/60"
                        style={{ color: brandText }}
                      />
                    ) : (
                      <p className="text-2xl font-bold font-mono" style={{ color: brandText }}>{invoice.invoiceNumber}</p>
                    )}
                    {invoice.status === "paid" && !isEditing && (
                      <span className="inline-block mt-2 px-3 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: "rgba(255,255,255,0.25)", color: brandText }}>
                        ✓ PAID
                      </span>
                    )}
                    <div className="mt-3 space-y-1 text-sm">
                      <div className="flex justify-end items-center gap-2">
                        <span style={{ color: brandText, opacity: 0.65 }}>Issued:</span>
                        {isEditing ? (
                          <input type="date" value={editData.issueDate} onChange={(e) => setEditData((d) => ({ ...d, issueDate: e.target.value }))}
                            className="bg-white/20 border border-white/40 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-white/60" style={{ color: brandText }} />
                        ) : (
                          <span style={{ color: brandText }}>{formatDate(invoice.issueDate)}</span>
                        )}
                      </div>
                      <div className="flex justify-end items-center gap-2">
                        <span style={{ color: brandText, opacity: 0.65 }}>Due:</span>
                        {isEditing ? (
                          <input type="date" value={editData.dueDate} onChange={(e) => setEditData((d) => ({ ...d, dueDate: e.target.value }))}
                            className="bg-white/20 border border-white/40 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-white/60" style={{ color: brandText }} />
                        ) : (
                          <span className="font-semibold" style={{ color: invoice.status === "overdue" ? "#fca5a5" : brandText }}>
                            {formatDate(invoice.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bill to + Amount */}
              <div className="px-3 sm:px-8 py-5 border-b border-slate-100 flex flex-col sm:flex-row items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-1.5">Bill To</p>
                  {isEditing ? (
                    <select
                      value={editData.clientId}
                      onChange={(e) => setEditData((d) => ({ ...d, clientId: e.target.value }))}
                      className={inputCls}
                    >
                      <option value="">No client</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  ) : (
                    <>
                      <p className="font-bold text-slate-900 text-lg">{client?.name ?? "Unknown Client"}</p>
                      {client?.email && <div className="flex items-center gap-1.5 mt-1 text-slate-500 text-sm"><IconMail size={13} />{client.email}</div>}
                      {client?.phone && <div className="flex items-center gap-1.5 mt-0.5 text-slate-500 text-sm"><IconPhone size={13} />{client.phone}</div>}
                      {client?.city && <p className="text-slate-400 text-sm mt-0.5">{client.city}</p>}
                    </>
                  )}
                </div>
                <div className="sm:text-right flex-shrink-0">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Amount Due</p>
                  <p className="text-2xl font-bold" style={{ color: brandColor }}>
                    {formatNaira(isEditing ? editTotals.total : invoice.total)}
                  </p>
                </div>
              </div>

              {/* Pay Here button — digital only */}
              {business?.paymentLink && invoice.status !== "paid" && !isEditing && (
                <div className="px-3 sm:px-8 py-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 no-print">
                  <p className="text-sm text-slate-500">Pay securely online</p>
                  <a
                    href={business.paymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
                    style={{ backgroundColor: "#10b981" }}
                  >
                    💳 Pay Now — {formatNaira(invoice.total)}
                  </a>
                </div>
              )}

              {/* Line items */}
              <div className="px-3 sm:px-8 py-6">

                {/* ── Edit mode: editable line items with drag & drop ── */}
                {isEditing ? (
                  <div className="space-y-2">
                    <div className="hidden sm:grid grid-cols-[auto_1fr_80px_100px_60px_36px] gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wide pb-1 border-b border-slate-100">
                      <span />
                      <span>Description</span>
                      <span className="text-center">Qty</span>
                      <span className="text-right">Unit Price</span>
                      <span className="text-right">Tax%</span>
                      <span />
                    </div>
                    {editItems.map((item, i) => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={() => handleDragStart(i)}
                        onDragOver={(e) => handleDragOver(e, i)}
                        onDrop={() => handleDrop(i)}
                        onDragEnd={handleDragEnd}
                        className={`flex flex-col sm:grid sm:grid-cols-[auto_1fr_80px_100px_60px_36px] gap-2 items-start sm:items-center p-2 rounded-xl border transition-all ${
                          dragIdx === i ? "opacity-40 border-dashed border-amber-400 bg-amber-50" :
                          dragOverIdx === i ? "border-amber-400 bg-amber-50" :
                          "border-slate-100 bg-slate-50/50"
                        }`}
                      >
                        {/* Drag handle */}
                        <div className="cursor-grab hidden sm:flex items-center self-center" title="Drag to reorder">
                          <GripIcon />
                        </div>
                        <input
                          value={item.description}
                          onChange={(e) => updateEditItem(i, "description", e.target.value)}
                          placeholder="Item description"
                          className={inputCls}
                        />
                        <input
                          type="number" min="0" step="0.01"
                          value={item.quantity}
                          onChange={(e) => updateEditItem(i, "quantity", parseFloat(e.target.value) || 0)}
                          className={`${inputCls} text-center`}
                        />
                        <input
                          type="number" min="0" step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateEditItem(i, "unitPrice", parseFloat(e.target.value) || 0)}
                          className={`${inputCls} text-right`}
                        />
                        <input
                          type="number" min="0" max="100" step="0.1"
                          value={item.taxRate}
                          onChange={(e) => updateEditItem(i, "taxRate", parseFloat(e.target.value) || 0)}
                          className={`${inputCls} text-right`}
                        />
                        <button onClick={() => removeEditItem(i)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors self-center">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    <button onClick={addEditItem} className="w-full py-2 border border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50 transition-all flex items-center justify-center gap-2 mt-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      Add Line Item
                    </button>
                  </div>
                ) : (
                  /* ── Read mode: responsive table / cards ── */
                  <>
                    {/* Mobile: card per item */}
                    <div className="sm:hidden space-y-3 mb-4">
                      {invoice.items.map((item) => {
                        const lineTotal = item.quantity * item.unitPrice * (1 + item.taxRate / 100);
                        return (
                          <div key={item.id} className="flex justify-between items-start p-3 bg-slate-50 rounded-xl">
                            <div className="flex-1 min-w-0 pr-3">
                              <p className="font-medium text-slate-800 text-sm">{item.description}</p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {item.quantity} × {formatNaira(item.unitPrice)}
                                {item.taxRate > 0 && ` + ${item.taxRate}% tax`}
                              </p>
                            </div>
                            <p className="font-semibold text-slate-900 text-sm flex-shrink-0">{formatNaira(lineTotal)}</p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Desktop: table */}
                    <table className="hidden sm:table w-full text-sm">
                      <thead>
                        <tr style={{ borderBottom: `2px solid ${brandColor}` }}>
                          <th className="text-left pb-3 font-bold text-slate-700">Description</th>
                          <th className="text-center pb-3 font-bold text-slate-700 w-16">Qty</th>
                          <th className="text-right pb-3 font-bold text-slate-700 w-28">Unit Price</th>
                          <th className="text-right pb-3 font-bold text-slate-700 w-16">Tax</th>
                          <th className="text-right pb-3 font-bold text-slate-700 w-28">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {invoice.items.map((item) => {
                          const lineTotal = item.quantity * item.unitPrice * (1 + item.taxRate / 100);
                          return (
                            <tr key={item.id}>
                              <td className="py-3 text-slate-800">{item.description}</td>
                              <td className="py-3 text-center text-slate-600">{item.quantity}</td>
                              <td className="py-3 text-right text-slate-600">{formatNaira(item.unitPrice)}</td>
                              <td className="py-3 text-right text-slate-400">{item.taxRate}%</td>
                              <td className="py-3 text-right font-semibold text-slate-900">{formatNaira(lineTotal)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </>
                )}

                {/* Totals */}
                <div className="mt-6 w-full sm:w-64 sm:ml-auto space-y-2">
                  <div className="flex justify-between text-sm text-slate-600"><span>Subtotal</span><span>{formatNaira(isEditing ? editTotals.subtotal : invoice.subtotal)}</span></div>
                  {(isEditing ? editTotals.taxAmount : invoice.taxAmount) > 0 && <div className="flex justify-between text-sm text-slate-600"><span>VAT / Tax</span><span>{formatNaira(isEditing ? editTotals.taxAmount : invoice.taxAmount)}</span></div>}
                  {(isEditing ? parseFloat(editData.discount) : invoice.discount) > 0 && (
                    <div className="flex justify-between text-sm text-emerald-600"><span>Discount</span><span>–{formatNaira(isEditing ? parseFloat(editData.discount) : invoice.discount)}</span></div>
                  )}
                  <div className="flex justify-between pt-2 font-bold text-slate-900" style={{ borderTop: `2px solid ${brandColor}` }}>
                    <span>Total</span>
                    <span className="text-lg" style={{ color: brandColor }}>{formatNaira(isEditing ? editTotals.total : invoice.total)}</span>
                  </div>
                </div>
              </div>

              {/* Notes / Payment instructions (editable in edit mode) */}
              {isEditing ? (
                <div className="px-3 sm:px-8 py-5 bg-slate-50 border-t border-slate-100 space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Payment Instructions</label>
                    <textarea
                      value={editData.paymentInstructions}
                      onChange={(e) => setEditData((d) => ({ ...d, paymentInstructions: e.target.value }))}
                      rows={2}
                      placeholder="e.g. Bank transfer to GTBank..."
                      className={`${inputCls} resize-none`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Notes</label>
                    <textarea
                      value={editData.notes}
                      onChange={(e) => setEditData((d) => ({ ...d, notes: e.target.value }))}
                      rows={2}
                      placeholder="Additional notes..."
                      className={`${inputCls} resize-none`}
                    />
                  </div>
                </div>
              ) : (
                /* Bank details + notes (read mode) */
                (showBankOnInvoice || (invoice.showPaymentDetails && (invoice.notes || invoice.paymentInstructions))) ? (
                  <div className="px-3 sm:px-8 py-6 bg-slate-50 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {showBankOnInvoice && (
                      <div>
                        <p className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-2">Bank Details</p>
                        <div className="space-y-1 text-sm text-slate-700">
                          {business?.bankName && <p><span className="text-slate-400">Bank:</span> {business.bankName}</p>}
                          {business?.accountNumber && <p><span className="text-slate-400">Account:</span> {business.accountNumber}</p>}
                          {business?.accountName && <p><span className="text-slate-400">Name:</span> {business.accountName}</p>}
                        </div>
                      </div>
                    )}
                    {invoice.showPaymentDetails && (invoice.notes || invoice.paymentInstructions) && (
                      <div>
                        {invoice.paymentInstructions && (
                          <>
                            <p className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-2">Payment Instructions</p>
                            <p className="text-sm text-slate-700 leading-relaxed mb-3">{invoice.paymentInstructions}</p>
                          </>
                        )}
                        {invoice.notes && (
                          <>
                            <p className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-2">Notes</p>
                            <p className="text-sm text-slate-700 leading-relaxed">{invoice.notes}</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ) : null
              )}

              {/* Signature */}
              {business?.signatureUrl && !isEditing && (
                <div className="px-3 sm:px-8 py-5 border-t border-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={business.signatureUrl} alt="Signature" className="h-14 object-contain" />
                  <div className="mt-1 w-44 pt-1" style={{ borderTop: "1px solid #cbd5e1" }}>
                    <p className="text-xs text-slate-500">Authorized Signature — {business.name}</p>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="px-3 sm:px-8 py-4 text-center" style={{ backgroundColor: brandColor + "12", borderTop: `1px solid ${brandColor}30` }}>
                {business?.customFooter && <p className="text-sm text-slate-600 mb-1.5">{business.customFooter}</p>}
                <p className="text-xs text-slate-400">
                  Generated with <span className="font-semibold" style={{ color: brandColor }}>InvoiceHive</span> · invoicehive.ng
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Email Modal ──────────────────────────────────────── */}
      {emailModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEmailModal((m) => ({ ...m, open: false }))} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 z-10">
            <h3 className="font-bold text-slate-900 text-lg mb-5">Send Invoice via Email</h3>

            {emailModal.sent ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <IconCheck size={24} className="text-emerald-600" />
                </div>
                <p className="font-semibold text-slate-900">Email sent!</p>
                <p className="text-slate-500 text-sm mt-1">The invoice was delivered to {emailModal.to}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">To</label>
                  <input
                    type="email"
                    value={emailModal.to}
                    onChange={(e) => setEmailModal((m) => ({ ...m, to: e.target.value }))}
                    placeholder="client@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Message</label>
                  <textarea
                    value={emailModal.message}
                    onChange={(e) => setEmailModal((m) => ({ ...m, message: e.target.value }))}
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm resize-none"
                  />
                </div>
                {emailModal.error && (
                  <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-xl">{emailModal.error}</p>
                )}
                <p className="text-xs text-slate-400">The email will include a full invoice summary and a link for the client to view it online.</p>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setEmailModal((m) => ({ ...m, open: false }))} className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">
                    Cancel
                  </button>
                  <button
                    onClick={handleSendEmail}
                    disabled={emailModal.sending || !emailModal.to}
                    className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    {emailModal.sending ? (
                      <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Sending…</>
                    ) : (
                      <><IconMail size={15} /> Send Invoice</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Print-only view ──────────────────────────────────── */}
      <div className="print-only p-10 bg-white text-slate-900">
        <div className="max-w-2xl mx-auto">
          <div style={{ backgroundColor: brandColor, height: "4px", marginBottom: "24px", borderRadius: "2px" }} />
          <div className="flex justify-between items-start mb-8 pb-6" style={{ borderBottom: `2px solid ${brandColor}` }}>
            <div className="flex items-start gap-3">
              {business?.logo && <img src={business.logo} alt="" className="w-12 h-12 object-contain" />}
              <div>
                <h1 className="text-xl font-bold">{business?.name}</h1>
                {business?.address && <p className="text-sm text-slate-500 mt-0.5">{business.address}</p>}
                {business?.city && <p className="text-sm text-slate-500">{business.city}</p>}
                {(business?.email || business?.phone) && <p className="text-sm text-slate-500">{[business.email, business.phone].filter(Boolean).join(" · ")}</p>}
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold" style={{ color: brandColor }}>INVOICE</p>
              <p className="font-mono font-bold text-lg mt-1">{invoice.invoiceNumber}</p>
              <p className="text-sm text-slate-500 mt-2">Issued: {formatDate(invoice.issueDate)}</p>
              <p className="text-sm text-slate-500">Due: {formatDate(invoice.dueDate)}</p>
            </div>
          </div>

          <div className="mb-8 flex justify-between items-start">
            <div>
              <p className="text-xs uppercase font-bold text-slate-400 mb-2">Bill To</p>
              <p className="font-bold text-lg">{client?.name}</p>
              <p className="text-sm text-slate-500">{client?.email}</p>
              <p className="text-sm text-slate-500">{client?.phone}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase font-bold text-slate-400 mb-2">Amount Due</p>
              <p className="text-2xl font-bold" style={{ color: brandColor }}>{formatNaira(invoice.total)}</p>
            </div>
          </div>

          <table className="w-full text-sm border-collapse mb-8">
            <thead>
              <tr style={{ borderBottom: `2px solid ${brandColor}` }}>
                <th className="text-left py-2 px-3 font-bold">Description</th>
                <th className="text-center py-2 px-3 font-bold w-12">Qty</th>
                <th className="text-right py-2 px-3 font-bold w-24">Price</th>
                <th className="text-right py-2 px-3 font-bold w-12">Tax</th>
                <th className="text-right py-2 px-3 font-bold w-24">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i) => (
                <tr key={item.id} style={{ backgroundColor: i % 2 === 1 ? "#f8fafc" : "white" }}>
                  <td className="py-2 px-3">{item.description}</td>
                  <td className="py-2 px-3 text-center">{item.quantity}</td>
                  <td className="py-2 px-3 text-right">{formatNaira(item.unitPrice)}</td>
                  <td className="py-2 px-3 text-right">{item.taxRate}%</td>
                  <td className="py-2 px-3 text-right font-semibold">{formatNaira(item.quantity * item.unitPrice * (1 + item.taxRate / 100))}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mb-8">
            <div className="w-56 space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{formatNaira(invoice.subtotal)}</span></div>
              {invoice.taxAmount > 0 && <div className="flex justify-between text-slate-600"><span>Tax</span><span>{formatNaira(invoice.taxAmount)}</span></div>}
              {invoice.discount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>–{formatNaira(invoice.discount)}</span></div>}
              <div className="flex justify-between pt-2 font-bold text-base" style={{ borderTop: `2px solid ${brandColor}` }}>
                <span>TOTAL</span><span style={{ color: brandColor }}>{formatNaira(invoice.total)}</span>
              </div>
            </div>
          </div>

          {(showBankOnInvoice || (invoice.showPaymentDetails && (invoice.paymentInstructions || invoice.notes))) && (
            <div className="grid grid-cols-2 gap-6 mb-8 p-4 rounded-lg" style={{ backgroundColor: "#f8fafc" }}>
              {showBankOnInvoice && (
                <div>
                  <p className="text-xs font-bold uppercase text-slate-400 mb-2">Bank Details</p>
                  <div className="text-sm space-y-0.5 text-slate-700">
                    {business?.bankName && <p>{business.bankName}</p>}
                    {business?.accountNumber && <p>{business.accountNumber}</p>}
                    {business?.accountName && <p>{business.accountName}</p>}
                  </div>
                </div>
              )}
              {invoice.showPaymentDetails && (invoice.paymentInstructions || invoice.notes) && (
                <div>
                  {invoice.paymentInstructions && <><p className="text-xs font-bold uppercase text-slate-400 mb-1">Payment Instructions</p><p className="text-sm text-slate-700 mb-3">{invoice.paymentInstructions}</p></>}
                  {invoice.notes && <><p className="text-xs font-bold uppercase text-slate-400 mb-1">Notes</p><p className="text-sm text-slate-600 italic">{invoice.notes}</p></>}
                </div>
              )}
            </div>
          )}

          {business?.signatureUrl && (
            <div className="mb-6">
              <img src={business.signatureUrl} alt="Signature" className="h-14 object-contain" />
              <div className="mt-1 w-40 pt-1" style={{ borderTop: "1px solid #cbd5e1" }}>
                <p className="text-xs text-slate-500">Authorized Signature</p>
              </div>
            </div>
          )}

          <div className="mt-8 pt-4 text-center" style={{ borderTop: `1px solid ${brandColor}40` }}>
            {business?.customFooter && <p className="text-sm text-slate-600 mb-1">{business.customFooter}</p>}
            <p className="text-xs text-slate-400">Generated with InvoiceHive · invoicehive.ng</p>
          </div>
        </div>
      </div>
    </>
  );
}
