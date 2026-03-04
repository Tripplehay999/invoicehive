"use client";
import { useEffect, useState } from "react";

interface InvoiceStats {
  totalInvoices: number;
  createdToday: number;
  overdueCount: number;
  monthlyVolume: number;
  avgInvoiceValue: number;
  statusBreakdown: { status: string; count: number }[];
  topUsers: {
    userId: string;
    email: string;
    name: string;
    businessName: string;
    invoiceCount: number;
    totalVolume: number;
  }[];
}

function formatNaira(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n);
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-400",
  sent: "bg-blue-400",
  viewed: "bg-purple-400",
  paid: "bg-emerald-400",
  overdue: "bg-red-400",
  cancelled: "bg-slate-300",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft", sent: "Sent", viewed: "Viewed", paid: "Paid", overdue: "Overdue", cancelled: "Cancelled",
};

export default function AdminInvoices() {
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/invoices")
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Invoice Activity</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-slate-200 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!stats) return <div className="text-slate-500 p-4">Failed to load invoice stats.</div>;

  const totalForBreakdown = stats.statusBreakdown.reduce((s, r) => s + r.count, 0) || 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Invoice Activity</h1>
        <p className="text-slate-500 text-sm mt-1">Platform-wide invoice monitoring</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Total Invoices</p>
          <p className="text-2xl font-bold text-amber-700">{stats.totalInvoices.toLocaleString()}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Created Today</p>
          <p className="text-2xl font-bold text-blue-700">{stats.createdToday}</p>
        </div>
        <div className={`border rounded-xl p-5 ${stats.overdueCount > 0 ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-200"}`}>
          <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${stats.overdueCount > 0 ? "text-red-600" : "text-slate-500"}`}>Overdue</p>
          <p className={`text-2xl font-bold ${stats.overdueCount > 0 ? "text-red-700" : "text-slate-700"}`}>{stats.overdueCount}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1">Monthly Volume</p>
          <p className="text-2xl font-bold text-emerald-700">{formatNaira(stats.monthlyVolume)}</p>
        </div>
      </div>

      {/* Avg value + Status breakdown */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-3">Average Invoice Value</h3>
          <p className="text-3xl font-bold text-slate-900">{formatNaira(stats.avgInvoiceValue)}</p>
          <p className="text-slate-400 text-sm mt-1">across all invoices</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-3">Status Breakdown</h3>
          <div className="space-y-2">
            {stats.statusBreakdown
              .sort((a, b) => b.count - a.count)
              .map((row) => (
                <div key={row.status} className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-16">{STATUS_LABELS[row.status] ?? row.status}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-3 rounded-full ${STATUS_COLORS[row.status] ?? "bg-slate-400"}`}
                      style={{ width: `${(row.count / totalForBreakdown) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 w-8 text-right">{row.count}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Top users by volume */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">Top Users by Invoice Volume</h3>
        </div>
        {stats.topUsers.length === 0 ? (
          <p className="text-slate-400 text-sm px-5 py-8 text-center">No invoice data yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Invoices</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Total Volume</th>
              </tr>
            </thead>
            <tbody>
              {stats.topUsers.map((u, i) => (
                <tr key={u.userId} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-400 font-medium">#{i + 1}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{u.businessName || u.name}</p>
                    <p className="text-slate-500 text-xs">{u.email}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700 font-medium">{u.invoiceCount}</td>
                  <td className="px-4 py-3 font-bold text-slate-900">{formatNaira(u.totalVolume)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
