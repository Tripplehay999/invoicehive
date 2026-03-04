"use client";
import { useEffect, useState } from "react";

interface UserRow {
  id: string;
  name: string;
  email: string;
  plan: string;
  isSuspended: boolean;
  createdAt: string;
}

const PLAN_PRICES: Record<string, number> = { free: 0, pro: 5000, business: 15000 };
const PLAN_COLORS: Record<string, string> = {
  free: "bg-slate-100 text-slate-600",
  pro: "bg-blue-100 text-blue-700",
  business: "bg-purple-100 text-purple-700",
};

function formatNaira(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n);
}

export default function AdminSubscriptions() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/users?page=1&plan=all&search=")
      .then((r) => r.json())
      .then((d) => {
        // Fetch all — re-fetch with high limit for subscription overview
        const allUsers: UserRow[] = d.users ?? [];
        // also fetch remaining pages
        const totalPages = d.totalPages ?? 1;
        if (totalPages <= 1) { setUsers(allUsers); setLoading(false); return; }
        const promises = [];
        for (let p = 2; p <= totalPages; p++) {
          promises.push(fetch(`/api/admin/users?page=${p}&plan=all&search=`).then(r => r.json()));
        }
        Promise.all(promises).then(pages => {
          const all = [...allUsers, ...pages.flatMap(p => p.users ?? [])];
          setUsers(all);
        }).finally(() => setLoading(false));
      })
      .catch(() => setLoading(false));
  }, []);

  const plans = { free: 0, pro: 0, business: 0 };
  for (const u of users) {
    if (u.plan in plans) plans[u.plan as keyof typeof plans]++;
  }

  const totalPaying = plans.pro + plans.business;
  const mrr = plans.pro * 5000 + plans.business * 15000;
  const arpu = totalPaying > 0 ? mrr / totalPaying : 0;
  const total = users.length;

  const payingUsers = users.filter((u) => u.plan !== "free");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Subscriptions</h1>
        <p className="text-slate-500 text-sm mt-1">Revenue and plan distribution</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 bg-slate-200 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
              <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">MRR</p>
              <p className="text-2xl font-bold text-purple-700">{formatNaira(mrr)}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Total Paying</p>
              <p className="text-2xl font-bold text-blue-700">{totalPaying}</p>
              <p className="text-xs text-blue-500 mt-1">of {total} users</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">ARPU</p>
              <p className="text-2xl font-bold text-amber-700">{formatNaira(arpu)}</p>
              <p className="text-xs text-amber-500 mt-1">per paying user/month</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Free Users</p>
              <p className="text-2xl font-bold text-slate-700">{plans.free}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Pro Users</p>
              <p className="text-2xl font-bold text-blue-700">{plans.pro}</p>
              <p className="text-xs text-blue-500 mt-1">{formatNaira(5000)}/mo each</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
              <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">Business Users</p>
              <p className="text-2xl font-bold text-purple-700">{plans.business}</p>
              <p className="text-xs text-purple-500 mt-1">{formatNaira(15000)}/mo each</p>
            </div>
          </div>

          {/* Plan distribution bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-3">Plan Distribution</h3>
            <div className="flex rounded-full overflow-hidden h-6">
              {total > 0 && (
                <>
                  <div className="bg-slate-300 transition-all" style={{ width: `${(plans.free / total) * 100}%` }} title={`Free: ${plans.free}`} />
                  <div className="bg-blue-400 transition-all" style={{ width: `${(plans.pro / total) * 100}%` }} title={`Pro: ${plans.pro}`} />
                  <div className="bg-purple-500 transition-all" style={{ width: `${(plans.business / total) * 100}%` }} title={`Business: ${plans.business}`} />
                </>
              )}
            </div>
            <div className="flex gap-4 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-slate-300 rounded-sm inline-block" />Free ({plans.free})</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-400 rounded-sm inline-block" />Pro ({plans.pro})</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-purple-500 rounded-sm inline-block" />Business ({plans.business})</span>
            </div>
          </div>

          {/* Paying users table */}
          {payingUsers.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800">Paying Subscribers</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">User</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Plan</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">MRR</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Since</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payingUsers.map((u) => (
                      <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{u.name}</p>
                          <p className="text-slate-500 text-xs">{u.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PLAN_COLORS[u.plan]}`}>
                            {u.plan.charAt(0).toUpperCase() + u.plan.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">{formatNaira(PLAN_PRICES[u.plan] ?? 0)}</td>
                        <td className="px-4 py-3 text-slate-500">
                          {new Date(u.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
