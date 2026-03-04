"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppProvider, useApp } from "@/lib/store";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";

interface ActiveBanner {
  id: string;
  title: string;
  content: string;
}

function AnnouncementBanner() {
  const [banners, setBanners] = useState<ActiveBanner[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/admin/announcements/active")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (!d?.announcements) return;
        // Restore dismissed from sessionStorage
        const stored = sessionStorage.getItem("dismissedBanners");
        const dismissedIds: string[] = stored ? JSON.parse(stored) : [];
        setDismissed(new Set(dismissedIds));
        setBanners(d.announcements);
      })
      .catch(() => {});
  }, []);

  function dismiss(id: string) {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      sessionStorage.setItem("dismissedBanners", JSON.stringify([...next]));
      return next;
    });
  }

  const visible = banners.filter((b) => !dismissed.has(b.id));
  if (visible.length === 0) return null;

  return (
    <div className="shrink-0">
      {visible.map((b) => (
        <div key={b.id} className="bg-amber-500 text-slate-900 px-4 py-2.5 flex items-center gap-3">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
          <span className="flex-1 text-sm font-medium">
            <strong>{b.title}</strong>{b.content ? ` — ${b.content}` : ""}
          </span>
          <button
            onClick={() => dismiss(b.id)}
            className="shrink-0 hover:opacity-70 transition-opacity p-0.5"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isLoaded } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !user) {
      router.replace("/login");
    }
  }, [isLoaded, user, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-amber-500 rounded-xl animate-pulse" />
          <p className="text-slate-400 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <AnnouncementBanner />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <DashboardShell>{children}</DashboardShell>
    </AppProvider>
  );
}
