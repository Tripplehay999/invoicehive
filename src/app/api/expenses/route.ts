import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { expenses } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

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

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const result = await db
    .select()
    .from(expenses)
    .where(eq(expenses.userId, userId))
    .orderBy(desc(expenses.date));

  return NextResponse.json(result.map(mapExpense));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const body = await req.json();

  if (!body.description || body.amount === undefined || !body.date) {
    return NextResponse.json({ error: "description, amount, and date are required" }, { status: 400 });
  }

  const [expense] = await db
    .insert(expenses)
    .values({
      userId,
      description: body.description,
      amount: String(body.amount),
      category: body.category ?? "other",
      date: body.date,
      notes: body.notes ?? "",
    })
    .returning();

  return NextResponse.json(mapExpense(expense), { status: 201 });
}
