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
    const msg = encodeURIComponent(
      `Hello ${client.name},\n\nPlease find your invoice below:\n\n` +
      `Invoice #: ${invoice.invoiceNumber}\n` +
      `Amount: ${formatNaira(invoice.total)}\n` +
      `Due: ${formatDate(invoice.dueDate)}\n\n` +
      `${invoice.paymentInstructions}\n\n` +
      `Thank you for your business!\n${business?.name ?? ""}`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  }

  // Auto-verify if Paystack redirected back with ?paid=1
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
      if (data.authorizationUrl) {
        setPaymentLink(data.authorizationUrl);
      }
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

  return (
    <>
      {/* Screen view */}
      <div className="max-w-4xl mx-auto animate-fade-in no-print">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Invoice preview */}
          <div className="lg:col-span-2">
            <div ref={printRef} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              {/* Invoice header */}
              <div className="bg-slate-900 p-8 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold text-sm">IH</span>
                      </div>
                      <div>
                        <p className="font-bold text-white">{business?.name ?? "Your Business"}</p>
                        <p className="text-slate-400 text-xs">{business?.city}</p>
                      </div>
                    </div>
                    <p className="text-slate-400 text-sm">{business?.email}</p>
                    <p className="text-slate-400 text-sm">{business?.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 text-xs uppercase tracking-widest font-semibold mb-1">Invoice</p>
                    <p className="text-xl font-bold font-mono">{invoice.invoiceNumber}</p>
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-end gap-3 text-sm">
                        <span className="text-slate-400">Issued:</span>
                        <span className="text-white">{formatDate(invoice.issueDate)}</span>
                      </div>
                      <div className="flex justify-end gap-3 text-sm">
                        <span className="text-slate-400">Due:</span>
                        <span className={`font-semibold ${invoice.status === "overdue" ? "text-red-400" : "text-white"}`}>
                          {formatDate(invoice.dueDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bill to */}
              <div className="px-8 py-6 bg-slate-50 border-b border-slate-100">
                <p className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-2">Bill To</p>
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
                {client?.city && (
                  <p className="text-slate-400 text-sm mt-0.5">{client.city}</p>
                )}
              </div>

              {/* Line items */}
              <div className="px-8 py-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-900">
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
                        <tr key={item.id} className="py-3">
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
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>VAT / Tax</span><span>{formatNaira(invoice.taxAmount)}</span>
                  </div>
                  {invoice.discount > 0 && (
                    <div className="flex justify-between text-sm text-emerald-600">
                      <span>Discount</span><span>–{formatNaira(invoice.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t-2 border-slate-900 pt-2 font-bold text-slate-900">
                    <span>Total</span>
                    <span className="text-amber-600 text-lg">{formatNaira(invoice.total)}</span>
                  </div>
                </div>
              </div>

              {/* Payment + Notes */}
              {(invoice.paymentInstructions || invoice.notes) && (
                <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {invoice.paymentInstructions && (
                    <div>
                      <p className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-2">Payment Details</p>
                      <p className="text-sm text-slate-700 leading-relaxed">{invoice.paymentInstructions}</p>
                    </div>
                  )}
                  {invoice.notes && (
                    <div>
                      <p className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-2">Notes</p>
                      <p className="text-sm text-slate-700 leading-relaxed">{invoice.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="px-8 py-4 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-400">
                  Generated with InvoiceHive · invoicehive.ng
                </p>
              </div>
            </div>
          </div>

          {/* Actions sidebar */}
          <div className="space-y-5">
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

            {/* Invoice summary */}
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

            {/* Client info */}
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
                <Link
                  href="/clients"
                  className="mt-4 block text-center text-xs text-amber-600 hover:text-amber-700 font-medium"
                >
                  View all from this client →
                </Link>
              </div>
            )}

            {/* Paystack Payment Link */}
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
        </div>
      </div>

      {/* Print-only view */}
      <div className="print-only p-12 bg-white text-slate-900">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-slate-900">
            <div>
              <h1 className="text-2xl font-bold">{business?.name}</h1>
              <p className="text-sm text-slate-500 mt-1">{business?.address}</p>
              <p className="text-sm text-slate-500">{business?.city}</p>
              <p className="text-sm text-slate-500">{business?.email} · {business?.phone}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-amber-500">INVOICE</p>
              <p className="font-mono font-bold text-lg mt-1">{invoice.invoiceNumber}</p>
              <p className="text-sm text-slate-500 mt-2">Issued: {formatDate(invoice.issueDate)}</p>
              <p className="text-sm text-slate-500">Due: {formatDate(invoice.dueDate)}</p>
            </div>
          </div>

          <div className="mb-8">
            <p className="text-xs uppercase font-bold text-slate-400 mb-2">Bill To</p>
            <p className="font-bold text-lg">{client?.name}</p>
            <p className="text-sm text-slate-500">{client?.email}</p>
            <p className="text-sm text-slate-500">{client?.phone}</p>
          </div>

          <table className="w-full text-sm border-collapse mb-8">
            <thead>
              <tr className="border-b-2 border-slate-900 bg-slate-50">
                <th className="text-left py-2 px-3 font-bold">Description</th>
                <th className="text-center py-2 px-3 font-bold w-12">Qty</th>
                <th className="text-right py-2 px-3 font-bold w-24">Price</th>
                <th className="text-right py-2 px-3 font-bold w-12">Tax</th>
                <th className="text-right py-2 px-3 font-bold w-24">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i) => (
                <tr key={item.id} className={i % 2 === 0 ? "" : "bg-slate-50"}>
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

          <div className="flex justify-end mb-8">
            <div className="w-56 space-y-1.5 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatNaira(invoice.subtotal)}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>{formatNaira(invoice.taxAmount)}</span></div>
              {invoice.discount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>–{formatNaira(invoice.discount)}</span></div>}
              <div className="flex justify-between border-t-2 border-slate-900 pt-2 font-bold text-base">
                <span>TOTAL</span><span>{formatNaira(invoice.total)}</span>
              </div>
            </div>
          </div>

          {invoice.paymentInstructions && (
            <div className="bg-slate-50 rounded p-4 mb-4">
              <p className="text-xs font-bold uppercase mb-1">Payment Instructions</p>
              <p className="text-sm">{invoice.paymentInstructions}</p>
            </div>
          )}
          {invoice.notes && (
            <p className="text-sm text-slate-500 italic">{invoice.notes}</p>
          )}

          <div className="mt-8 pt-4 border-t border-slate-200 text-center text-xs text-slate-400">
            Generated with InvoiceHive · invoicehive.ng
          </div>
        </div>
      </div>
    </>
  );
}
