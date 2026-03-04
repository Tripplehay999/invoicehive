"use client";
import { useEffect, useState, useCallback } from "react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  isActive: boolean;
  createdAt: string;
  creatorName: string | null;
  creatorEmail: string | null;
}

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", content: "", type: "banner" });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState("");

  const load = useCallback(() => {
    fetch("/api/admin/announcements")
      .then((r) => r.json())
      .then((d) => setAnnouncements(d.announcements ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    setSending(true);
    setSuccess("");
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm({ title: "", content: "", type: "banner" });
        setSuccess(form.type === "email" ? "Announcement created and emails sent!" : "Banner published!");
        load();
      }
    } finally {
      setSending(false);
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    await fetch(`/api/admin/announcements/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    load();
  }

  async function deleteAnnouncement(id: string) {
    await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
    load();
  }

  const active = announcements.filter((a) => a.isActive);
  const past = announcements.filter((a) => !a.isActive);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Announcements</h1>
        <p className="text-slate-500 text-sm mt-1">Broadcast messages to all users</p>
      </div>

      {/* Create form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-800 mb-4">Create Announcement</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">TITLE</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. New feature: PDF export is live!"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">MESSAGE</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="Your message to users…"
              rows={4}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-2">TYPE</label>
            <div className="flex gap-3">
              {[
                { value: "banner", label: "In-App Banner", desc: "Shows inside the dashboard" },
                { value: "email", label: "Email Blast", desc: "Sends email to all users" },
              ].map((t) => (
                <label key={t.value} className={`flex-1 flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${
                  form.type === t.value ? "border-amber-400 bg-amber-50" : "border-slate-200 hover:bg-slate-50"
                }`}>
                  <input type="radio" name="type" value={t.value} checked={form.type === t.value} onChange={() => setForm((f) => ({ ...f, type: t.value }))} className="accent-amber-500" />
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{t.label}</p>
                    <p className="text-slate-500 text-xs">{t.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          {form.type === "email" && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
              Requires <code className="font-mono bg-amber-100 px-1 rounded">RESEND_API_KEY</code> env var. Email will be sent to all registered users.
            </div>
          )}
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-700 font-medium">
              {success}
            </div>
          )}
          <button
            type="submit"
            disabled={sending}
            className="bg-amber-500 text-slate-900 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-amber-400 disabled:opacity-50 transition-colors"
          >
            {sending ? "Publishing…" : form.type === "email" ? "Send Email to All Users" : "Publish Banner"}
          </button>
        </form>
      </div>

      {/* Active banners */}
      {active.length > 0 && (
        <div>
          <h2 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Active Banners ({active.length})
          </h2>
          <div className="space-y-2">
            {active.map((a) => (
              <div key={a.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{a.title}</p>
                  <p className="text-slate-600 text-sm mt-0.5">{a.content}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(a.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                    {a.creatorName && ` · by ${a.creatorName}`}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => toggleActive(a.id, a.isActive)}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    Deactivate
                  </button>
                  <button
                    onClick={() => deleteAnnouncement(a.id)}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 bg-slate-200 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div>
          <h2 className="font-semibold text-slate-700 mb-3">History ({announcements.length})</h2>
          {announcements.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
              No announcements yet
            </div>
          ) : (
            <div className="space-y-2">
              {announcements.map((a) => (
                <div key={a.id} className={`bg-white border rounded-xl p-4 flex items-start justify-between gap-4 ${a.isActive ? "border-amber-200" : "border-slate-200"}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        a.type === "email" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {a.type === "email" ? "Email" : "Banner"}
                      </span>
                      {a.isActive && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Active</span>}
                    </div>
                    <p className="font-semibold text-slate-900 text-sm">{a.title}</p>
                    <p className="text-slate-500 text-xs mt-0.5 truncate">{a.content}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(a.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                      {a.creatorName && ` · by ${a.creatorName}`}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {a.type === "banner" && (
                      <button
                        onClick={() => toggleActive(a.id, a.isActive)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                          a.isActive
                            ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        }`}
                      >
                        {a.isActive ? "Deactivate" : "Activate"}
                      </button>
                    )}
                    <button
                      onClick={() => deleteAnnouncement(a.id)}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
