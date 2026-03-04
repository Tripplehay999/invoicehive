"use client";
import { useEffect, useState } from "react";

interface Stats {
  totalUsers: number;
  activeUsers: number;
  newToday: number;
  totalInvoices: number;
  totalVolume: number;
  mrr: number;
  monthlyGrowth: number;
  churnRate: number;
  monthlySignups: { month: string; count: number }[];
}

function formatNaira(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n);
}

function StatCard({
  label,
  value,
  sub,
  color = "amber",
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: "amber" | "emerald" | "blue" | "purple" | "red" | "slate";
}) {
  const colors: Record<string, string> = {
    amber: "bg-amber-50 border-amber-200 text-amber-700",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
    red: "bg-red-50 border-red-200 text-red-700",
    slate: "bg-slate-50 border-slate-200 text-slate-700",
  };

  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs mt-1 opacity-60">{sub}</p>}
    </div>
  );
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => setStats(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return <div className="text-slate-500">Failed to load stats.</div>;

  const maxSignup = Math.max(...stats.monthlySignups.map((m) => m.count), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Command Center</h1>
        <p className="text-slate-500 text-sm mt-1">Platform-wide overview at a glance</p>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={stats.totalUsers.toLocaleString()} color="slate" />
        <StatCard label="Active (30d)" value={stats.activeUsers.toLocaleString()} sub="unique logins" color="blue" />
        <StatCard label="New Today" value={stats.newToday} color="emerald" />
        <StatCard label="Churn Rate" value={`${stats.churnRate}%`} sub="suspended / total" color={stats.churnRate > 5 ? "red" : "slate"} />
        <StatCard label="Total Invoices" value={stats.totalInvoices.toLocaleString()} color="amber" />
        <StatCard label="Invoice Volume" value={formatNaira(stats.totalVolume)} color="amber" />
        <StatCard label="Platform MRR" value={formatNaira(stats.mrr)} sub="subscriptions" color="purple" />
        <StatCard
          label="Monthly Growth"
          value={`${stats.monthlyGrowth > 0 ? "+" : ""}${stats.monthlyGrowth}%`}
          sub="vs last month"
          color={stats.monthlyGrowth > 0 ? "emerald" : stats.monthlyGrowth < 0 ? "red" : "slate"}
        />
      </div>

      {/* Signup chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-800 mb-4">New Signups (Last 6 Months)</h2>
        <div className="flex items-end gap-3 h-32">
          {stats.monthlySignups.map((m) => (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-slate-500 font-medium">{m.count}</span>
              <div
                className="w-full bg-amber-400 rounded-t-md transition-all"
                style={{ height: `${(m.count / maxSignup) * 100}%`, minHeight: m.count > 0 ? "4px" : "0" }}
              />
              <span className="text-xs text-slate-400">{m.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Manage Users", href: "/admin/users", color: "bg-blue-500" },
          { label: "Subscriptions", href: "/admin/subscriptions", color: "bg-purple-500" },
          { label: "Support Tickets", href: "/admin/support", color: "bg-orange-500" },
          { label: "Broadcast", href: "/admin/announcements", color: "bg-emerald-500" },
        ].map((q) => (
          <a
            key={q.href}
            href={q.href}
            className={`${q.color} text-white rounded-xl p-4 font-semibold text-sm text-center hover:opacity-90 transition-opacity`}
          >
            {q.label}
          </a>
        ))}
      </div>
    </div>
  );
}
