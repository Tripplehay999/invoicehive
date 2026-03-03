"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { IconMenu, IconBell, IconSearch, IconPlus, IconChevronRight } from "@/components/Icons";

interface TopBarProps {
  onMenuClick: () => void;
}

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Dashboard", subtitle: "Welcome back!" },
  "/invoices": { title: "Invoices", subtitle: "Manage your invoices" },
  "/invoices/new": { title: "New Invoice", subtitle: "Create a new invoice" },
  "/clients": { title: "Clients", subtitle: "Manage your clients" },
  "/expenses": { title: "Expenses", subtitle: "Track your spending" },
  "/reports": { title: "Reports", subtitle: "Financial insights" },
  "/settings": { title: "Settings", subtitle: "Account & preferences" },
};

export default function TopBar({ onMenuClick }: TopBarProps) {
  const pathname = usePathname();
  const [notifOpen, setNotifOpen] = useState(false);

  const pageInfo = PAGE_TITLES[pathname] || { title: "InvoiceHive", subtitle: "" };
  const isInvoiceDetail = pathname.match(/^\/invoices\/.+/) && pathname !== "/invoices/new";

  return (
    <header className="bg-white border-b border-slate-200 px-4 lg:px-8 py-4 flex items-center gap-4 sticky top-0 z-30">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
      >
        <IconMenu size={20} />
      </button>

      {/* Page info */}
      <div className="flex-1">
        {isInvoiceDetail ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link href="/invoices" className="hover:text-amber-600">Invoices</Link>
            <IconChevronRight size={14} />
            <span className="text-slate-800 font-medium">Invoice Detail</span>
          </div>
        ) : (
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">{pageInfo.title}</h1>
            <p className="text-slate-500 text-xs hidden sm:block">{pageInfo.subtitle}</p>
          </div>
        )}
      </div>

      {/* Search – desktop */}
      <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-56 text-slate-400 hover:border-amber-300 transition-colors cursor-pointer">
        <IconSearch size={16} />
        <span className="text-sm">Search…</span>
        <kbd className="ml-auto text-[10px] bg-slate-200 rounded px-1.5 py-0.5 text-slate-500">⌘K</kbd>
      </div>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => setNotifOpen(!notifOpen)}
          className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
        >
          <IconBell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {notifOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
            <div className="absolute right-0 top-12 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-scale-in">
              <div className="p-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900 text-sm">Notifications</h3>
              </div>
              <div className="divide-y divide-slate-50">
                {[
                  { icon: "⚠️", text: "INV-202602-001 is overdue by 17 days", time: "2h ago", color: "text-red-600" },
                  { icon: "💰", text: "Emeka Tech Solutions paid ₦505,250", time: "1d ago", color: "text-emerald-600" },
                  { icon: "👁️", text: "Amaka Digital Agency viewed your invoice", time: "3d ago", color: "text-blue-600" },
                ].map((n, i) => (
                  <div key={i} className="px-4 py-3 hover:bg-slate-50 cursor-pointer">
                    <div className="flex items-start gap-3">
                      <span className="text-lg">{n.icon}</span>
                      <div>
                        <p className={`text-xs font-medium ${n.color}`}>{n.text}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{n.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-slate-50">
                <button className="w-full text-xs text-slate-500 hover:text-slate-700">
                  Mark all as read
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* New Invoice CTA */}
      <Link
        href="/invoices/new"
        className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-sm shadow-amber-200"
      >
        <IconPlus size={16} />
        <span className="hidden sm:inline">New Invoice</span>
      </Link>
    </header>
  );
}
