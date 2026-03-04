import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { invoices, invoiceItems } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

function toNum(v: string | null | undefined): number {
  return v ? parseFloat(v) : 0;
}

function toStr(v: Date | string | null | undefined): string {
  if (!v) return "";
  return v instanceof Date ? v.toISOString() : String(v);
}

function mapInvoice(inv: typeof invoices.$inferSelect & { items?: typeof invoiceItems.$inferSelect[] }) {
  return {
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    clientId: inv.clientId ?? "",
    status: inv.status,
    issueDate: toStr(inv.issueDate),
    dueDate: toStr(inv.dueDate),
    subtotal: toNum(inv.subtotal),
    taxAmount: toNum(inv.taxAmount),
    discount: toNum(inv.discount),
    total: toNum(inv.total),
    notes: inv.notes ?? "",
    paymentInstructions: inv.paymentInstructions ?? "",
    showPaymentDetails: inv.showPaymentDetails ?? true,
    whtRate: toNum(inv.whtRate),
    currency: inv.currency ?? "NGN",
    isRecurring: inv.isRecurring ?? false,
    recurringInterval: inv.recurringInterval ?? undefined,
    nextInvoiceDate: inv.nextInvoiceDate ?? undefined,
    createdAt: toStr(inv.createdAt),
    updatedAt: toStr(inv.updatedAt),
    items: (inv.items ?? []).map((item) => ({
      id: item.id,
      description: item.description,
      quantity: toNum(item.quantity),
      unitPrice: toNum(item.unitPrice),
      taxRate: toNum(item.taxRate),
    })),
  };
}

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  const result = await db.query.invoices.findFirst({
    where: and(eq(invoices.id, id), eq(invoices.userId, userId)),
    with: { items: true },
  });

  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(mapInvoice(result));
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const { id } = await params;
  const body = await req.json();

  const allowedFields = [
    "status", "issueDate", "dueDate", "notes", "paymentInstructions",
    "clientId", "subtotal", "taxAmount", "discount", "total", "showPaymentDetails",
    "whtRate", "currency", "isRecurring", "recurringInterval", "nextInvoiceDate",
  ] as const;

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      if (["subtotal", "taxAmount", "discount", "total", "whtRate"].includes(field)) {
        updates[field] = String(body[field]);
      } else {
        updates[field] = body[field];
      }
    }
  }

  const [updated] = await db
    .update(invoices)
    .set(updates)
    .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (Array.isArray(body.items)) {
    await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
    let newItems: typeof invoiceItems.$inferSelect[] = [];
    if (body.items.length > 0) {
      newItems = await db
        .insert(invoiceItems)
        .values(
          body.items.map((item: { description: string; quantity: number; unitPrice: number; taxRate: number }) => ({
            invoiceId: id,
            description: item.description,
            quantity: String(item.quantity),
            unitPrice: String(item.unitPrice),
            taxRate: String(item.taxRate),
          }))
        )
        .returning();
    }
    return NextResponse.json(mapInvoice({ ...updated, items: newItems }));
  }

  const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id));
  return NextResponse.json(mapInvoice({ ...updated, items }));
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  await db.delete(invoices).where(and(eq(invoices.id, id), eq(invoices.userId, userId)));
  return NextResponse.json({ success: true });
}
