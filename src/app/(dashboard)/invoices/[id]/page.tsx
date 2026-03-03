"use client";
import { useMemo, useRef, useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { formatNaira, formatDate, getStatusColor, getStatusDot, getStatusLabel } from "@/lib/utils";
import type { InvoiceStatus } from "@/lib/types";
import {
  IconArrowLeft, IconPrinter, IconShare, IconCheck,
  IconSend, IconMail, IconPhone, IconWhatsApp, IconTrash, IconDollar,
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

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { invoices, clients, user, updateInvoice, deleteInvoice } = useApp();
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const invoice = useMemo(() => invoices.find((i) => i.id === id), [invoices, id]);
  const client = useMemo(() => clients.find((c) => c.id === invoice?.clientId), [clients, invoice]);
  const business = user?.businessProfile;

  const brandColor = business?.brandColor ?? "#f59e0b";
  const brandText = contrastColor(brandColor);

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

  function handlePrint() {
    window.print();
  }

  function handleWhatsApp() {
    if (!client || !invoice) return;
    const bankLine = business?.bankName
      ? `\n\nBank: ${business.bankName}\nAccount: ${business.accountNumber} (${business.accountName})`
      : "";
    const msg = encodeURIComponent(
      `Hello ${client.name},\n\nPlease find your invoice details below:\n\n` +
      `Invoice #: ${invoice.invoiceNumber}\n` +
      `Amount: ${formatNaira(invoice.total)}\n` +
      `Due: ${formatDate(invoice.dueDate)}` +
      bankLine +
      `\n\nThank you for your business!\n${business?.name ?? ""}`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  }

  useEffect(() => {
    if (searchParams.get("paid") === "1" && invoice && invoice.status !== "paid") {
      updateInvoice(invoice.id, { status: "paid" });
    }
  }, [searchParams, invoice, updateInvoice]);

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

  const statusActions = STATUS_FLOW.filter((s) => s.from.includes(invoice.status));
  const hasBankDetails = !!(business?.bankName || business?.accountNumber);

  return (
    <>
      {/* ─── Screen view ──────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto animate-fade-in no-print">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/invoices"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200"
            >
              <IconArrowLeft size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900 font-mono">{invoice.invoiceNumber}</h2>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(invoice.status)}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(invoice.status)}`} />
                  {getStatusLabel(invoice.status)}
                </span>
              </div>
              <p className="text-slate-500 text-sm mt-0.5">
                Created {formatDate(invoice.createdAt)} · Due {formatDate(invoice.dueDate)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleWhatsApp}
              className="flex items-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-xl transition-all"
            >
              <IconWhatsApp size={16} />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition-all"
            >
              <IconPrinter size={16} />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>
            <button
              onClick={() => {
                if (client?.email) window.open(`mailto:${client.email}?subject=Invoice ${invoice.invoiceNumber}&body=Please find your invoice attached.`);
              }}
              className="flex items-center gap-2 px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition-all"
            >
              <IconMail size={16} />
              <span className="hidden sm:inline">Email</span>
            </button>
          </div>
        </div>

        {/* Grid — sidebar FIRST on mobile so actions are accessible without scrolling */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Actions sidebar ── order-1 on mobile, col 3 on desktop */}
          <div className="order-1 lg:order-2 space-y-4 lg:sticky lg:top-6 lg:self-start">
            {/* Status actions */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-900 mb-4 text-sm">Actions</h3>
              <div className="space-y-2.5">
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
                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={handleDelete}
                    className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                  >
                    <IconTrash size={15} /> Delete Invoice
                  </button>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-900 mb-4 text-sm">Summary</h3>
              <div className="space-y-3 text-sm">
                {[
                  { label: "Subtotal", value: formatNaira(invoice.subtotal) },
                  { label: "Tax", value: formatNaira(invoice.taxAmount) },
                  { label: "Discount", value: invoice.discount > 0 ? `–${formatNaira(invoice.discount)}` : "—" },
                  { label: "Total", value: formatNaira(invoice.total), bold: true },
                ].map(({ label, value, bold }) => (
                  <div key={label} className={`flex justify-between ${bold ? "border-t border-slate-100 pt-3 font-bold text-slate-900" : "text-slate-600"}`}>
                    <span>{label}</span>
                    <span className={bold ? "text-amber-600" : ""}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Client */}
            {client && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-4 text-sm">Client</h3>
                <div className="space-y-2 text-sm">
                  <p className="font-semibold text-slate-900">{client.name}</p>
                  <div className="flex items-center gap-2 text-slate-500">
                    <IconMail size={13} /> <span className="truncate">{client.email}</span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <IconPhone size={13} /> {client.phone}
                    </div>
                  )}
                  {client.city && <p className="text-slate-400">{client.city}</p>}
                </div>
                <Link href="/clients" className="mt-4 block text-center text-xs text-amber-600 hover:text-amber-700 font-medium">
                  View all from this client →
                </Link>
              </div>
            )}

            {/* Paystack */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-900 mb-3 text-sm flex items-center gap-2">
                <IconDollar size={16} className="text-emerald-600" /> Online Payment
              </h3>
              {invoice.status === "paid" ? (
                <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold">
                  <IconCheck size={15} /> Paid via Paystack
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
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    ) : <IconDollar size={15} />}
                    {paymentLoading ? "Generating…" : "Generate Payment Link"}
                  </button>
                  {paymentLink && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-slate-500">Share this link with your client:</p>
                      <div className="flex gap-2">
                        <input
                          readOnly
                          value={paymentLink}
                          className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 truncate"
                        />
                        <button
                          onClick={handleCopyLink}
                          className="px-3 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-all whitespace-nowrap"
                        >
                          {copied ? "Copied!" : "Copy"}
                        </button>
                      </div>
                      <button
                        onClick={() => window.open(paymentLink, "_blank")}
                        className="w-full py-2 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-50 transition-all"
                      >
                        Open Payment Page →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Share */}
            <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
              <h3 className="font-bold text-slate-900 mb-3 text-sm flex items-center gap-2">
                <IconShare size={16} className="text-amber-600" /> Share Invoice
              </h3>
              <div className="space-y-2">
                <button
                  onClick={handleWhatsApp}
                  className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <IconWhatsApp size={16} /> Share via WhatsApp
                </button>
                <button
                  onClick={() => client?.email && window.open(`mailto:${client.email}?subject=Invoice ${invoice.invoiceNumber}`)}
                  className="w-full py-2.5 border border-amber-200 bg-white hover:bg-amber-50 text-slate-700 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <IconMail size={16} /> Send via Email
                </button>
              </div>
            </div>
          </div>

          {/* ── Invoice preview ── order-2 on mobile, col 1-2 on desktop */}
          <div className="order-2 lg:order-1 lg:col-span-2">
            <div ref={printRef} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

              {/* Brand accent stripe */}
              <div style={{ backgroundColor: brandColor, height: "5px" }} />

              {/* Header */}
              <div style={{ backgroundColor: brandColor }} className="px-8 pt-7 pb-8">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex items-start gap-4">
                    {business?.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={business.logo}
                        alt={business.name}
                        className="w-14 h-14 rounded-xl object-contain p-1"
                        style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                      />
                    ) : (
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0"
                        style={{ backgroundColor: "rgba(255,255,255,0.2)", color: brandText }}
                      >
                        {(business?.name ?? "IH").slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-lg leading-tight" style={{ color: brandText }}>
                        {business?.name ?? "Your Business"}
                      </p>
                      {business?.city && (
                        <p className="text-sm mt-0.5" style={{ color: brandText, opacity: 0.75 }}>{business.city}</p>
                      )}
                      {business?.email && (
                        <p className="text-sm mt-0.5" style={{ color: brandText, opacity: 0.75 }}>{business.email}</p>
                      )}
                      {business?.phone && (
                        <p className="text-sm" style={{ color: brandText, opacity: 0.75 }}>{business.phone}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs uppercase tracking-widest font-bold mb-1" style={{ color: brandText, opacity: 0.6 }}>Invoice</p>
                    <p className="text-2xl font-bold font-mono" style={{ color: brandText }}>{invoice.invoiceNumber}</p>
                    {invoice.status === "paid" && (
                      <span className="inline-block mt-2 px-3 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: "rgba(255,255,255,0.25)", color: brandText }}>
                        ✓ PAID
                      </span>
                    )}
                    <div className="mt-3 space-y-1 text-sm">
                      <div className="flex justify-end gap-3">
                        <span style={{ color: brandText, opacity: 0.65 }}>Issued:</span>
                        <span style={{ color: brandText }}>{formatDate(invoice.issueDate)}</span>
                      </div>
                      <div className="flex justify-end gap-3">
                        <span style={{ color: brandText, opacity: 0.65 }}>Due:</span>
                        <span className="font-semibold" style={{ color: invoice.status === "overdue" ? "#fca5a5" : brandText }}>
                          {formatDate(invoice.dueDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bill to + Amount highlight */}
              <div className="px-8 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-1.5">Bill To</p>
                  <p className="font-bold text-slate-900 text-lg">{client?.name ?? "Unknown Client"}</p>
                  {client?.email && (
                    <div className="flex items-center gap-1.5 mt-1 text-slate-500 text-sm">
                      <IconMail size={13} /> {client.email}
                    </div>
                  )}
                  {client?.phone && (
                    <div className="flex items-center gap-1.5 mt-0.5 text-slate-500 text-sm">
                      <IconPhone size={13} /> {client.phone}
                    </div>
                  )}
                  {client?.city && <p className="text-slate-400 text-sm mt-0.5">{client.city}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Amount Due</p>
                  <p className="text-2xl font-bold" style={{ color: brandColor }}>{formatNaira(invoice.total)}</p>
                </div>
              </div>

              {/* Line items */}
              <div className="px-8 py-6">
                <table className="w-full text-sm">
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

                {/* Totals */}
                <div className="mt-6 ml-auto w-64 space-y-2">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Subtotal</span><span>{formatNaira(invoice.subtotal)}</span>
                  </div>
                  {invoice.taxAmount > 0 && (
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>VAT / Tax</span><span>{formatNaira(invoice.taxAmount)}</span>
                    </div>
                  )}
                  {invoice.discount > 0 && (
                    <div className="flex justify-between text-sm text-emerald-600">
                      <span>Discount</span><span>–{formatNaira(invoice.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 font-bold text-slate-900" style={{ borderTop: `2px solid ${brandColor}` }}>
                    <span>Total</span>
                    <span className="text-lg" style={{ color: brandColor }}>{formatNaira(invoice.total)}</span>
                  </div>
                </div>
              </div>

              {/* Bank details + Notes */}
              {(hasBankDetails || invoice.notes || invoice.paymentInstructions) && (
                <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {hasBankDetails && (
                    <div>
                      <p className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-2">Bank Details</p>
                      <div className="space-y-1 text-sm text-slate-700">
                        {business?.bankName && (
                          <p><span className="text-slate-400">Bank:</span> {business.bankName}</p>
                        )}
                        {business?.accountNumber && (
                          <p><span className="text-slate-400">Account:</span> {business.accountNumber}</p>
                        )}
                        {business?.accountName && (
                          <p><span className="text-slate-400">Name:</span> {business.accountName}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {(invoice.notes || invoice.paymentInstructions) && (
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
              )}

              {/* Signature */}
              {business?.signatureUrl && (
                <div className="px-8 py-5 border-t border-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={business.signatureUrl} alt="Signature" className="h-14 object-contain" />
                  <div className="mt-1 w-44 pt-1" style={{ borderTop: `1px solid #cbd5e1` }}>
                    <p className="text-xs text-slate-500">Authorized Signature — {business.name}</p>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div
                className="px-8 py-4 text-center"
                style={{ backgroundColor: brandColor + "12", borderTop: `1px solid ${brandColor}30` }}
              >
                {business?.customFooter && (
                  <p className="text-sm text-slate-600 mb-1.5">{business.customFooter}</p>
                )}
                <p className="text-xs text-slate-400">
                  Generated with{" "}
                  <span className="font-semibold" style={{ color: brandColor }}>InvoiceHive</span>
                  {" "}· invoicehive.ng
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Print-only view ──────────────────────────────────── */}
      <div className="print-only p-10 bg-white text-slate-900">
        <div className="max-w-2xl mx-auto">
          {/* Accent bar */}
          <div style={{ backgroundColor: brandColor, height: "4px", marginBottom: "24px", borderRadius: "2px" }} />

          {/* Header */}
          <div className="flex justify-between items-start mb-8 pb-6" style={{ borderBottom: `2px solid ${brandColor}` }}>
            <div className="flex items-start gap-3">
              {business?.logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={business.logo} alt="" className="w-12 h-12 object-contain" />
              )}
              <div>
                <h1 className="text-xl font-bold">{business?.name}</h1>
                {business?.address && <p className="text-sm text-slate-500 mt-0.5">{business.address}</p>}
                {business?.city && <p className="text-sm text-slate-500">{business.city}</p>}
                {(business?.email || business?.phone) && (
                  <p className="text-sm text-slate-500">{[business.email, business.phone].filter(Boolean).join(" · ")}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold" style={{ color: brandColor }}>INVOICE</p>
              <p className="font-mono font-bold text-lg mt-1">{invoice.invoiceNumber}</p>
              <p className="text-sm text-slate-500 mt-2">Issued: {formatDate(invoice.issueDate)}</p>
              <p className="text-sm text-slate-500">Due: {formatDate(invoice.dueDate)}</p>
            </div>
          </div>

          {/* Bill to + amount */}
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

          {/* Items */}
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
                  <td className="py-2 px-3 text-right font-semibold">
                    {formatNaira(item.quantity * item.unitPrice * (1 + item.taxRate / 100))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-56 space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{formatNaira(invoice.subtotal)}</span></div>
              {invoice.taxAmount > 0 && (
                <div className="flex justify-between text-slate-600"><span>Tax</span><span>{formatNaira(invoice.taxAmount)}</span></div>
              )}
              {invoice.discount > 0 && (
                <div className="flex justify-between text-emerald-600"><span>Discount</span><span>–{formatNaira(invoice.discount)}</span></div>
              )}
              <div className="flex justify-between pt-2 font-bold text-base" style={{ borderTop: `2px solid ${brandColor}` }}>
                <span>TOTAL</span>
                <span style={{ color: brandColor }}>{formatNaira(invoice.total)}</span>
              </div>
            </div>
          </div>

          {/* Bank + notes */}
          {(hasBankDetails || invoice.paymentInstructions || invoice.notes) && (
            <div className="grid grid-cols-2 gap-6 mb-8 p-4 rounded-lg" style={{ backgroundColor: "#f8fafc" }}>
              {hasBankDetails && (
                <div>
                  <p className="text-xs font-bold uppercase text-slate-400 mb-2">Bank Details</p>
                  <div className="text-sm space-y-0.5 text-slate-700">
                    {business?.bankName && <p>{business.bankName}</p>}
                    {business?.accountNumber && <p>{business.accountNumber}</p>}
                    {business?.accountName && <p>{business.accountName}</p>}
                  </div>
                </div>
              )}
              {(invoice.paymentInstructions || invoice.notes) && (
                <div>
                  {invoice.paymentInstructions && (
                    <>
                      <p className="text-xs font-bold uppercase text-slate-400 mb-1">Payment Instructions</p>
                      <p className="text-sm text-slate-700 mb-3">{invoice.paymentInstructions}</p>
                    </>
                  )}
                  {invoice.notes && (
                    <>
                      <p className="text-xs font-bold uppercase text-slate-400 mb-1">Notes</p>
                      <p className="text-sm text-slate-600 italic">{invoice.notes}</p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Signature */}
          {business?.signatureUrl && (
            <div className="mb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={business.signatureUrl} alt="Signature" className="h-14 object-contain" />
              <div className="mt-1 w-40 pt-1" style={{ borderTop: "1px solid #cbd5e1" }}>
                <p className="text-xs text-slate-500">Authorized Signature</p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-4 text-center" style={{ borderTop: `1px solid ${brandColor}40` }}>
            {business?.customFooter && (
              <p className="text-sm text-slate-600 mb-1">{business.customFooter}</p>
            )}
            <p className="text-xs text-slate-400">Generated with InvoiceHive · invoicehive.ng</p>
          </div>
        </div>
      </div>
    </>
  );
}
