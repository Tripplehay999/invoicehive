import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invoices, users } from "@/lib/db/schema";
import { eq, gte, lt, and, count, sum, avg, desc, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalInvoicesRow,
    createdTodayRow,
    overdueRow,
    monthlyVolumeRow,
    avgValueRow,
    statusBreakdown,
  ] = await Promise.all([
    db.select({ count: count() }).from(invoices),
    db.select({ count: count() }).from(invoices).where(gte(invoices.createdAt, todayStart)),
    db.select({ count: count() }).from(invoices).where(eq(invoices.status, "overdue")),
    db.select({ total: sum(invoices.total) }).from(invoices).where(gte(invoices.createdAt, thisMonthStart)),
    db.select({ avg: avg(invoices.total) }).from(invoices),
    db
      .select({ status: invoices.status, count: count() })
      .from(invoices)
      .groupBy(invoices.status),
  ]);

  // Top 10 users by invoice volume
  const topUsers = await db
    .select({
      userId: invoices.userId,
      email: users.email,
      name: users.name,
      businessName: users.businessName,
      invoiceCount: count(invoices.id),
      totalVolume: sum(invoices.total),
    })
    .from(invoices)
    .leftJoin(users, eq(invoices.userId, users.id))
    .groupBy(invoices.userId, users.email, users.name, users.businessName)
    .orderBy(desc(sum(invoices.total)))
    .limit(10);

  return NextResponse.json({
    totalInvoices: totalInvoicesRow[0]?.count ?? 0,
    createdToday: createdTodayRow[0]?.count ?? 0,
    overdueCount: overdueRow[0]?.count ?? 0,
    monthlyVolume: parseFloat(monthlyVolumeRow[0]?.total ?? "0"),
    avgInvoiceValue: parseFloat(avgValueRow[0]?.avg ?? "0"),
    statusBreakdown: statusBreakdown.map((r) => ({ status: r.status, count: r.count })),
    topUsers: topUsers.map((u) => ({
      userId: u.userId,
      email: u.email ?? "",
      name: u.name ?? "",
      businessName: u.businessName ?? "",
      invoiceCount: u.invoiceCount,
      totalVolume: parseFloat(u.totalVolume ?? "0"),
    })),
  });
}
