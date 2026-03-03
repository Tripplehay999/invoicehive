"use client";
import { useState, useMemo } from "react";
import { useApp } from "@/lib/store";
import { formatNaira, formatDate, getCategoryColor } from "@/lib/utils";
import type { Expense, ExpenseCategory } from "@/lib/types";
import {
  IconPlus, IconSearch, IconCreditCard, IconEdit, IconTrash, IconX,
} from "@/components/Icons";

const CATEGORIES: { value: ExpenseCategory; label: string; emoji: string }[] = [
  { value: "rent", label: "Rent", emoji: "🏢" },
  { value: "utilities", label: "Utilities", emoji: "⚡" },
  { value: "salaries", label: "Salaries", emoji: "👥" },
  { value: "marketing", label: "Marketing", emoji: "📢" },
  { value: "supplies", label: "Supplies", emoji: "📦" },
  { value: "travel", label: "Travel", emoji: "✈️" },
  { value: "software", label: "Software", emoji: "💻" },
  { value: "other", label: "Other", emoji: "📌" },
];

const EMPTY_FORM = {
  description: "",
  amount: 0,
  category: "other" as ExpenseCategory,
  date: new Date().toISOString().split("T")[0],
  notes: "",
};

export default function ExpensesPage() {
  const { expenses, addExpense, updateExpense, deleteExpense } = useApp();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<ExpenseCategory | "all">("all");
  const [modal, setModal] = useState<{ open: boolean; editing?: Expense }>({ open: false });
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = useMemo(() =>
    expenses
      .filter((e) => {
        if (filterCat !== "all" && e.category !== filterCat) return false;
        if (search && !e.description.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [expenses, filterCat, search]
  );

  const totalByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return map;
  }, [expenses]);

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const thisMonthExpenses = useMemo(() => {
    const now = new Date();
    return expenses
      .filter((e) => {
        const d = new Date(e.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((s, e) => s + e.amount, 0);
  }, [expenses]);

  function openAdd() {
    setForm(EMPTY_FORM);
    setErrors({});
    setModal({ open: true });
  }

  function openEdit(expense: Expense) {
    setForm({
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      date: expense.date,
      notes: expense.notes,
    });
    setErrors({});
    setModal({ open: true, editing: expense });
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.description.trim()) e.description = "Description is required";
    if (!form.amount || form.amount <= 0) e.amount = "Amount must be greater than 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    if (modal.editing) {
      updateExpense(modal.editing.id, form);
    } else {
      addExpense(form);
    }
    setModal({ open: false });
  }

  function handleDelete(id: string) {
    deleteExpense(id);
    setConfirmDelete(null);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Expenses</h2>
          <p className="text-slate-500 text-sm">
            {expenses.length} expense{expenses.length !== 1 ? "s" : ""} · {formatNaira(totalExpenses)} total
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm"
        >
          <IconPlus size={18} /> Log Expense
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm">Total Expenses</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{formatNaira(totalExpenses)}</p>
          <p className="text-slate-400 text-xs mt-1">{expenses.length} transactions</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm">This Month</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{formatNaira(thisMonthExpenses)}</p>
          <p className="text-slate-400 text-xs mt-1">
            {expenses.filter((e) => {
              const d = new Date(e.date); const n = new Date();
              return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
            }).length} expenses
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm">Top Category</p>
          {(() => {
            const top = Object.entries(totalByCategory).sort((a, b) => b[1] - a[1])[0];
            const cat = CATEGORIES.find((c) => c.value === top?.[0]);
            return top ? (
              <>
                <p className="text-xl font-bold text-slate-900 mt-1 capitalize">{cat?.emoji} {cat?.label}</p>
                <p className="text-slate-400 text-xs mt-1">{formatNaira(top[1])}</p>
              </>
            ) : <p className="text-xl font-bold text-slate-300 mt-1">—</p>;
          })()}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4">
          {/* Category tabs */}
          <div className="flex items-center gap-1 overflow-x-auto flex-1">
            <button
              onClick={() => setFilterCat("all")}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                filterCat === "all" ? "bg-amber-500 text-white" : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              All ({expenses.length})
            </button>
            {CATEGORIES.map(({ value, label, emoji }) =>
              totalByCategory[value] ? (
                <button
                  key={value}
                  onClick={() => setFilterCat(value)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    filterCat === value ? "bg-amber-500 text-white" : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {emoji} {label}
                </button>
              ) : null
            )}
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-w-[200px]">
            <IconSearch size={16} className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search expenses…"
              className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none w-full"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/70">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Category</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Date</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((expense) => {
                const cat = CATEGORIES.find((c) => c.value === expense.category);
                return (
                  <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{expense.description}</p>
                        {expense.notes && <p className="text-xs text-slate-400 mt-0.5">{expense.notes}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${getCategoryColor(expense.category)}`}>
                        {cat?.emoji} {cat?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-sm text-slate-500">{formatDate(expense.date)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-red-600">–{formatNaira(expense.amount)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(expense)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                          <IconEdit size={15} />
                        </button>
                        <button onClick={() => setConfirmDelete(expense.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                          <IconTrash size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <IconCreditCard size={28} className="text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">No expenses found</p>
              <button onClick={openAdd} className="inline-flex items-center gap-2 mt-4 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all">
                <IconPlus size={16} /> Log Expense
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit modal */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-lg">{modal.editing ? "Edit Expense" : "Log Expense"}</h3>
              <button onClick={() => setModal({ open: false })} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl">
                <IconX size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description *</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="e.g. Adobe Creative Cloud"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount (₦) *</label>
                  <input
                    type="number"
                    min="0"
                    value={form.amount || ""}
                    onChange={(e) => setForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                    placeholder="0"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  />
                  {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                <div className="grid grid-cols-4 gap-2">
                  {CATEGORIES.map(({ value, label, emoji }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, category: value }))}
                      className={`flex flex-col items-center gap-1 p-2.5 rounded-xl text-xs font-medium border transition-all ${
                        form.category === value
                          ? "bg-amber-500 text-white border-amber-500"
                          : "bg-white text-slate-600 border-slate-200 hover:border-amber-300"
                      }`}
                    >
                      <span className="text-base">{emoji}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes (optional)</label>
                <input
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Additional details"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setModal({ open: false })} className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button onClick={handleSave} className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 rounded-xl text-sm font-semibold text-white">
                {modal.editing ? "Save Changes" : "Log Expense"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scale-in">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <IconTrash size={22} className="text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center">Delete Expense?</h3>
            <p className="text-slate-500 text-sm text-center mt-2">This action cannot be undone.</p>
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
