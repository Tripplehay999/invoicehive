"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import type { InvoiceStatus } from "@/lib/types";

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(amount);
}

function formatDate(d: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function contrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? "#1e293b" : "#ffffff";
}

const STATUS_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  draft: { label: "Draft", bg: "bg-slate-100", text: "text-slate-600" },
  sent: { label: "Sent", bg: "bg-blue-100", text: "text-blue-700" },
  viewed: { label: "Viewed", bg: "bg-purple-100", text: "text-purple-700" },
  paid: { label: "Paid", bg: "bg-emerald-100", text: "text-emerald-700" },
  overdue: { label: "Overdue", bg: "bg-red-100", text: "text-red-700" },
  cancelled: { label: "Cancelled", bg: "bg-slate-100", text: "text-slate-500" },
};

interface PublicInvoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  discount: number;
  total: number;
  notes: string;
  paymentInstructions: string;
  showPaymentDetails: boolean;
  items: { id: string; description: string; quantity: number; unitPrice: number; taxRate: number }[];
}

interface PublicBusiness {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  logo: string;
  brandColor: string;
  customFooter: string;
  signatureUrl: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  paymentLink: string;
}

interface PublicClient {
  name: string;
  email: string;
  phone: string;
  city: string;
}

export default function PublicInvoicePage() {
  const { id } = useParams<{ id: string }>();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [invoice, setInvoice] = useState<PublicInvoice | null>(null);
  const [client, setClient] = useState<PublicClient | null>(null);
  const [business, setBusiness] = useState<PublicBusiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/invoices/${id}/public`)
      .then((r) => {
        if (!r.ok) { setNotFound(true); return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setInvoice(data.invoice);
        setClient(data.client);
        setBusiness(data.business);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDownloadPDF() {
    if (!invoiceRef.current || !invoice) return;
    setPdfLoading(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const { default: jsPDF } = await import("jspdf");
      const canvas = await html2canvas(invoiceRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * pageW) / canvas.width;
      if (imgH <= pageH) {
        pdf.addImage(imgData, "PNG", 0, 0, pageW, imgH);
      } else {
        let yPos = 0;
        while (yPos < imgH) {
          if (yPos > 0) pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, -yPos, pageW, imgH);
          yPos += pageH;
        }
      }
      pdf.save(`invoice-${invoice.invoiceNumber}.pdf`);
    } finally {
      setPdfLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Loading invoice…</p>
        </div>
      </div>
    );
  }

  if (notFound || !invoice || !business) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-12 shadow-sm">
          <p className="text-4xl mb-4">📄</p>
          <p className="text-slate-900 font-bold text-lg">Invoice not found</p>
          <p className="text-slate-500 text-sm mt-2">This invoice link may be invalid or expired.</p>
        </div>
      </div>
    );
  }

  const brandColor = business.brandColor || "#f59e0b";
  const brandText = contrastColor(brandColor);
  const statusInfo = STATUS_LABELS[invoice.status] ?? STATUS_LABELS.draft;
  const hasBankDetails = invoice.showPaymentDetails && !!(business.bankName || business.accountNumber);

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4">
      {/* Top bar */}
      <div className="max-w-2xl mx-auto mb-4 flex items-center justify-between">
        <div className="text-sm text-slate-500">
          Sent by <span className="font-semibold text-slate-700">{business.name}</span>
        </div>
        <div className="flex gap-2">
          {business.paymentLink && invoice.status !== "paid" && (
            <a
              href={business.paymentLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all"
              style={{ backgroundColor: "#10b981" }}
            >
              💳 Pay Now
            </a>
          )}
          <button
            onClick={handleDownloadPDF}
            disabled={pdfLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-60"
          >
            {pdfLoading ? (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
            {pdfLoading ? "Generating…" : "Download PDF"}
          </button>
        </div>
      </div>

      {/* Invoice card */}
      <div className="max-w-2xl mx-auto">
        <div ref={invoiceRef} className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Accent stripe */}
          <div style={{ backgroundColor: brandColor, height: "5px" }} />

          {/* Header */}
          <div style={{ backgroundColor: brandColor }} className="px-8 pt-7 pb-8">
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-start gap-4">
                {business.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={business.logo} alt={business.name} className="w-14 h-14 rounded-xl object-contain p-1" style={{ backgroundColor: "rgba(255,255,255,0.15)" }} />
                ) : (
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0" style={{ backgroundColor: "rgba(255,255,255,0.2)", color: brandText }}>
                    {business.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-bold text-lg leading-tight" style={{ color: brandText }}>{business.name}</p>
                  {business.city && <p className="text-sm mt-0.5" style={{ color: brandText, opacity: 0.75 }}>{business.city}</p>}
                  {business.email && <p className="text-sm mt-0.5" style={{ color: brandText, opacity: 0.75 }}>{business.email}</p>}
                  {business.phone && <p className="text-sm" style={{ color: brandText, opacity: 0.75 }}>{business.phone}</p>}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs uppercase tracking-widest font-bold mb-1" style={{ color: brandText, opacity: 0.6 }}>Invoice</p>
                <p className="text-2xl font-bold font-mono" style={{ color: brandText }}>{invoice.invoiceNumber}</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold mt-2 ${statusInfo.bg} ${statusInfo.text}`}>
                  {statusInfo.label}
                </span>
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

          {/* Bill to + amount */}
          <div className="px-8 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-1.5">Bill To</p>
              <p className="font-bold text-slate-900 text-lg">{client?.name ?? "—"}</p>
              {client?.email && <p className="text-sm text-slate-500 mt-0.5">{client.email}</p>}
              {client?.phone && <p className="text-sm text-slate-500">{client.phone}</p>}
              {client?.city && <p className="text-sm text-slate-400">{client.city}</p>}
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Amount Due</p>
              <p className="text-2xl font-bold" style={{ color: brandColor }}>{formatNaira(invoice.total)}</p>
            </div>
          </div>

          {/* Items */}
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
            <div className="mt-6 ml-auto w-60 space-y-2">
              <div className="flex justify-between text-sm text-slate-600"><span>Subtotal</span><span>{formatNaira(invoice.subtotal)}</span></div>
              {invoice.taxAmount > 0 && <div className="flex justify-between text-sm text-slate-600"><span>VAT / Tax</span><span>{formatNaira(invoice.taxAmount)}</span></div>}
              {invoice.discount > 0 && <div className="flex justify-between text-sm text-emerald-600"><span>Discount</span><span>–{formatNaira(invoice.discount)}</span></div>}
              <div className="flex justify-between pt-2 font-bold text-slate-900" style={{ borderTop: `2px solid ${brandColor}` }}>
                <span>Total</span>
                <span className="text-lg" style={{ color: brandColor }}>{formatNaira(invoice.total)}</span>
              </div>
            </div>
          </div>

          {/* Bank + notes + payment instructions */}
          {(hasBankDetails || invoice.notes || (invoice.showPaymentDetails && invoice.paymentInstructions)) && (
            <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {hasBankDetails && (
                <div>
                  <p className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-2">Bank Details</p>
                  <div className="space-y-1 text-sm text-slate-700">
                    {business.bankName && <p><span className="text-slate-400">Bank:</span> {business.bankName}</p>}
                    {business.accountNumber && <p><span className="text-slate-400">Account:</span> {business.accountNumber}</p>}
                    {business.accountName && <p><span className="text-slate-400">Name:</span> {business.accountName}</p>}
                  </div>
                </div>
              )}
              {(invoice.notes || (invoice.showPaymentDetails && invoice.paymentInstructions)) && (
                <div>
                  {invoice.showPaymentDetails && invoice.paymentInstructions && (
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
          {business.signatureUrl && (
            <div className="px-8 py-5 border-t border-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={business.signatureUrl} alt="Signature" className="h-14 object-contain" />
              <div className="mt-1 w-44 pt-1 border-t border-slate-300">
                <p className="text-xs text-slate-500">Authorized Signature — {business.name}</p>
              </div>
            </div>
          )}

          {/* Pay Here button (digital only — inside invoice for visual impact) */}
          {business.paymentLink && invoice.status !== "paid" && (
            <div className="px-8 py-5 border-t border-slate-100 text-center">
              <a
                href={business.paymentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-base font-bold text-white transition-all"
                style={{ backgroundColor: "#10b981" }}
              >
                💳 Pay Now — {formatNaira(invoice.total)}
              </a>
            </div>
          )}

          {/* Footer */}
          <div className="px-8 py-4 text-center" style={{ backgroundColor: brandColor + "12", borderTop: `1px solid ${brandColor}30` }}>
            {business.customFooter && <p className="text-sm text-slate-600 mb-1.5">{business.customFooter}</p>}
            <p className="text-xs text-slate-400">
              Sent via <span className="font-semibold" style={{ color: brandColor }}>InvoiceHive</span> · invoicehive.ng
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
