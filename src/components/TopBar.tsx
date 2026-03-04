"use client";
import { useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { getRelativeTime, formatNaira } from "@/lib/utils";
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
  const { invoices, clients } = useApp();

  const pageInfo = PAGE_TITLES[pathname] || { title: "InvoiceHive", subtitle: "" };
  const isInvoiceDetail = pathname.match(/^\/invoices\/.+/) && pathname !== "/invoices/new";

  function getClientName(clientId: string) {
    return clients.find((c) => c.id === clientId)?.name ?? "Unknown Client";
  }

  const notifications = useMemo(() => {
    const now = new Date();
    const items: { icon: string; text: string; time: string; color: string; key: string }[] = [];

    // Overdue invoices
    invoices
      .filter((inv) => inv.status === "overdue")
      .forEach((inv) => {
        const daysOverdue = Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24));
        items.push({
          key: `overdue-${inv.id}`,
          icon: "⚠️",
          text: `${inv.invoiceNumber} is overdue by ${daysOverdue} day${daysOverdue !== 1 ? "s" : ""}`,
          time: getRelativeTime(inv.dueDate),
          color: "text-red-600",
        });
      });

    // Recently paid (last 7 days)
    invoices
      .filter((inv) => {
        if (inv.status !== "paid") return false;
        const diff = now.getTime() - new Date(inv.updatedAt || inv.issueDate).getTime();
        return diff < 7 * 24 * 60 * 60 * 1000;
      })
      .forEach((inv) => {
        items.push({
          key: `paid-${inv.id}`,
          icon: "💰",
          text: `${getClientName(inv.clientId)} paid ${formatNaira(inv.total)}`,
          time: getRelativeTime(inv.updatedAt || inv.issueDate),
          color: "text-emerald-600",
        });
      });

    // Recently viewed (last 7 days)
    invoices
      .filter((inv) => {
        if (inv.status !== "viewed") return false;
        const diff = now.getTime() - new Date(inv.updatedAt || inv.issueDate).getTime();
        return diff < 7 * 24 * 60 * 60 * 1000;
      })
      .forEach((inv) => {
        items.push({
          key: `viewed-${inv.id}`,
          icon: "👁️",
          text: `${getClientName(inv.clientId)} viewed ${inv.invoiceNumber}`,
          time: getRelativeTime(inv.updatedAt || inv.issueDate),
          color: "text-blue-600",
        });
      });

    return items;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices, clients]);

  const overdueCount = invoices.filter((inv) => inv.status === "overdue").length;

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
          {overdueCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 rounded-full text-[9px] text-white font-bold flex items-center justify-center px-0.5">
              {overdueCount > 9 ? "9+" : overdueCount}
            </span>
          )}
        </button>

        {notifOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
            <div className="absolute right-0 top-12 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-scale-in">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 text-sm">Notifications</h3>
                {notifications.length > 0 && (
                  <span className="text-xs bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded-full">
                    {notifications.length}
                  </span>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-slate-400 text-sm font-medium">All caught up!</p>
                  <p className="text-slate-300 text-xs mt-1">No new notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.key} className="px-4 py-3 hover:bg-slate-50 cursor-pointer">
                      <div className="flex items-start gap-3">
                        <span className="text-lg leading-none mt-0.5">{n.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium ${n.color} leading-snug`}>{n.text}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{n.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-3 bg-slate-50 border-t border-slate-100">
                <Link
                  href="/invoices"
                  onClick={() => setNotifOpen(false)}
                  className="block w-full text-xs text-center text-amber-600 hover:text-amber-700 font-medium"
                >
                  View all invoices
                </Link>
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
