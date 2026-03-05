"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/lib/store";
import {
  IconHive, IconDashboard, IconFileText, IconUsers,
  IconCreditCard, IconBarChart, IconSettings, IconLogOut, IconX,
} from "@/components/Icons";

const NAV = [
  { href: "/dashboard", label: "Dashboard", Icon: IconDashboard },
  { href: "/invoices", label: "Invoices", Icon: IconFileText },
  { href: "/clients", label: "Clients", Icon: IconUsers },
  { href: "/expenses", label: "Expenses", Icon: IconCreditCard },
  { href: "/reports", label: "Reports", Icon: IconBarChart },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

function HelpModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/admin/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) { setSent(true); }
      else { setError("Failed to send. Please try again."); }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Help & Feedback</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <IconX size={18} />
          </button>
        </div>
        <div className="p-6">
          {sent ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-semibold text-slate-900 mb-1">Message sent!</p>
              <p className="text-slate-500 text-sm">We'll get back to you as soon as possible.</p>
              <button onClick={onClose} className="mt-4 bg-amber-500 text-slate-900 px-6 py-2 rounded-xl text-sm font-bold hover:bg-amber-400">Done</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">SUBJECT</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  placeholder="What do you need help with?"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">MESSAGE</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder="Describe your issue or feedback…"
                  rows={4}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                  required
                />
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={onClose} className="flex-1 border border-slate-200 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={sending} className="flex-1 bg-amber-500 text-slate-900 py-2.5 rounded-xl text-sm font-bold hover:bg-amber-400 disabled:opacity-50">
                  {sending ? "Sending…" : "Send"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useApp();
  const [helpOpen, setHelpOpen] = useState(false);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "IH";

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="sidebar-overlay lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-50 bg-slate-900 flex flex-col transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:relative lg:z-auto`}
        style={{ width: 260 }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-amber-400 transition-colors">
              <IconHive size={20} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight tracking-tight">InvoiceHive</p>
              <p className="text-slate-500 text-xs">Smart Invoicing</p>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden text-slate-500 hover:text-slate-300 p-1"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <p className="text-slate-600 text-[10px] uppercase tracking-widest font-semibold mb-3 px-3">
            Main Menu
          </p>
          {NAV.map(({ href, label, Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                  active
                    ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Icon size={18} className={active ? "text-white" : "text-slate-500 group-hover:text-white"} />
                {label}
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />
                )}
              </Link>
            );
          })}

          <div className="pt-4">
            <p className="text-slate-600 text-[10px] uppercase tracking-widest font-semibold mb-3 px-3">
              Account
            </p>
            <Link
              href="/settings"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all group"
            >
              <IconSettings size={18} className="text-slate-500 group-hover:text-white" />
              Settings
            </Link>
            <button
              onClick={() => { setHelpOpen(true); onClose(); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all group"
            >
              <svg className="w-[18px] h-[18px] text-slate-500 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Help & Feedback
            </button>
          </div>
        </nav>

        {/* User profile */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-800 transition-all cursor-pointer group">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name || "Business Owner"}</p>
              <p className="text-slate-500 text-xs truncate">{user?.email || ""}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-600 hover:text-red-400 transition-colors p-1"
              title="Logout"
            >
              <IconLogOut size={16} />
            </button>
          </div>

          {/* Plan badge */}
          <div className="mt-3 mx-3 bg-slate-800 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs">Free Plan</span>
              <span className="text-amber-500 text-xs font-semibold">Unlimited</span>
            </div>
            <p className="text-slate-600 text-[10px] mt-1">All features included · No limits</p>
          </div>
        </div>
      </aside>
      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
    </>
  );
}
