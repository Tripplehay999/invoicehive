import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { invoices, invoiceItems, clients, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(amount);
}

function toNum(v: string | null | undefined) { return v ? parseFloat(v) : 0; }
function toStr(v: Date | string | null | undefined) {
  if (!v) return "";
  const d = v instanceof Date ? v : new Date(v as string);
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Email service not configured. Add RESEND_API_KEY to environment variables." }, { status: 503 });
  }

  const userId = (session.user as { id: string }).id;
  const { invoiceId, to, message } = await req.json();

  // Load invoice with items
  const invoice = await db.query.invoices.findFirst({
    where: and(eq(invoices.id, invoiceId), eq(invoices.userId, userId)),
    with: { items: true },
  });
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const [client] = invoice.clientId
    ? await db.select().from(clients).where(eq(clients.id, invoice.clientId)).limit(1)
    : [];
  const [business] = await db
    .select({ businessName: users.businessName, brandColor: users.brandColor, paymentLink: users.paymentLink, bankName: users.bankName, accountNumber: users.accountNumber, accountName: users.accountName, customFooter: users.customFooter })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const brandColor = business?.brandColor ?? "#f59e0b";
  const publicUrl = `${process.env.NEXTAUTH_URL}/i/${invoiceId}`;

  const itemRows = invoice.items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;color:#334155">${item.description}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;color:#64748b;text-align:center">${toNum(item.quantity)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;color:#64748b;text-align:right">${formatNaira(toNum(item.unitPrice))}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-weight:600;color:#0f172a;text-align:right">${formatNaira(toNum(item.quantity) * toNum(item.unitPrice) * (1 + toNum(item.taxRate) / 100))}</td>
      </tr>`
    )
    .join("");

  const bankSection = invoice.showPaymentDetails && business?.bankName
    ? `<div style="margin:24px 0;padding:16px;background:#f8fafc;border-radius:8px;border-left:4px solid ${brandColor}">
        <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:700">Bank Details</p>
        <p style="margin:2px 0;font-size:14px;color:#334155">${business.bankName}</p>
        ${business.accountNumber ? `<p style="margin:2px 0;font-size:14px;color:#334155">Account: <strong>${business.accountNumber}</strong></p>` : ""}
        ${business.accountName ? `<p style="margin:2px 0;font-size:14px;color:#334155">Name: ${business.accountName}</p>` : ""}
      </div>`
    : "";

  const payLinkSection = business?.paymentLink
    ? `<div style="text-align:center;margin:24px 0">
        <a href="${business.paymentLink}" style="display:inline-block;background:#10b981;color:#fff;font-weight:700;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:16px">💳 Pay Now</a>
      </div>`
    : "";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:system-ui,-apple-system,sans-serif">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    <!-- Header -->
    <div style="background:${brandColor};padding:32px 40px">
      <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:2px;opacity:0.7;color:${brandColor === "#f59e0b" ? "#1e293b" : "#fff"}">Invoice</p>
      <p style="margin:6px 0 0;font-size:28px;font-weight:800;color:${brandColor === "#f59e0b" ? "#1e293b" : "#fff"};font-family:monospace">${invoice.invoiceNumber}</p>
    </div>
    <!-- Body -->
    <div style="padding:32px 40px">
      ${message ? `<p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.6">${message}</p>` : ""}
      <!-- Summary -->
      <div style="display:flex;justify-content:space-between;margin-bottom:24px">
        <div>
          <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:700">Billed To</p>
          <p style="margin:4px 0 0;font-size:16px;font-weight:700;color:#0f172a">${client?.name ?? "Client"}</p>
        </div>
        <div style="text-align:right">
          <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:700">Amount Due</p>
          <p style="margin:4px 0 0;font-size:22px;font-weight:800;color:${brandColor}">${formatNaira(toNum(invoice.total))}</p>
        </div>
      </div>
      <div style="margin-bottom:24px;font-size:14px;color:#64748b">
        <span>Issued: ${toStr(invoice.issueDate)}</span>
        &nbsp;·&nbsp;
        <span>Due: <strong style="color:#0f172a">${toStr(invoice.dueDate)}</strong></span>
      </div>
      <!-- Items table -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
        <thead>
          <tr style="border-bottom:2px solid ${brandColor}">
            <th style="text-align:left;padding:8px 12px;font-size:12px;color:#64748b;font-weight:700">DESCRIPTION</th>
            <th style="text-align:center;padding:8px 12px;font-size:12px;color:#64748b;font-weight:700;width:60px">QTY</th>
            <th style="text-align:right;padding:8px 12px;font-size:12px;color:#64748b;font-weight:700;width:110px">PRICE</th>
            <th style="text-align:right;padding:8px 12px;font-size:12px;color:#64748b;font-weight:700;width:110px">TOTAL</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
      <!-- Totals -->
      <div style="margin-left:auto;width:220px;margin-bottom:24px">
        <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#64748b">
          <span>Subtotal</span><span>${formatNaira(toNum(invoice.subtotal))}</span>
        </div>
        ${toNum(invoice.taxAmount) > 0 ? `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#64748b"><span>Tax</span><span>${formatNaira(toNum(invoice.taxAmount))}</span></div>` : ""}
        <div style="display:flex;justify-content:space-between;padding:10px 0;font-size:16px;font-weight:800;color:#0f172a;border-top:2px solid ${brandColor};margin-top:4px">
          <span>Total</span><span style="color:${brandColor}">${formatNaira(toNum(invoice.total))}</span>
        </div>
      </div>
      ${payLinkSection}
      ${bankSection}
      <!-- View button -->
      <div style="text-align:center;margin:24px 0">
        <a href="${publicUrl}" style="display:inline-block;background:${brandColor};color:${brandColor === "#f59e0b" ? "#1e293b" : "#fff"};font-weight:700;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px">View Invoice Online →</a>
      </div>
      ${business?.customFooter ? `<p style="text-align:center;font-size:14px;color:#64748b;margin:16px 0 0">${business.customFooter}</p>` : ""}
    </div>
    <!-- Footer -->
    <div style="padding:16px 40px;background:#f8fafc;text-align:center">
      <p style="margin:0;font-size:12px;color:#94a3b8">Sent via <a href="https://invoicehive.ng" style="color:${brandColor};text-decoration:none;font-weight:600">InvoiceHive</a></p>
    </div>
  </div>
</body>
</html>`;

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  const fromName = business?.businessName || "InvoiceHive";
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  const { error } = await resend.emails.send({
    from: `${fromName} <${fromEmail}>`,
    to: [to],
    subject: `Invoice ${invoice.invoiceNumber} from ${fromName}`,
    html,
  });

  if (error) {
    console.error("Resend error:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }

  return NextResponse.json({ sent: true });
}
