"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useApp();

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

          {/* Free plan badge */}
          <div className="mt-3 mx-3 bg-slate-800 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-xs">Free Plan</span>
              <span className="text-amber-500 text-xs font-semibold">5/5 invoices</span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full w-full bg-amber-500 rounded-full" />
            </div>
            <a
              href="/#pricing"
              className="block mt-2.5 text-center text-xs text-amber-500 hover:text-amber-400 font-medium"
            >
              Upgrade to Pro →
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}
