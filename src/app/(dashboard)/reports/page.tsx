"use client";
import { useMemo } from "react";
import { useApp } from "@/lib/store";
import { formatNaira, getMonthlyRevenue, getDashboardStats, getCategoryColor } from "@/lib/utils";
import { IconDownload, IconTrendingUp, IconBarChart } from "@/components/Icons";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const EXPENSE_CATEGORIES = [
  { value: "rent", label: "Rent", emoji: "🏢" },
  { value: "utilities", label: "Utilities", emoji: "⚡" },
  { value: "salaries", label: "Salaries", emoji: "👥" },
  { value: "marketing", label: "Marketing", emoji: "📢" },
  { value: "supplies", label: "Supplies", emoji: "📦" },
  { value: "travel", label: "Travel", emoji: "✈️" },
  { value: "software", label: "Software", emoji: "💻" },
  { value: "other", label: "Other", emoji: "📌" },
];

function BarChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-3 h-36 mt-4">
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        const isLast = i === data.length - 1;
        return (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5 group relative">
            {d.value > 0 && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                {formatNaira(d.value)}
              </div>
            )}
            <div className="w-full flex items-end justify-center" style={{ height: "110px" }}>
              <div
                className={`w-full rounded-t-lg transition-all duration-700 ${isLast ? color : `${color} opacity-50 group-hover:opacity-100`}`}
                style={{ height: `${pct}%`, minHeight: d.value > 0 ? "4px" : "2px" }}
              />
            </div>
            <span className={`text-[10px] font-medium ${isLast ? "text-slate-700" : "text-slate-400"}`}>{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function ReportsPage() {
  const { invoices, expenses, clients } = useApp();

  const stats = useMemo(() => getDashboardStats(invoices), [invoices]);
  const monthlyRevenue = useMemo(() => getMonthlyRevenue(invoices), [invoices]);

  // Monthly expenses for last 6 months
  const monthlyExpenses = useMemo(() => {
    const now = new Date();
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const total = expenses
        .filter((e) => {
          const ed = new Date(e.date);
          return ed.getMonth() === d.getMonth() && ed.getFullYear() === d.getFullYear();
        })
        .reduce((s, e) => s + e.amount, 0);
      result.push({ month: MONTHS[d.getMonth()], expenses: total });
    }
    return result;
  }, [expenses]);

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = stats.totalRevenue - totalExpenses;

  // Top clients by revenue
  const topClients = useMemo(() => {
    return clients
      .map((c) => {
        const revenue = invoices
          .filter((i) => i.clientId === c.id && i.status === "paid")
          .reduce((s, i) => s + i.total, 0);
        const count = invoices.filter((i) => i.clientId === c.id).length;
        return { ...c, revenue, count };
      })
      .filter((c) => c.count > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [clients, invoices]);

  // Expense by category
  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => { map[e.category] = (map[e.category] || 0) + e.amount; });
    return Object.entries(map)
      .map(([cat, amount]) => ({ cat, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses]);

  // Invoice status breakdown
  const statusBreakdown = useMemo(() => {
    const statuses = ["paid", "sent", "viewed", "overdue", "draft", "cancelled"] as const;
    return statuses.map((s) => ({
      status: s,
      count: invoices.filter((i) => i.status === s).length,
      amount: invoices.filter((i) => i.status === s).reduce((sum, i) => sum + i.total, 0),
    })).filter((s) => s.count > 0);
  }, [invoices]);

  function handleExport() {
    const rows = [
      ["Invoice #", "Client", "Status", "Issue Date", "Due Date", "Amount"],
      ...invoices.map((inv) => [
        inv.invoiceNumber,
        clients.find((c) => c.id === inv.clientId)?.name ?? "",
        inv.status,
        inv.issueDate,
        inv.dueDate,
        inv.total.toString(),
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoicehive-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Reports</h2>
          <p className="text-slate-500 text-sm">Financial overview & insights</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm text-sm"
        >
          <IconDownload size={16} /> Export CSV
        </button>
      </div>

      {/* P&L summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
            <IconTrendingUp size={16} className="text-emerald-500" /> Total Revenue
          </div>
          <p className="text-3xl font-bold text-emerald-600">{formatNaira(stats.totalRevenue)}</p>
          <p className="text-xs text-slate-400 mt-1">From {stats.paidCount} paid invoices</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
            <IconBarChart size={16} className="text-red-500" /> Total Expenses
          </div>
          <p className="text-3xl font-bold text-red-600">{formatNaira(totalExpenses)}</p>
          <p className="text-xs text-slate-400 mt-1">Across {expenses.length} transactions</p>
        </div>
        <div className={`rounded-2xl p-6 shadow-sm border ${netProfit >= 0 ? "bg-emerald-500 border-emerald-400" : "bg-red-500 border-red-400"}`}>
          <p className="text-white/80 text-sm mb-2 font-medium">Net Profit</p>
          <p className="text-3xl font-bold text-white">{formatNaira(Math.abs(netProfit))}</p>
          <p className="text-white/70 text-xs mt-1">
            {netProfit >= 0 ? "↑ Profitable period" : "↓ Running at a loss"}
          </p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Revenue chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-slate-900">Monthly Revenue</h3>
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">Paid invoices</span>
          </div>
          <p className="text-slate-400 text-sm">Last 6 months</p>
          <BarChart
            data={monthlyRevenue.map((d) => ({ label: d.month, value: d.revenue }))}
            color="bg-amber-500"
          />
        </div>

        {/* Expense chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-slate-900">Monthly Expenses</h3>
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">All categories</span>
          </div>
          <p className="text-slate-400 text-sm">Last 6 months</p>
          <BarChart
            data={monthlyExpenses.map((d) => ({ label: d.month, value: d.expenses }))}
            color="bg-red-400"
          />
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Top clients */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-900 mb-5">Top Clients</h3>
          {topClients.length === 0 ? (
            <p className="text-slate-400 text-sm">No paid invoices yet</p>
          ) : (
            <div className="space-y-4">
              {topClients.map((c, i) => {
                const pct = stats.totalRevenue > 0 ? (c.revenue / stats.totalRevenue) * 100 : 0;
                const colors = ["bg-amber-500", "bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-pink-500"];
                return (
                  <div key={c.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 ${colors[i]} rounded-full flex items-center justify-center`}>
                          <span className="text-white text-[9px] font-bold">{i + 1}</span>
                        </div>
                        <span className="text-sm font-medium text-slate-900">{c.name}</span>
                      </div>
                      <span className="text-sm font-bold text-slate-900">{formatNaira(c.revenue)}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${colors[i]} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{c.count} invoice{c.count !== 1 ? "s" : ""} · {pct.toFixed(0)}% of revenue</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Expense breakdown */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-900 mb-5">Expense Breakdown</h3>
          {expenseByCategory.length === 0 ? (
            <p className="text-slate-400 text-sm">No expenses logged yet</p>
          ) : (
            <div className="space-y-3">
              {expenseByCategory.map(({ cat, amount }) => {
                const catInfo = EXPENSE_CATEGORIES.find((c) => c.value === cat);
                const pct = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span>{catInfo?.emoji}</span>
                        <span className="text-sm text-slate-700">{catInfo?.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">{pct.toFixed(0)}%</span>
                        <span className="text-sm font-semibold text-slate-900">{formatNaira(amount)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getCategoryColor(cat).replace(/text-\S+/, "").replace("bg-", "bg-").split(" ")[0]}`}
                        style={{ width: `${pct}%`, background: cat === "rent" ? "#8b5cf6" : cat === "utilities" ? "#3b82f6" : cat === "salaries" ? "#f59e0b" : cat === "marketing" ? "#ec4899" : cat === "travel" ? "#f97316" : cat === "software" ? "#6366f1" : cat === "supplies" ? "#14b8a6" : "#94a3b8" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Invoice status */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-900 mb-5">Invoice Status Overview</h3>
          {statusBreakdown.length === 0 ? (
            <p className="text-slate-400 text-sm">No invoices yet</p>
          ) : (
            <div className="space-y-3">
              {statusBreakdown.map(({ status, count, amount }) => {
                const colors: Record<string, string> = {
                  paid: "bg-emerald-500", sent: "bg-blue-500", viewed: "bg-purple-500",
                  overdue: "bg-red-500", draft: "bg-slate-300", cancelled: "bg-slate-200",
                };
                const pct = invoices.length > 0 ? (count / invoices.length) * 100 : 0;
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${colors[status]}`} />
                        <span className="text-sm text-slate-700 capitalize">{status}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">{count} inv.</span>
                        <span className="text-sm font-semibold text-slate-900">{formatNaira(amount)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${colors[status]}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Outstanding vs collected summary */}
          <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-2 gap-3">
            <div className="text-center bg-emerald-50 rounded-xl p-3">
              <p className="text-emerald-700 font-bold">{formatNaira(stats.totalRevenue)}</p>
              <p className="text-xs text-emerald-600 mt-0.5">Collected</p>
            </div>
            <div className="text-center bg-amber-50 rounded-xl p-3">
              <p className="text-amber-700 font-bold">{formatNaira(stats.outstanding + stats.overdueAmount)}</p>
              <p className="text-xs text-amber-600 mt-0.5">Pending</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
