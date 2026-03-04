import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invoices, invoiceItems, clients, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Public endpoint — no auth required. Returns sanitized invoice data for client-facing view.
type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const invoice = await db.query.invoices.findFirst({
    where: eq(invoices.id, id),
    with: { items: true },
  });

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Fetch client and user (business) separately
  const [client] = invoice.clientId
    ? await db.select().from(clients).where(eq(clients.id, invoice.clientId)).limit(1)
    : [];
  const [user] = await db
    .select({
      name: users.businessName,
      email: users.email,
      phone: users.businessPhone,
      address: users.businessAddress,
      city: users.businessCity,
      logo: users.logoUrl,
      brandColor: users.brandColor,
      customFooter: users.customFooter,
      signatureUrl: users.signatureUrl,
      bankName: users.bankName,
      accountNumber: users.accountNumber,
      accountName: users.accountName,
      paymentLink: users.paymentLink,
    })
    .from(users)
    .where(eq(users.id, invoice.userId))
    .limit(1);

  const toNum = (v: string | null | undefined) => (v ? parseFloat(v) : 0);
  const toStr = (v: Date | string | null | undefined) => {
    if (!v) return "";
    return v instanceof Date ? v.toISOString() : String(v);
  };

  return NextResponse.json({
    invoice: {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      issueDate: toStr(invoice.issueDate),
      dueDate: toStr(invoice.dueDate),
      subtotal: toNum(invoice.subtotal),
      taxAmount: toNum(invoice.taxAmount),
      discount: toNum(invoice.discount),
      total: toNum(invoice.total),
      notes: invoice.notes ?? "",
      paymentInstructions: invoice.paymentInstructions ?? "",
      showPaymentDetails: invoice.showPaymentDetails ?? true,
      items: invoice.items.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: toNum(item.quantity),
        unitPrice: toNum(item.unitPrice),
        taxRate: toNum(item.taxRate),
      })),
    },
    client: client
      ? { name: client.name, email: client.email, phone: client.phone ?? "", city: client.city ?? "" }
      : null,
    business: user ?? null,
  });
}
