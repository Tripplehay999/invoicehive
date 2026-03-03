import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { invoices, invoiceItems } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

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

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;

  const result = await db.query.invoices.findMany({
    where: eq(invoices.userId, userId),
    with: { items: true },
    orderBy: (table, { desc: d }) => [d(table.createdAt)],
  });

  return NextResponse.json(result.map(mapInvoice));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const body = await req.json();

  const [invoice] = await db
    .insert(invoices)
    .values({
      userId,
      clientId: body.clientId || null,
      invoiceNumber: body.invoiceNumber,
      status: body.status ?? "draft",
      issueDate: body.issueDate,
      dueDate: body.dueDate,
      subtotal: String(body.subtotal ?? 0),
      taxAmount: String(body.taxAmount ?? 0),
      discount: String(body.discount ?? 0),
      total: String(body.total ?? 0),
      notes: body.notes ?? "",
      paymentInstructions: body.paymentInstructions ?? "",
    })
    .returning();

  const rawItems = body.items ?? [];
  let insertedItems: typeof invoiceItems.$inferSelect[] = [];
  if (rawItems.length > 0) {
    insertedItems = await db
      .insert(invoiceItems)
      .values(
        rawItems.map((item: { description: string; quantity: number; unitPrice: number; taxRate: number }) => ({
          invoiceId: invoice.id,
          description: item.description,
          quantity: String(item.quantity),
          unitPrice: String(item.unitPrice),
          taxRate: String(item.taxRate),
        }))
      )
      .returning();
  }

  return NextResponse.json(mapInvoice({ ...invoice, items: insertedItems }), { status: 201 });
}
