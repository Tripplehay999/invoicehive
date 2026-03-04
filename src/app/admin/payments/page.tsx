"use client";
import { useEffect, useState } from "react";

interface UserRow {
  id: string;
  name: string;
  email: string;
  plan: string;
}

function formatNaira(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n);
}

const PLAN_PRICES: Record<string, number> = { free: 0, pro: 5000, business: 15000 };

export default function AdminPayments() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch all users for plan-based revenue calculation
    async function loadAll() {
      let allUsers: UserRow[] = [];
      let page = 1;
      let totalPages = 1;
      do {
        const res = await fetch(`/api/admin/users?page=${page}&plan=all&search=`);
        const data = await res.json();
        allUsers = [...allUsers, ...(data.users ?? [])];
        totalPages = data.totalPages ?? 1;
        page++;
      } while (page <= totalPages);
      setUsers(allUsers);
      setLoading(false);
    }
    loadAll().catch(() => setLoading(false));
  }, []);

  const plans = { free: 0, pro: 0, business: 0 };
  for (const u of users) {
    if (u.plan in plans) plans[u.plan as keyof typeof plans]++;
  }

  const mrr = plans.pro * 5000 + plans.business * 15000;
  const arr = mrr * 12;
  const totalPaying = plans.pro + plans.business;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Revenue</h1>
        <p className="text-slate-500 text-sm mt-1">Subscription-based revenue overview</p>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <svg className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-blue-700 text-sm">
          Figures shown are based on current subscription plans. Full payment transaction logs (Paystack receipts, refunds, failed payments) will appear here after Paystack webhook integration is complete.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-slate-200 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
              <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">MRR</p>
              <p className="text-2xl font-bold text-purple-700">{formatNaira(mrr)}</p>
              <p className="text-xs text-purple-400 mt-1">Monthly Recurring Revenue</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">ARR</p>
              <p className="text-2xl font-bold text-amber-700">{formatNaira(arr)}</p>
              <p className="text-xs text-amber-400 mt-1">Annualized</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Paying Users</p>
              <p className="text-2xl font-bold text-blue-700">{totalPaying}</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1">ARPU</p>
              <p className="text-2xl font-bold text-emerald-700">
                {formatNaira(totalPaying > 0 ? mrr / totalPaying : 0)}
              </p>
              <p className="text-xs text-emerald-400 mt-1">Per paying user/month</p>
            </div>
          </div>

          {/* Plan revenue breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-4">Revenue by Plan</h3>
            <div className="space-y-3">
              {(["pro", "business"] as const).map((plan) => (
                <div key={plan} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-slate-800 capitalize">{plan} Plan</p>
                    <p className="text-slate-500 text-sm">{plans[plan]} subscribers × {formatNaira(PLAN_PRICES[plan])}/mo</p>
                  </div>
                  <p className="text-xl font-bold text-slate-900">{formatNaira(plans[plan] * PLAN_PRICES[plan])}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming features */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-3">Coming Soon</h3>
            <div className="space-y-2">
              {[
                "Individual payment transaction logs",
                "Failed payment alerts",
                "Refund history",
                "Payment gateway statistics (Paystack)",
                "Revenue by cohort / month",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-slate-500 text-sm">
                  <div className="w-4 h-4 rounded border border-slate-300 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
