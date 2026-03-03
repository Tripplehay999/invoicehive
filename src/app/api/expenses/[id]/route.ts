import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { expenses } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

function mapExpense(e: typeof expenses.$inferSelect) {
  return {
    id: e.id,
    description: e.description,
    amount: parseFloat(e.amount),
    category: e.category,
    date: typeof e.date === "string" ? e.date : (e.date as Date).toISOString().slice(0, 10),
    notes: e.notes ?? "",
  };
}

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const { id } = await params;
  const body = await req.json();

  const allowed = ["description", "category", "date", "notes"] as const;
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key];
  }
  if (body.amount !== undefined) updates.amount = String(body.amount);

  const [updated] = await db
    .update(expenses)
    .set(updates)
    .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(mapExpense(updated));
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  await db.delete(expenses).where(and(eq(expenses.id, id), eq(expenses.userId, userId)));
  return NextResponse.json({ success: true });
}
