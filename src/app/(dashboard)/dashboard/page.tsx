"use client";
import { useMemo } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import {
  getDashboardStats, getMonthlyRevenue, formatNaira, formatDate,
  getStatusColor, getStatusDot, getStatusLabel,
} from "@/lib/utils";
import {
  IconTrendingUp, IconFileText, IconAlertCircle, IconClock,
  IconPlus, IconChevronRight, IconEye,
} from "@/components/Icons";

function RevenueChart({ data }: { data: { month: string; revenue: number }[] }) {
  const max = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <div className="mt-6">
      <div className="flex items-end gap-3 h-40">
        {data.map((d, i) => {
          const heightPct = (d.revenue / max) * 100;
          const isLast = i === data.length - 1;
          return (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-2 group">
              <div className="relative w-full flex items-end justify-center" style={{ height: "120px" }}>
                {d.revenue > 0 && (
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                    {formatNaira(d.revenue)}
                  </div>
                )}
                <div
                  className={`w-full rounded-t-lg transition-all duration-700 ${
                    isLast ? "bg-amber-500" : "bg-amber-200 group-hover:bg-amber-400"
                  }`}
                  style={{
                    height: `${heightPct}%`,
                    minHeight: d.revenue > 0 ? "4px" : "2px",
                    opacity: d.revenue === 0 ? 0.3 : 1,
                  }}
                />
              </div>
              <span className={`text-xs font-medium ${isLast ? "text-amber-600" : "text-slate-400"}`}>
                {d.month}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({
  title, value, sub, icon: Icon, color, delay = 0,
}: {
  title: string;
  value: string;
  sub: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  color: string;
  delay?: number;
}) {
  return (
    <div
      className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 stat-card hover:shadow-md transition-shadow"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-500 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">{value}</p>
          <p className="text-xs text-slate-400 mt-1">{sub}</p>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { invoices, clients } = useApp();

  const stats = useMemo(() => getDashboardStats(invoices), [invoices]);
  const monthlyData = useMemo(() => getMonthlyRevenue(invoices), [invoices]);
  const recentInvoices = useMemo(
    () => [...invoices].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
    [invoices]
  );

  function getClientName(clientId: string) {
    return clients.find((c) => c.id === clientId)?.name ?? "Unknown Client";
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Good morning! 👋</h2>
          <p className="text-slate-500 text-sm mt-0.5">Here's what's happening with your business today.</p>
        </div>
        <Link
          href="/invoices/new"
          className="hidden sm:flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm"
        >
          <IconPlus size={18} />
          New Invoice
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 stagger-children">
        <StatCard
          title="Total Revenue"
          value={formatNaira(stats.totalRevenue)}
          sub={`${stats.paidCount} paid invoice${stats.paidCount !== 1 ? "s" : ""}`}
          icon={IconTrendingUp}
          color="bg-emerald-500"
          delay={0}
        />
        <StatCard
          title="Outstanding"
          value={formatNaira(stats.outstanding)}
          sub={`${stats.outstandingCount} invoice${stats.outstandingCount !== 1 ? "s" : ""} awaiting payment`}
          icon={IconClock}
          color="bg-blue-500"
          delay={60}
        />
        <StatCard
          title="Overdue"
          value={formatNaira(stats.overdueAmount)}
          sub={`${stats.overdueCount} invoice${stats.overdueCount !== 1 ? "s" : ""} past due`}
          icon={IconAlertCircle}
          color="bg-red-500"
          delay={120}
        />
        <StatCard
          title="Total Invoices"
          value={String(stats.total)}
          sub={`${stats.draftCount} draft${stats.draftCount !== 1 ? "s" : ""}, ${stats.total - stats.draftCount} sent`}
          icon={IconFileText}
          color="bg-amber-500"
          delay={180}
        />
      </div>

      {/* Charts + activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="xl:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">Revenue Overview</h3>
              <p className="text-slate-400 text-sm">Last 6 months · Paid invoices only</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-amber-200 rounded-sm" />
                <span className="text-xs text-slate-400">Previous</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-amber-500 rounded-sm" />
                <span className="text-xs text-slate-500 font-medium">Current</span>
              </div>
            </div>
          </div>
          <RevenueChart data={monthlyData} />

          {/* Summary row */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-slate-100">
            <div className="text-center">
              <p className="text-xl font-bold text-slate-900">{formatNaira(stats.totalRevenue)}</p>
              <p className="text-xs text-slate-400 mt-0.5">Total earned</p>
            </div>
            <div className="text-center border-x border-slate-100">
              <p className="text-xl font-bold text-emerald-600">
                {stats.paidCount > 0 ? formatNaira(stats.totalRevenue / stats.paidCount) : "₦0"}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Avg invoice</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-slate-900">{clients.length}</p>
              <p className="text-xs text-slate-400 mt-0.5">Active clients</p>
            </div>
          </div>
        </div>

        {/* Quick actions + invoice breakdown */}
        <div className="space-y-5">
          {/* Quick actions */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { href: "/invoices/new", label: "Create Invoice", emoji: "📄", color: "bg-amber-50 hover:bg-amber-100 text-amber-800" },
                { href: "/clients", label: "Add Client", emoji: "👤", color: "bg-blue-50 hover:bg-blue-100 text-blue-800" },
                { href: "/expenses", label: "Log Expense", emoji: "💳", color: "bg-emerald-50 hover:bg-emerald-100 text-emerald-800" },
                { href: "/reports", label: "View Reports", emoji: "📊", color: "bg-purple-50 hover:bg-purple-100 text-purple-800" },
              ].map(({ href, label, emoji, color }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${color}`}
                >
                  <span>{emoji}</span>
                  {label}
                  <IconChevronRight size={14} className="ml-auto opacity-50" />
                </Link>
              ))}
            </div>
          </div>

          {/* Invoice status breakdown */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Invoice Status</h3>
            <div className="space-y-3">
              {(
                [
                  { label: "Paid", count: stats.paidCount, color: "bg-emerald-500" },
                  { label: "Outstanding", count: stats.outstandingCount, color: "bg-blue-500" },
                  { label: "Overdue", count: stats.overdueCount, color: "bg-red-500" },
                  { label: "Draft", count: stats.draftCount, color: "bg-slate-300" },
                ] as const
              ).map(({ label, count, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                  <span className="text-sm text-slate-600 flex-1">{label}</span>
                  <span className="text-sm font-semibold text-slate-900">{count}</span>
                  <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${color} rounded-full transition-all`}
                      style={{ width: stats.total ? `${(count / stats.total) * 100}%` : "0%" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent invoices */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Recent Invoices</h3>
          <Link href="/invoices" className="text-amber-600 hover:text-amber-700 text-sm font-medium flex items-center gap-1">
            View all <IconChevronRight size={14} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Client</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Due Date</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm font-semibold text-slate-900">{inv.invoiceNumber}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-700">{getClientName(inv.clientId)}</span>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <span className="text-sm text-slate-500">{formatDate(inv.dueDate)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-slate-900">{formatNaira(inv.total)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(inv.status)}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(inv.status)}`} />
                      {getStatusLabel(inv.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg inline-flex"
                    >
                      <IconEye size={16} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {recentInvoices.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <IconFileText size={28} className="text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">No invoices yet</p>
            <p className="text-slate-400 text-sm mt-1">Create your first invoice to get started</p>
            <Link
              href="/invoices/new"
              className="inline-flex items-center gap-2 mt-4 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all"
            >
              <IconPlus size={16} /> Create Invoice
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
