"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { IconHive, IconCheck, IconChevronDown } from "@/components/Icons";

/* ─── Navbar ──────────────────────────────────────────────────── */
function Navbar({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center">
            <IconHive size={20} className="text-white" />
          </div>
          <span className={`font-bold text-lg tracking-tight ${scrolled ? "text-slate-900" : "text-white"}`}>
            InvoiceHive
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {[
            ["#features", "Features"],
            ["#pricing", "Pricing"],
            ["#how-it-works", "How it works"],
            ["#testimonials", "Reviews"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className={`text-sm font-medium transition-colors ${
                scrolled ? "text-slate-600 hover:text-slate-900" : "text-white/80 hover:text-white"
              }`}
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all"
            >
              Open Dashboard →
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className={`text-sm font-semibold px-4 py-2 rounded-xl transition-all ${
                  scrolled ? "text-slate-700 hover:bg-slate-100" : "text-white hover:bg-white/10"
                }`}
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="text-sm font-semibold px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-all shadow-lg shadow-amber-500/25"
              >
                Get Started Free
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={`md:hidden p-2 rounded-xl ${scrolled ? "text-slate-700" : "text-white"}`}
        >
          <div className="w-5 h-4 flex flex-col justify-between">
            <span className={`block h-0.5 ${scrolled ? "bg-slate-700" : "bg-white"}`} />
            <span className={`block h-0.5 ${scrolled ? "bg-slate-700" : "bg-white"}`} />
            <span className={`block h-0.5 ${scrolled ? "bg-slate-700" : "bg-white"}`} />
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-6 py-4 space-y-3 shadow-lg">
          {[
            ["#features", "Features"],
            ["#pricing", "Pricing"],
            ["#how-it-works", "How it works"],
            ["#testimonials", "Reviews"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="block text-sm font-medium text-slate-700 py-2"
            >
              {label}
            </a>
          ))}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
            <Link href="/login" className="text-center py-2.5 text-sm font-semibold text-slate-700 border border-slate-200 rounded-xl">
              Log in
            </Link>
            <Link href="/register" className="text-center py-2.5 text-sm font-semibold text-white bg-amber-500 rounded-xl">
              Get Started Free
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

/* ─── Dashboard Mockup ──────────────────────────────────────────── */
function DashboardMockup() {
  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Browser chrome */}
      <div className="bg-slate-800 rounded-t-2xl px-4 py-3 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 mx-4 bg-slate-700 rounded-lg px-3 py-1 text-xs text-slate-400 text-center">
          app.invoicehive.ng/dashboard
        </div>
      </div>

      {/* App window */}
      <div className="bg-slate-100 rounded-b-2xl overflow-hidden flex shadow-2xl" style={{ height: 380 }}>
        {/* Sidebar */}
        <div className="bg-slate-900 w-14 flex flex-col items-center py-4 gap-4 flex-shrink-0">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
            <IconHive size={16} className="text-white" />
          </div>
          {["▦", "☰", "◈", "▤", "⚙"].map((icon, i) => (
            <div
              key={i}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs cursor-pointer ${
                i === 0 ? "bg-amber-500 text-white" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {icon}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-hidden">
          <div className="mb-3">
            <p className="text-xs font-bold text-slate-800">Dashboard</p>
            <p className="text-[10px] text-slate-400">Welcome back, Adeola!</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              { label: "Revenue", val: "₦1.25M", color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Outstanding", val: "₦993K", color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Overdue", val: "₦290K", color: "text-red-600", bg: "bg-red-50" },
              { label: "Invoices", val: "8 total", color: "text-amber-600", bg: "bg-amber-50" },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} rounded-xl p-2`}>
                <p className={`text-[9px] font-bold ${s.color}`}>{s.val}</p>
                <p className="text-[8px] text-slate-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Chart + table */}
          <div className="grid grid-cols-5 gap-2">
            <div className="col-span-3 bg-white rounded-xl p-3">
              <p className="text-[9px] font-bold text-slate-700 mb-2">Revenue (6 months)</p>
              <div className="flex items-end gap-1.5 h-16">
                {[30, 55, 40, 70, 85, 100].map((h, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-t-sm ${i === 5 ? "bg-amber-500" : "bg-amber-200"}`}
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-1">
                {["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"].map((m) => (
                  <span key={m} className="text-[7px] text-slate-400">{m}</span>
                ))}
              </div>
            </div>

            <div className="col-span-2 bg-white rounded-xl p-3">
              <p className="text-[9px] font-bold text-slate-700 mb-2">Recent</p>
              <div className="space-y-1.5">
                {[
                  { name: "Emeka Tech", status: "paid", color: "bg-emerald-100 text-emerald-700" },
                  { name: "Chinwe Fashion", status: "paid", color: "bg-emerald-100 text-emerald-700" },
                  { name: "Kola Events", status: "overdue", color: "bg-red-100 text-red-700" },
                  { name: "Amaka Digital", status: "sent", color: "bg-blue-100 text-blue-700" },
                ].map((inv) => (
                  <div key={inv.name} className="flex items-center justify-between">
                    <p className="text-[8px] text-slate-600 truncate flex-1">{inv.name}</p>
                    <span className={`text-[7px] font-semibold px-1 py-0.5 rounded-full ${inv.color} ml-1`}>
                      {inv.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating notification badges */}
      <div
        className="absolute -left-6 top-24 bg-white rounded-2xl shadow-xl p-3 flex items-center gap-2.5 animate-fade-in hidden sm:flex"
        style={{ animationDelay: "300ms" }}
      >
        <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-emerald-600 text-sm">✓</span>
        </div>
        <div>
          <p className="text-xs font-bold text-slate-900">Payment received!</p>
          <p className="text-[10px] text-slate-400">Emeka Tech · ₦505,250</p>
        </div>
      </div>

      <div
        className="absolute -right-4 bottom-16 bg-white rounded-2xl shadow-xl p-3 flex items-center gap-2.5 animate-fade-in hidden sm:flex"
        style={{ animationDelay: "600ms" }}
      >
        <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-green-600 text-sm">💬</span>
        </div>
        <div>
          <p className="text-xs font-bold text-slate-900">Invoice sent via WhatsApp</p>
          <p className="text-[10px] text-slate-400">Amaka Digital Agency</p>
        </div>
      </div>
    </div>
  );
}

/* ─── FAQ Item ──────────────────────────────────────────────────── */
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen(!open)}
      className="w-full text-left bg-white rounded-2xl px-6 py-5 shadow-sm border border-slate-100 hover:border-amber-200 transition-all"
    >
      <div className="flex items-center justify-between gap-4">
        <span className="font-semibold text-slate-900 text-sm text-left">{q}</span>
        <IconChevronDown
          size={18}
          className={`text-slate-400 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </div>
      {open && <p className="mt-3 text-slate-500 text-sm leading-relaxed text-left">{a}</p>}
    </button>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────── */
export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    try {
      const data = localStorage.getItem("invoicehive_v1");
      if (data && JSON.parse(data).user) setIsLoggedIn(true);
    } catch {}
  }, []);

  const jsonLdSoftware = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "InvoiceHive",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "description": "Free professional invoicing for Nigerian SMEs and freelancers. WHT-compliant, multi-currency, 6 stunning templates.",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "NGN" },
    "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.8", "ratingCount": "2400" },
  };

  const jsonLdFaq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      { "@type": "Question", "name": "Is InvoiceHive really free?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, completely free — forever. Every core feature including invoice templates, recurring invoices, WHT support, reports, and Paystack integration is included at no cost for individual businesses and freelancers. No credit card required, no invoice limits." } },
      { "@type": "Question", "name": "Does it support Nigerian Naira (₦)?", "acceptedAnswer": { "@type": "Answer", "text": "Absolutely. InvoiceHive is built specifically for the Nigerian market. All amounts default to Naira. Paystack and Flutterwave payment integration is on our roadmap." } },
      { "@type": "Question", "name": "Can I send invoices on WhatsApp?", "acceptedAnswer": { "@type": "Answer", "text": "Yes! Every invoice has a 'Share via WhatsApp' button that opens a pre-filled message you can send to your client. They view the full professional invoice in their browser." } },
      { "@type": "Question", "name": "How do I export invoices as PDF?", "acceptedAnswer": { "@type": "Answer", "text": "On any invoice detail page, click 'Print / PDF'. Your browser's print dialog opens — choose 'Save as PDF'. It generates a clean, professional A4 invoice." } },
      { "@type": "Question", "name": "Can I use InvoiceHive on my phone?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. InvoiceHive is designed mobile-first. You can create, send, and track invoices entirely from your smartphone." } },
      { "@type": "Question", "name": "Is my financial data secure?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. InvoiceHive uses industry-standard encryption hosted on enterprise-grade infrastructure. Your financial data is never shared with third parties." } },
    ],
  };

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSoftware) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }} />
      <Navbar isLoggedIn={isLoggedIn} />

      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section className="relative bg-slate-900 pt-32 pb-24 overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500 rounded-full blur-[120px] opacity-10" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-amber-400 rounded-full blur-[100px] opacity-10" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-2 text-amber-400 text-sm font-medium mb-8">
              <span>🇳🇬</span> Built for Nigerian Businesses
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight max-w-4xl mx-auto">
              Stop Chasing Payments.{" "}
              <span className="text-amber-400">Start Getting Paid.</span>
            </h1>

            <p className="mt-6 text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
              Create professional invoices in 60 seconds. Track payments in real-time. Share via WhatsApp. Built for Nigerian SMEs and freelancers.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-white font-bold px-8 py-4 rounded-2xl text-base transition-all shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 hover:-translate-y-0.5"
              >
                Start Free — No Credit Card
              </Link>
              <a
                href="#how-it-works"
                className="w-full sm:w-auto flex items-center justify-center gap-2 border border-white/10 bg-white/5 hover:bg-white/10 text-white font-semibold px-8 py-4 rounded-2xl text-base transition-all"
              >
                See How It Works
              </a>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {["✅ Free forever", "✅ Unlimited invoices", "✅ No credit card", "✅ 4 invoice templates"].map((item) => (
                <span key={item} className="text-slate-400 text-sm">{item}</span>
              ))}
            </div>
          </div>

          <DashboardMockup />
        </div>
      </section>

      {/* ─── TRUST BAR ──────────────────────────────────────────── */}
      <section className="bg-slate-800 py-10">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { val: "2,400+", label: "Businesses using InvoiceHive" },
              { val: "₦4.8B+", label: "Invoiced through platform" },
              { val: "98.7%", label: "Payment success rate" },
              { val: "4.9 ★", label: "Average user rating" },
            ].map(({ val, label }) => (
              <div key={label}>
                <p className="text-2xl font-bold text-amber-400">{val}</p>
                <p className="text-slate-400 text-xs mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ───────────────────────────────────────────── */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-amber-500 text-sm font-bold uppercase tracking-widest">Features</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-3 tracking-tight">
              Everything you need to get paid
            </h2>
            <p className="text-slate-500 mt-4 max-w-xl mx-auto">
              No accounting degree required. Built for real Nigerian business owners.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { emoji: "⚡", title: "60-Second Invoices", desc: "Fill in the client, add your services, hit send. Professional invoices faster than typing a WhatsApp message.", color: "bg-amber-50 border-amber-100", iconBg: "bg-amber-100" },
              { emoji: "💚", title: "WhatsApp Sharing", desc: "Send invoice links directly on WhatsApp. Clients view and acknowledge without leaving the app.", color: "bg-green-50 border-green-100", iconBg: "bg-green-100" },
              { emoji: "📊", title: "Real-Time Tracking", desc: "Know when your invoice was opened, when payment is late, and how much is outstanding — all in one place.", color: "bg-blue-50 border-blue-100", iconBg: "bg-blue-100" },
              { emoji: "🇳🇬", title: "Built for Nigeria", desc: "Nigerian Naira (₦) support, Paystack & Flutterwave integration, and local VAT calculations baked right in.", color: "bg-emerald-50 border-emerald-100", iconBg: "bg-emerald-100" },
              { emoji: "🖨️", title: "PDF Export", desc: "Generate clean, professional PDF invoices with one click. Print or email — your choice.", color: "bg-purple-50 border-purple-100", iconBg: "bg-purple-100" },
              { emoji: "📈", title: "Financial Reports", desc: "Monthly revenue, expense breakdown, profit & loss — always know exactly where your money is.", color: "bg-rose-50 border-rose-100", iconBg: "bg-rose-100" },
              { emoji: "🔔", title: "Auto Reminders", desc: "Set it and forget it. InvoiceHive automatically reminds late clients so you never have to chase.", color: "bg-orange-50 border-orange-100", iconBg: "bg-orange-100" },
              { emoji: "👥", title: "Client Management", desc: "Store client details, track invoice history, and see which clients bring you the most revenue.", color: "bg-cyan-50 border-cyan-100", iconBg: "bg-cyan-100" },
              { emoji: "💳", title: "Expense Tracking", desc: "Log business expenses by category, track monthly spending, and calculate real profit effortlessly.", color: "bg-violet-50 border-violet-100", iconBg: "bg-violet-100" },
              { emoji: "🎨", title: "Invoice Templates", desc: "Choose from 4 stunning designs — Classic, Modern, Minimal, and Professional. All free, all yours.", color: "bg-amber-50 border-amber-200", iconBg: "bg-amber-100" },
              { emoji: "♻️", title: "Recurring Invoices", desc: "Set up monthly retainers once. InvoiceHive auto-generates the next invoice on schedule — perfect for agencies.", color: "bg-teal-50 border-teal-100", iconBg: "bg-teal-100" },
              { emoji: "🧾", title: "WHT Compliant", desc: "Built-in Withholding Tax (5% & 10%) support. Show gross and net amounts — stay FIRS-compliant effortlessly.", color: "bg-red-50 border-red-100", iconBg: "bg-red-100" },
            ].map(({ emoji, title, desc, color, iconBg }) => (
              <div key={title} className={`rounded-2xl p-6 border ${color} hover:shadow-md transition-all`}>
                <div className={`w-12 h-12 ${iconBg} rounded-2xl flex items-center justify-center text-2xl mb-4`}>
                  {emoji}
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ───────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-amber-500 text-sm font-bold uppercase tracking-widest">How It Works</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-3 tracking-tight">Up and running in minutes</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-1/3 right-1/3 h-0.5 bg-amber-200" />
            {[
              { n: "01", emoji: "🚀", title: "Create your account", desc: "Sign up free in under a minute. Enter your business name and you're ready to go. No complicated setup, no credit card." },
              { n: "02", emoji: "📝", title: "Add clients & create invoices", desc: "Add your clients once. Create invoices with your services, pricing, and VAT — all automatically calculated." },
              { n: "03", emoji: "💰", title: "Send & get paid", desc: "Share via WhatsApp or email. Track when clients open your invoice. Mark it paid when money hits your account." },
            ].map(({ n, emoji, title, desc }) => (
              <div key={n} className="flex flex-col items-center text-center relative">
                <div className="relative mb-6">
                  <div className="w-24 h-24 bg-white rounded-3xl shadow-lg flex items-center justify-center text-4xl border border-slate-100">
                    {emoji}
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{n}</span>
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link href="/register" className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-lg shadow-amber-500/25">
              Get started — it's free →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── PRICING ────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-amber-500 text-sm font-bold uppercase tracking-widest">Pricing</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-3 tracking-tight">
              Free forever. Seriously.
            </h2>
            <p className="text-slate-500 mt-4 max-w-lg mx-auto">
              Every feature — templates, recurring invoices, WHT, reports — is free for individual businesses and freelancers. Enterprise pricing only applies to bulk teams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start max-w-3xl mx-auto">
            {/* Free Forever */}
            <div className="bg-slate-900 rounded-3xl p-8 border-2 border-amber-500 relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="bg-amber-500 text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">FREE FOREVER</span>
              </div>
              <p className="text-amber-400 text-sm font-semibold mb-2">For Businesses & Freelancers</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-5xl font-bold text-white">₦0</span>
                <span className="text-slate-400 text-sm">/forever</span>
              </div>
              <p className="text-slate-400 text-xs mb-6">No credit card. No catch. No limits.</p>
              <Link href="/register" className="block text-center py-3.5 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl transition-all text-sm mb-6 shadow-lg shadow-amber-500/20">
                Get Started Free →
              </Link>
              <ul className="space-y-3">
                {[
                  "Unlimited invoices",
                  "4 invoice templates (Classic, Modern, Minimal, Pro)",
                  "Client management",
                  "Expense tracking",
                  "Financial reports & P&L",
                  "PDF export & print",
                  "WhatsApp & email sharing",
                  "Recurring invoices",
                  "WHT (Withholding Tax) support",
                  "Paystack payment links",
                  "Public invoice pages",
                  "Custom branding (logo, colors, signature)",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-slate-300">
                    <IconCheck size={15} className="text-amber-400 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Enterprise */}
            <div className="bg-white rounded-3xl p-8 border-2 border-slate-100 hover:border-slate-200 transition-all">
              <p className="text-slate-500 text-sm font-semibold mb-2">Enterprise</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold text-slate-900">Custom</span>
              </div>
              <p className="text-slate-400 text-xs mb-6">For agencies managing 10+ clients or teams</p>
              <a href="mailto:hello@invoicehive.ng" className="block text-center py-3.5 border-2 border-slate-900 hover:bg-slate-900 hover:text-white text-slate-900 font-bold rounded-xl transition-all text-sm mb-6">
                Talk to Us
              </a>
              <ul className="space-y-3">
                {[
                  "Everything in Free",
                  "Team member accounts (multi-user)",
                  "White-label (remove InvoiceHive branding)",
                  "Bulk invoice sending",
                  "Priority support & SLA",
                  "Custom API integration",
                  "Dedicated account manager",
                  "Volume discounts",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-slate-600">
                    <IconCheck size={15} className="text-emerald-500 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 bg-amber-50 border border-amber-100 rounded-2xl p-6 max-w-2xl mx-auto text-center">
            <p className="text-amber-800 font-semibold text-sm">🎉 Why is it free?</p>
            <p className="text-amber-700 text-sm mt-2 leading-relaxed">
              We believe every Nigerian business deserves professional invoicing tools — not just those who can afford foreign subscriptions. InvoiceHive is free for individuals and sustains through Enterprise contracts with larger organizations.
            </p>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ───────────────────────────────────────── */}
      <section id="testimonials" className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-amber-500 text-sm font-bold uppercase tracking-widest">Testimonials</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-3 tracking-tight">
              Nigerian businesses love InvoiceHive
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Tolu Adeyemi", role: "Freelance Designer, Lagos", initials: "TA", bg: "bg-amber-500", quote: "Before InvoiceHive, I was sending invoice screenshots on WhatsApp. Now my clients take me seriously. I got paid ₦800k in my first month using it.", stars: 5 },
              { name: "Chioma Okafor", role: "CEO, Chioma Creative Agency", initials: "CO", bg: "bg-blue-500", quote: "The overdue reminders alone saved me from chasing 3 clients manually. InvoiceHive is now part of how we close every project. Absolutely worth it.", stars: 5 },
              { name: "Emeka Nwosu", role: "Founder, TechStack Nigeria", initials: "EN", bg: "bg-emerald-500", quote: "I needed something Nigerian — not some US tool charging me in dollars. InvoiceHive works in Naira, supports Paystack, and was built for how we work here.", stars: 5 },
              { name: "Amaka Eze", role: "Events Planner, Abuja", initials: "AE", bg: "bg-purple-500", quote: "I share invoices on WhatsApp directly from InvoiceHive. My clients open them immediately. No more 'I didn't see your email' excuses. Total game changer.", stars: 5 },
              { name: "Kola Bankole", role: "Photographer, Port Harcourt", initials: "KB", bg: "bg-pink-500", quote: "The financial reports showed me I was undercharging. After seeing my numbers clearly, I increased my rates by 40% and still got clients. Proper tool.", stars: 5 },
              { name: "Fatima Lawal", role: "Marketing Consultant, Kano", initials: "FL", bg: "bg-teal-500", quote: "Clean, fast, and works great on mobile. I create invoices on my phone on the way to meetings. InvoiceHive is the tool I wished existed 5 years ago.", stars: 5 },
            ].map(({ name, role, initials, bg, quote, stars }) => (
              <div key={name} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: stars }).map((_, i) => (
                    <span key={i} className="text-amber-400 text-sm">★</span>
                  ))}
                </div>
                <p className="text-slate-700 text-sm leading-relaxed mb-5">"{quote}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white text-xs font-bold">{initials}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{name}</p>
                    <p className="text-slate-400 text-xs">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── COMPARISON ─────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-amber-500 text-sm font-bold uppercase tracking-widest">Why InvoiceHive</span>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mt-3">The only free invoicing tool built for Nigeria</h2>
            <p className="text-slate-500 mt-3">Everything competitors charge for — free, forever.</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-900">
                  <th className="text-left p-4 text-slate-300 text-sm font-medium">Feature</th>
                  <th className="p-4 text-center text-slate-400 text-sm font-medium">Wave</th>
                  <th className="p-4 text-center text-slate-400 text-sm font-medium">FreshBooks</th>
                  <th className="p-4 text-center text-slate-400 text-sm font-medium">Zoho</th>
                  <th className="p-4 text-center text-amber-400 text-sm font-bold">InvoiceHive</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[
                  { label: "Price", vals: ["Free*", "$17/mo", "$15/mo", <span key="ih" className="font-bold text-amber-600">Free Forever</span>] },
                  { label: "Works in Nigeria (₦)", vals: ["❌", "❌", "Partial", "✅"] },
                  { label: "WhatsApp sharing", vals: ["❌", "❌", "❌", "✅"] },
                  { label: "WHT support", vals: ["❌", "❌", "❌", "✅"] },
                  { label: "Invoice templates", vals: ["1", "Paid", "Paid", "✅ 4 free"] },
                  { label: "Recurring invoices", vals: ["✅", "✅", "✅", "✅"] },
                  { label: "Paystack / Flutterwave", vals: ["❌", "❌", "❌", "✅"] },
                  { label: "PDF export", vals: ["✅", "✅", "✅", "✅"] },
                  { label: "Financial reports", vals: ["✅", "✅", "✅", "✅"] },
                ].map(({ label, vals }) => (
                  <tr key={label} className="hover:bg-slate-50/50">
                    <td className="p-4 text-sm text-slate-700 font-medium">{label}</td>
                    {vals.map((val, i) => (
                      <td key={i} className={`p-4 text-center text-sm ${i === 3 ? "bg-amber-50/50 font-semibold" : ""}`}>
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-100">
              <p className="text-xs text-slate-400">*Wave is free but US-focused and does not support Nigerian Naira natively. Prices correct as of 2026.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ────────────────────────────────────────────────── */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-amber-500 text-sm font-bold uppercase tracking-widest">FAQ</span>
            <h2 className="text-3xl font-bold text-slate-900 mt-3 tracking-tight">Common questions</h2>
          </div>

          <div className="space-y-3">
            {[
              { q: "Is InvoiceHive really free?", a: "Yes, completely free — forever. Every core feature including invoice templates, recurring invoices, WHT support, reports, and Paystack integration is included at no cost for individual businesses and freelancers. No credit card required, no invoice limits." },
              { q: "Does it support Nigerian Naira (₦)?", a: "Absolutely. InvoiceHive is built specifically for the Nigerian market. All amounts are in Naira. Paystack and Flutterwave payment integration is on our roadmap." },
              { q: "Can I send invoices on WhatsApp?", a: "Yes! Every invoice has a 'Share via WhatsApp' button that opens a pre-filled message you can send to your client. They view the full professional invoice in their browser." },
              { q: "How do I export invoices as PDF?", a: "On any invoice detail page, click 'Print / PDF'. Your browser's print dialog opens — choose 'Save as PDF'. It generates a clean, professional A4 invoice." },
              { q: "Can I use InvoiceHive on my phone?", a: "Yes. InvoiceHive is designed mobile-first. You can create, send, and track invoices entirely from your smartphone — perfect for Nigerian business owners on the go." },
              { q: "Who is the Enterprise plan for?", a: "Enterprise is for agencies or organizations managing 10+ clients with multiple team members. It adds white-labeling (remove InvoiceHive branding), team accounts, bulk features, and a dedicated account manager. Contact hello@invoicehive.ng for pricing." },
              { q: "Is my financial data secure?", a: "Yes. InvoiceHive uses industry-standard encryption hosted on enterprise-grade infrastructure. Your financial data is never shared with third parties." },
            ].map(({ q, a }) => (
              <FAQItem key={q} q={q} a={a} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ──────────────────────────────────────────── */}
      <section className="py-24 bg-amber-500">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Ready to get paid faster?
          </h2>
          <p className="text-amber-100 mt-4 text-lg leading-relaxed">
            Join 2,400+ Nigerian businesses already using InvoiceHive. Start free — no credit card required.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-white hover:bg-amber-50 text-amber-600 font-bold px-8 py-4 rounded-2xl transition-all shadow-xl text-base"
            >
              Create Your Free Account →
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 border-2 border-white/30 hover:border-white/60 text-white font-semibold px-8 py-4 rounded-2xl transition-all text-base"
            >
              I already have an account
            </Link>
          </div>
          <p className="mt-6 text-amber-200 text-sm">100% free · Unlimited invoices · No credit card required · Made for Nigeria 🇳🇬</p>
        </div>
      </section>

      {/* ─── FOOTER ─────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center">
                  <IconHive size={20} className="text-white" />
                </div>
                <span className="text-white font-bold text-lg">InvoiceHive</span>
              </div>
              <p className="text-sm leading-relaxed max-w-xs">
                Smart invoicing for growing Nigerian businesses. Get paid faster, track everything, stress less.
              </p>
              <p className="text-xs text-slate-600 mt-4">hello@invoicehive.ng</p>
              <div className="flex items-center gap-3 mt-5">
                {[["𝕏", "#"], ["in", "#"], ["ig", "#"]].map(([icon, href]) => (
                  <a
                    key={icon}
                    href={href}
                    className="w-9 h-9 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center text-sm text-slate-400 hover:text-white transition-all"
                  >
                    {icon}
                  </a>
                ))}
              </div>
            </div>

            {[
              { title: "Product", links: ["Features", "Pricing", "How it works", "Changelog", "Roadmap"] },
              { title: "Company", links: ["About Us", "Blog", "Careers", "Press Kit", "Contact"] },
              { title: "Legal", links: ["Privacy Policy", "Terms of Service", "Cookie Policy", "Security"] },
            ].map(({ title, links }) => (
              <div key={title}>
                <p className="text-white font-semibold text-sm mb-4">{title}</p>
                <ul className="space-y-2.5">
                  {links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm hover:text-white transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm">© {new Date().getFullYear()} InvoiceHive Ltd. All rights reserved. Made with ❤️ in Lagos, Nigeria 🇳🇬</p>
            <div className="flex items-center gap-4 text-sm">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
