"use client";
import { useEffect, useState, useCallback } from "react";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  businessName: string;
  plan: string;
  role: string;
  isSuspended: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  invoiceCount: number;
}

type ModalState =
  | null
  | { type: "plan"; user: AdminUser }
  | { type: "resetPwd"; user: AdminUser; tempPassword?: string }
  | { type: "delete"; user: AdminUser }
  | { type: "confirm"; message: string; onConfirm: () => void };

const PLAN_LABELS: Record<string, string> = { free: "Free", pro: "Pro", business: "Business" };
const PLAN_COLORS: Record<string, string> = {
  free: "bg-slate-100 text-slate-600",
  pro: "bg-blue-100 text-blue-700",
  business: "bg-purple-100 text-purple-700",
};

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("pro");

  const fetchUsers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ search, plan: planFilter, page: String(page) });
    fetch(`/api/admin/users?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setUsers(d.users ?? []);
        setTotal(d.total ?? 0);
        setTotalPages(d.totalPages ?? 1);
      })
      .finally(() => setLoading(false));
  }, [search, planFilter, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function doAction(userId: string, action: string, extra?: Record<string, string>) {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (action === "resetPassword" && data.tempPassword) {
        setModal({ type: "resetPwd", user: users.find(u => u.id === userId)!, tempPassword: data.tempPassword });
      } else {
        setModal(null);
        fetchUsers();
      }
    } finally {
      setActionLoading(false);
    }
  }

  async function doDelete(userId: string) {
    setActionLoading(true);
    try {
      await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      setModal(null);
      fetchUsers();
    } finally {
      setActionLoading(false);
    }
  }

  function formatDate(d: string | null) {
    if (!d) return "Never";
    return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
        <p className="text-slate-500 text-sm mt-1">{total.toLocaleString()} total users</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by email, name or business..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-1">
          {["all", "free", "pro", "business"].map((p) => (
            <button
              key={p}
              onClick={() => { setPlanFilter(p); setPage(1); }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                planFilter === p ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Plan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Joined</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Last Login</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Invoices</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No users found</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{u.name}</p>
                      <p className="text-slate-500 text-xs">{u.email}</p>
                      {u.businessName && <p className="text-slate-400 text-xs">{u.businessName}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PLAN_COLORS[u.plan]}`}>
                        {PLAN_LABELS[u.plan] ?? u.plan}
                      </span>
                      {u.role === "admin" && (
                        <span className="ml-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Admin</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(u.lastLoginAt)}</td>
                    <td className="px-4 py-3 text-slate-700 font-medium">{u.invoiceCount}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        u.isSuspended ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                      }`}>
                        {u.isSuspended ? "Suspended" : "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        <button
                          onClick={() => doAction(u.id, u.isSuspended ? "unsuspend" : "suspend")}
                          className={`text-xs px-2 py-1 rounded font-medium transition-colors ${
                            u.isSuspended
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                              : "bg-red-100 text-red-700 hover:bg-red-200"
                          }`}
                        >
                          {u.isSuspended ? "Unsuspend" : "Suspend"}
                        </button>
                        <button
                          onClick={() => { setSelectedPlan(u.plan); setModal({ type: "plan", user: u }); }}
                          className="text-xs px-2 py-1 rounded font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                        >
                          Plan
                        </button>
                        <button
                          onClick={() => setModal({ type: "resetPwd", user: u })}
                          className="text-xs px-2 py-1 rounded font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                        >
                          Reset Pwd
                        </button>
                        <button
                          onClick={() => setModal({ type: "delete", user: u })}
                          className="text-xs px-2 py-1 rounded font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Change Plan Modal */}
      {modal?.type === "plan" && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-slate-900 text-lg mb-1">Change Plan</h3>
            <p className="text-slate-500 text-sm mb-4">{modal.user.email}</p>
            <div className="space-y-2 mb-6">
              {["free", "pro", "business"].map((p) => (
                <label key={p} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                  <input type="radio" name="plan" value={p} checked={selectedPlan === p} onChange={() => setSelectedPlan(p)} className="accent-amber-500" />
                  <span className="font-medium text-slate-800 capitalize">{p}</span>
                  <span className="text-slate-400 text-sm ml-auto">
                    {p === "free" ? "₦0" : p === "pro" ? "₦5,000/mo" : "₦15,000/mo"}
                  </span>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 border border-slate-200 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50">Cancel</button>
              <button
                onClick={() => doAction(modal.user.id, "changePlan", { plan: selectedPlan })}
                disabled={actionLoading}
                className="flex-1 bg-amber-500 text-slate-900 py-2.5 rounded-xl text-sm font-bold hover:bg-amber-400 disabled:opacity-50"
              >
                {actionLoading ? "Saving…" : "Save Plan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {modal?.type === "resetPwd" && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-slate-900 text-lg mb-1">Reset Password</h3>
            <p className="text-slate-500 text-sm mb-4">{modal.user.email}</p>
            {modal.tempPassword ? (
              <>
                <div className="bg-slate-100 rounded-xl p-4 mb-4">
                  <p className="text-xs text-slate-500 mb-1">Temporary Password</p>
                  <p className="font-mono text-lg font-bold text-slate-900">{modal.tempPassword}</p>
                </div>
                <p className="text-xs text-slate-500 mb-4">Share this with the user. They should change it after logging in.</p>
                <button onClick={() => { setModal(null); fetchUsers(); }} className="w-full bg-slate-900 text-white py-2.5 rounded-xl text-sm font-bold">Done</button>
              </>
            ) : (
              <>
                <p className="text-slate-600 text-sm mb-6">A temporary password will be generated and shown to you. The user will need to use it to log in.</p>
                <div className="flex gap-3">
                  <button onClick={() => setModal(null)} className="flex-1 border border-slate-200 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50">Cancel</button>
                  <button
                    onClick={() => doAction(modal.user.id, "resetPassword")}
                    disabled={actionLoading}
                    className="flex-1 bg-slate-900 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-slate-700 disabled:opacity-50"
                  >
                    {actionLoading ? "Resetting…" : "Reset Password"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modal?.type === "delete" && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-slate-900 text-lg mb-1">Delete User</h3>
            <p className="text-slate-500 text-sm mb-4">{modal.user.email}</p>
            <p className="text-red-600 text-sm bg-red-50 rounded-xl p-3 mb-6">
              This will permanently delete the user and ALL their invoices, clients, and data. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 border border-slate-200 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50">Cancel</button>
              <button
                onClick={() => doDelete(modal.user.id)}
                disabled={actionLoading}
                className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-red-600 disabled:opacity-50"
              >
                {actionLoading ? "Deleting…" : "Delete Forever"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
