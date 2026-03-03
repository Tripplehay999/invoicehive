"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { formatNaira, formatDate, getStatusColor, getStatusDot, getStatusLabel } from "@/lib/utils";
import type { InvoiceStatus } from "@/lib/types";
import {
  IconPlus, IconSearch, IconFileText, IconEye, IconEdit,
  IconTrash, IconSend, IconCheck, IconMoreVertical,
} from "@/components/Icons";

const STATUSES: { value: InvoiceStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "viewed", label: "Viewed" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
];

export default function InvoicesPage() {
  const { invoices, clients, updateInvoice, deleteInvoice } = useApp();
  const [filter, setFilter] = useState<InvoiceStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function getClientName(clientId: string) {
    return clients.find((c) => c.id === clientId)?.name ?? "Unknown";
  }

  const filtered = useMemo(() => {
    return invoices
      .filter((inv) => {
        if (filter !== "all" && inv.status !== filter) return false;
        if (search) {
          const q = search.toLowerCase();
          return (
            inv.invoiceNumber.toLowerCase().includes(q) ||
            getClientName(inv.clientId).toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices, filter, search, clients]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: invoices.length };
    STATUSES.slice(1).forEach((s) => {
      c[s.value] = invoices.filter((i) => i.status === s.value).length;
    });
    return c;
  }, [invoices]);

  function handleMarkPaid(id: string) {
    updateInvoice(id, { status: "paid" });
    setOpenMenuId(null);
  }

  function handleMarkSent(id: string) {
    updateInvoice(id, { status: "sent" });
    setOpenMenuId(null);
  }

  function handleDelete(id: string) {
    deleteInvoice(id);
    setConfirmDelete(null);
  }

  const totalAmount = filtered.reduce((s, i) => s + i.total, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Invoices</h2>
          <p className="text-slate-500 text-sm">
            {filtered.length} invoice{filtered.length !== 1 ? "s" : ""} · {formatNaira(totalAmount)} total
          </p>
        </div>
        <Link
          href="/invoices/new"
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm"
        >
          <IconPlus size={18} />
          <span>New Invoice</span>
        </Link>
      </div>

      {/* Filters + search */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4">
          {/* Status tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 flex-1">
            {STATUSES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  filter === value
                    ? "bg-amber-500 text-white"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                }`}
              >
                {label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  filter === value ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                }`}>
                  {counts[value] ?? 0}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-w-[200px]">
            <IconSearch size={16} className="text-slate-400 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoices…"
              className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none w-full"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/70">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice #</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Client</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Issue Date</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Due Date</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group relative">
                  <td className="px-6 py-4">
                    <Link href={`/invoices/${inv.id}`} className="font-mono text-sm font-semibold text-amber-600 hover:text-amber-700">
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{getClientName(inv.clientId)}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className="text-sm text-slate-500">{formatDate(inv.issueDate)}</span>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <span className={`text-sm ${
                      inv.status === "overdue" ? "text-red-600 font-medium" : "text-slate-500"
                    }`}>
                      {formatDate(inv.dueDate)}
                    </span>
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
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                        title="View"
                      >
                        <IconEye size={15} />
                      </Link>
                      <Link
                        href={`/invoices/${inv.id}?edit=1`}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Edit"
                      >
                        <IconEdit size={15} />
                      </Link>

                      {/* More menu */}
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === inv.id ? null : inv.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                        >
                          <IconMoreVertical size={15} />
                        </button>

                        {openMenuId === inv.id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
                            <div className="absolute right-0 top-8 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 animate-scale-in">
                              {inv.status === "draft" && (
                                <button
                                  onClick={() => handleMarkSent(inv.id)}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                >
                                  <IconSend size={14} className="text-blue-500" /> Mark as Sent
                                </button>
                              )}
                              {["sent", "viewed", "overdue"].includes(inv.status) && (
                                <button
                                  onClick={() => handleMarkPaid(inv.id)}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                >
                                  <IconCheck size={14} className="text-emerald-500" /> Mark as Paid
                                </button>
                              )}
                              <button
                                onClick={() => window.open(`/invoices/${inv.id}/print`, "_blank")}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                              >
                                <IconEye size={14} className="text-slate-400" /> Preview / Print
                              </button>
                              <div className="border-t border-slate-100 my-1" />
                              <button
                                onClick={() => { setConfirmDelete(inv.id); setOpenMenuId(null); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <IconTrash size={14} /> Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <IconFileText size={28} className="text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">
                {search ? `No invoices matching "${search}"` : "No invoices in this category"}
              </p>
              <p className="text-slate-400 text-sm mt-1">
                {search ? "Try a different search term" : "Create your first invoice to get started"}
              </p>
              {!search && (
                <Link
                  href="/invoices/new"
                  className="inline-flex items-center gap-2 mt-4 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all"
                >
                  <IconPlus size={16} /> Create Invoice
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scale-in">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <IconTrash size={22} className="text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center">Delete Invoice?</h3>
            <p className="text-slate-500 text-sm text-center mt-2">
              This action cannot be undone. The invoice will be permanently removed.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-semibold text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
