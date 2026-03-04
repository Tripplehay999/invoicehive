"use client";
import { useEffect, useState, useCallback } from "react";

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  response: string | null;
  respondedAt: string | null;
  createdAt: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
}

const PRIORITY_COLORS: Record<string, string> = {
  normal: "bg-slate-100 text-slate-600",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  closed: "bg-slate-100 text-slate-500",
};

export default function AdminSupport() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [response, setResponse] = useState("");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");

  const load = useCallback(() => {
    fetch("/api/admin/support")
      .then((r) => r.json())
      .then((d) => setTickets(d.tickets ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function doAction(id: string, action: string, extra?: Record<string, string>) {
    setSaving(true);
    try {
      await fetch(`/api/admin/support/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      setSelected(null);
      setResponse("");
      load();
    } finally {
      setSaving(false);
    }
  }

  const filtered = filter === "all" ? tickets : tickets.filter((t) => t.status === filter);
  const openCount = tickets.filter((t) => t.status === "open").length;

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Support Center</h1>
          <p className="text-slate-500 text-sm mt-1">
            {openCount > 0 ? (
              <span className="text-orange-600 font-medium">{openCount} open ticket{openCount !== 1 ? "s" : ""}</span>
            ) : (
              "All caught up!"
            )}
          </p>
        </div>
        <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-1">
          {(["all", "open", "closed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                filter === f ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-slate-200 rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          No {filter !== "all" ? filter : ""} tickets found
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-xl border border-slate-200 p-4 cursor-pointer hover:border-amber-300 hover:shadow-sm transition-all"
              onClick={() => { setSelected(t); setResponse(t.response ?? ""); }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[t.status]}`}>{t.status}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_COLORS[t.priority]}`}>{t.priority}</span>
                  </div>
                  <p className="font-semibold text-slate-900 truncate">{t.subject}</p>
                  <p className="text-slate-500 text-sm truncate">{t.message}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-slate-400">{formatDate(t.createdAt)}</p>
                  <p className="text-xs font-medium text-slate-600 mt-1">{t.userName ?? t.userEmail ?? "Unknown"}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ticket detail panel */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h3 className="font-bold text-slate-900">{selected.subject}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{selected.userEmail} · {formatDate(selected.createdAt)}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Status + priority */}
              <div className="flex gap-2">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[selected.status]}`}>{selected.status}</span>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${PRIORITY_COLORS[selected.priority]}`}>{selected.priority} priority</span>
              </div>

              {/* User message */}
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-500 mb-2">USER MESSAGE</p>
                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{selected.message}</p>
              </div>

              {/* Previous response */}
              {selected.response && (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                  <p className="text-xs font-semibold text-amber-600 mb-2">ADMIN RESPONSE · {selected.respondedAt ? formatDate(selected.respondedAt) : ""}</p>
                  <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{selected.response}</p>
                </div>
              )}

              {/* Set priority */}
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2">SET PRIORITY</p>
                <div className="flex gap-2">
                  {["normal", "high", "urgent"].map((p) => (
                    <button
                      key={p}
                      onClick={() => doAction(selected.id, "setPriority", { priority: p })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border capitalize transition-colors ${
                        selected.priority === p ? PRIORITY_COLORS[p] + " border-current" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Response textarea */}
              {selected.status === "open" && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-2">YOUR RESPONSE</label>
                  <textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    rows={4}
                    placeholder="Type your response to the user…"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                {selected.status === "open" && (
                  <>
                    <button
                      onClick={() => doAction(selected.id, "respond", { response })}
                      disabled={saving || !response.trim()}
                      className="flex-1 bg-amber-500 text-slate-900 py-2.5 rounded-xl text-sm font-bold hover:bg-amber-400 disabled:opacity-50"
                    >
                      {saving ? "Sending…" : "Respond & Close"}
                    </button>
                    <button
                      onClick={() => doAction(selected.id, "close")}
                      disabled={saving}
                      className="px-4 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
                    >
                      Close
                    </button>
                  </>
                )}
                {selected.status === "closed" && (
                  <button
                    onClick={() => doAction(selected.id, "reopen")}
                    disabled={saving}
                    className="px-4 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
                  >
                    Reopen
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
