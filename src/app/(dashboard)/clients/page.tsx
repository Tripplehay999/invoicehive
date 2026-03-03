"use client";
import { useState, useMemo } from "react";
import { useApp } from "@/lib/store";
import { formatDate, formatNaira } from "@/lib/utils";
import type { Client } from "@/lib/types";
import {
  IconPlus, IconSearch, IconUsers, IconEdit, IconTrash,
  IconMail, IconPhone, IconMapPin, IconX, IconFileText,
} from "@/components/Icons";

const EMPTY_CLIENT = { name: "", email: "", phone: "", address: "", city: "" };

export default function ClientsPage() {
  const { clients, invoices, addClient, updateClient, deleteClient } = useApp();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{ open: boolean; editing?: Client }>({ open: false });
  const [form, setForm] = useState(EMPTY_CLIENT);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = useMemo(() =>
    clients.filter((c) =>
      !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
    ), [clients, search]);

  function getClientStats(clientId: string) {
    const clientInvoices = invoices.filter((i) => i.clientId === clientId);
    const paid = clientInvoices.filter((i) => i.status === "paid");
    return {
      total: clientInvoices.length,
      revenue: paid.reduce((s, i) => s + i.total, 0),
    };
  }

  function openAdd() {
    setForm(EMPTY_CLIENT);
    setErrors({});
    setModal({ open: true });
  }

  function openEdit(client: Client) {
    setForm({ name: client.name, email: client.email, phone: client.phone, address: client.address, city: client.city });
    setErrors({});
    setModal({ open: true, editing: client });
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    if (modal.editing) {
      updateClient(modal.editing.id, form);
    } else {
      addClient(form);
    }
    setModal({ open: false });
  }

  function handleDelete(id: string) {
    deleteClient(id);
    setConfirmDelete(null);
  }

  const totalRevenue = clients.reduce((s, c) => s + getClientStats(c.id).revenue, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Clients</h2>
          <p className="text-slate-500 text-sm">
            {clients.length} client{clients.length !== 1 ? "s" : ""} · {formatNaira(totalRevenue)} total revenue
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm"
        >
          <IconPlus size={18} /> Add Client
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-3 max-w-sm shadow-sm">
        <IconSearch size={16} className="text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search clients…"
          className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none flex-1"
        />
      </div>

      {/* Client grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 stagger-children">
          {filtered.map((client) => {
            const stats = getClientStats(client.id);
            const initials = client.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
            const colors = ["bg-amber-500", "bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-pink-500"];
            const color = colors[client.id.charCodeAt(client.id.length - 1) % colors.length];

            return (
              <div key={client.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow animate-fade-in group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white font-bold text-sm">{initials}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{client.name}</h3>
                      <p className="text-slate-400 text-xs">{formatDate(client.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(client)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <IconEdit size={15} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(client.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <IconTrash size={15} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mb-5">
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <IconMail size={13} className="flex-shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                      <IconPhone size={13} className="flex-shrink-0" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.city && (
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <IconMapPin size={13} className="flex-shrink-0" />
                      <span>{client.city}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
                      <IconFileText size={11} /> Invoices
                    </div>
                    <p className="font-bold text-slate-900">{stats.total}</p>
                  </div>
                  <div className="text-center border-l border-slate-100">
                    <p className="text-slate-400 text-xs mb-1">Revenue</p>
                    <p className="font-bold text-emerald-600 text-sm">{formatNaira(stats.revenue)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 py-20 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <IconUsers size={28} className="text-slate-300" />
          </div>
          <p className="text-slate-500 font-medium">
            {search ? `No clients matching "${search}"` : "No clients yet"}
          </p>
          <p className="text-slate-400 text-sm mt-1">
            {search ? "Try a different search" : "Add your first client to get started"}
          </p>
          {!search && (
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 mt-4 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all"
            >
              <IconPlus size={16} /> Add Client
            </button>
          )}
        </div>
      )}

      {/* Add/Edit modal */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-lg">
                {modal.editing ? "Edit Client" : "Add New Client"}
              </h3>
              <button onClick={() => setModal({ open: false })} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl">
                <IconX size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Business / Client Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Emeka Tech Solutions"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="client@email.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="+234 801 234 5678"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">City</label>
                  <input
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    placeholder="Lagos"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Address</label>
                <input
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="15 Victoria Island"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setModal({ open: false })}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 rounded-xl text-sm font-semibold text-white"
              >
                {modal.editing ? "Save Changes" : "Add Client"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scale-in">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <IconTrash size={22} className="text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center">Delete Client?</h3>
            <p className="text-slate-500 text-sm text-center mt-2">Their invoices will remain but the client record will be removed.</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-semibold text-white">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
