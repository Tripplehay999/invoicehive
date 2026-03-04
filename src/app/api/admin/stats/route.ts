import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, invoices } from "@/lib/db/schema";
import { eq, gte, lt, and, sql, count, sum } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin-auth";

const PLAN_PRICES: Record<string, number> = { free: 0, pro: 5000, business: 15000 };

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    totalUsersRow,
    activeUsersRow,
    newTodayRow,
    thisMonthSignupsRow,
    lastMonthSignupsRow,
    suspendedRow,
    totalInvoicesRow,
    totalVolumeRow,
    allUsersPlans,
  ] = await Promise.all([
    db.select({ count: count() }).from(users),
    db.select({ count: count() }).from(users).where(gte(users.lastLoginAt, thirtyDaysAgo)),
    db.select({ count: count() }).from(users).where(gte(users.createdAt, todayStart)),
    db.select({ count: count() }).from(users).where(gte(users.createdAt, thisMonthStart)),
    db.select({ count: count() }).from(users).where(
      and(gte(users.createdAt, lastMonthStart), lt(users.createdAt, thisMonthStart))
    ),
    db.select({ count: count() }).from(users).where(eq(users.isSuspended, true)),
    db.select({ count: count() }).from(invoices),
    db.select({ total: sum(invoices.total) }).from(invoices),
    db.select({ plan: users.plan }).from(users),
  ]);

  const totalUsers = totalUsersRow[0]?.count ?? 0;
  const activeUsers = activeUsersRow[0]?.count ?? 0;
  const newToday = newTodayRow[0]?.count ?? 0;
  const thisMonthSignups = thisMonthSignupsRow[0]?.count ?? 0;
  const lastMonthSignups = lastMonthSignupsRow[0]?.count ?? 0;
  const suspended = suspendedRow[0]?.count ?? 0;
  const totalInvoices = totalInvoicesRow[0]?.count ?? 0;
  const totalVolume = parseFloat(totalVolumeRow[0]?.total ?? "0");

  const mrr = allUsersPlans.reduce((acc, u) => acc + (PLAN_PRICES[u.plan] ?? 0), 0);
  const monthlyGrowth = lastMonthSignups > 0
    ? Math.round(((thisMonthSignups - lastMonthSignups) / lastMonthSignups) * 100)
    : thisMonthSignups > 0 ? 100 : 0;
  const churnRate = totalUsers > 0 ? Math.round((Number(suspended) / totalUsers) * 100) : 0;

  // Monthly signups for chart (last 6 months)
  const monthlySignups: { month: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const [row] = await db
      .select({ count: count() })
      .from(users)
      .where(and(gte(users.createdAt, start), lt(users.createdAt, end)));
    monthlySignups.push({
      month: start.toLocaleString("en-NG", { month: "short", year: "2-digit" }),
      count: row?.count ?? 0,
    });
  }

  return NextResponse.json({
    totalUsers,
    activeUsers,
    newToday,
    totalInvoices,
    totalVolume,
    mrr,
    monthlyGrowth,
    churnRate,
    monthlySignups,
  });
}
