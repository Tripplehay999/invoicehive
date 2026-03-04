import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, invoices } from "@/lib/db/schema";
import { eq, ilike, or, count, desc, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const plan = searchParams.get("plan") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 20;
  const offset = (page - 1) * limit;

  // Build where conditions
  const conditions = [];
  if (search) {
    conditions.push(
      or(
        ilike(users.email, `%${search}%`),
        ilike(users.name, `%${search}%`),
        ilike(users.businessName, `%${search}%`)
      )
    );
  }
  if (plan && plan !== "all") {
    conditions.push(eq(users.plan, plan));
  }

  const where = conditions.length > 0
    ? conditions.reduce((acc, c) => sql`${acc} AND ${c}`)
    : undefined;

  const [allUsers, totalRow] = await Promise.all([
    db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      plan: users.plan,
      role: users.role,
      isSuspended: users.isSuspended,
      createdAt: users.createdAt,
      lastLoginAt: users.lastLoginAt,
      businessName: users.businessName,
    })
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(users).where(where),
  ]);

  // Get invoice counts for these users
  const userIds = allUsers.map((u) => u.id);
  const invoiceCounts: Record<string, number> = {};
  if (userIds.length > 0) {
    const rows = await db
      .select({ userId: invoices.userId, count: count() })
      .from(invoices)
      .where(sql`${invoices.userId} = ANY(ARRAY[${sql.join(userIds.map(id => sql`${id}::uuid`), sql`, `)}])`)
      .groupBy(invoices.userId);
    for (const r of rows) invoiceCounts[r.userId] = r.count;
  }

  return NextResponse.json({
    users: allUsers.map((u) => ({ ...u, invoiceCount: invoiceCounts[u.id] ?? 0 })),
    total: totalRow[0]?.count ?? 0,
    page,
    totalPages: Math.ceil((totalRow[0]?.count ?? 0) / limit),
  });
}
