"use client";
import { useRef, useState } from "react";
import { useApp } from "@/lib/store";
import { IconCheck } from "@/components/Icons";

export default function SettingsPage() {
  const { user } = useApp();
  const [saved, setSaved] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    businessName: user?.businessProfile?.name ?? "",
    phone: user?.businessProfile?.phone ?? "",
    address: user?.businessProfile?.address ?? "",
    city: user?.businessProfile?.city ?? "",
    bankName: user?.businessProfile?.bankName ?? "",
    accountNumber: user?.businessProfile?.accountNumber ?? "",
    accountName: user?.businessProfile?.accountName ?? "",
    // Branding
    logoUrl: user?.businessProfile?.logo ?? "",
    brandColor: user?.businessProfile?.brandColor ?? "#f59e0b",
    customFooter: user?.businessProfile?.customFooter ?? "",
    signatureUrl: user?.businessProfile?.signatureUrl ?? "",
    paymentLink: user?.businessProfile?.paymentLink ?? "",
  });

  function handleFileUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    field: "logoUrl" | "signatureUrl"
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm((f) => ({ ...f, [field]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/user", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        businessName: form.businessName,
        businessPhone: form.phone,
        businessAddress: form.address,
        businessCity: form.city,
        bankName: form.bankName,
        accountNumber: form.accountNumber,
        accountName: form.accountName,
        logoUrl: form.logoUrl,
        brandColor: form.brandColor,
        customFooter: form.customFooter,
        signatureUrl: form.signatureUrl,
        paymentLink: form.paymentLink,
      }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
        <p className="text-slate-500 text-sm">Manage your account and business profile</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Personal info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-900 mb-5">Personal Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Business info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-900 mb-5">Business Profile</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Business Name</label>
              <input
                value={form.businessName}
                onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>
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
                placeholder="Lagos, Nigeria"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Address</label>
              <input
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Bank info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-900 mb-1">Bank Details</h3>
          <p className="text-slate-400 text-sm mb-5">Shown on invoices as payment instructions</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Bank Name</label>
              <input
                value={form.bankName}
                onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
                placeholder="Zenith Bank"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Account Number</label>
              <input
                value={form.accountNumber}
                onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))}
                placeholder="2012345678"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Account Name</label>
              <input
                value={form.accountName}
                onChange={(e) => setForm((f) => ({ ...f, accountName: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Invoice Branding */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-900 mb-1">Invoice Branding</h3>
          <p className="text-slate-400 text-sm mb-6">Personalize how your invoices look to clients</p>

          <div className="space-y-6">
            {/* Logo upload */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Business Logo</label>
              <div className="flex items-center gap-4">
                <div
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50 cursor-pointer hover:border-amber-400 transition-colors"
                  onClick={() => logoInputRef.current?.click()}
                >
                  {form.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                  ) : (
                    <div className="text-center">
                      <svg className="w-6 h-6 text-slate-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs text-slate-400 mt-1">Upload</p>
                    </div>
                  )}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="text-sm font-medium text-amber-600 hover:text-amber-700"
                  >
                    {form.logoUrl ? "Change logo" : "Upload logo"}
                  </button>
                  {form.logoUrl && (
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, logoUrl: "" }))}
                      className="block text-xs text-slate-400 hover:text-red-500 mt-1"
                    >
                      Remove
                    </button>
                  )}
                  <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 2MB</p>
                </div>
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e, "logoUrl")}
              />
            </div>

            {/* Brand color */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Brand Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.brandColor}
                  onChange={(e) => setForm((f) => ({ ...f, brandColor: e.target.value }))}
                  className="w-12 h-12 rounded-xl border border-slate-200 cursor-pointer p-1"
                />
                <div>
                  <input
                    type="text"
                    value={form.brandColor}
                    onChange={(e) => setForm((f) => ({ ...f, brandColor: e.target.value }))}
                    maxLength={7}
                    className="w-28 px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-xs text-slate-400 mt-1">Used in invoice header</p>
                </div>
                {/* Color swatches */}
                <div className="flex gap-2 ml-2">
                  {["#f59e0b", "#3b82f6", "#8b5cf6", "#10b981", "#ef4444", "#0f172a"].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, brandColor: c }))}
                      className="w-8 h-8 rounded-lg border-2 transition-all"
                      style={{
                        backgroundColor: c,
                        borderColor: form.brandColor === c ? "#0f172a" : "transparent",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Signature upload */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Signature</label>
              <div className="flex items-center gap-4">
                <div
                  className="w-32 h-16 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50 cursor-pointer hover:border-amber-400 transition-colors"
                  onClick={() => signatureInputRef.current?.click()}
                >
                  {form.signatureUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.signatureUrl} alt="Signature" className="w-full h-full object-contain p-2" />
                  ) : (
                    <p className="text-xs text-slate-400 text-center px-2">Click to upload signature</p>
                  )}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => signatureInputRef.current?.click()}
                    className="text-sm font-medium text-amber-600 hover:text-amber-700"
                  >
                    {form.signatureUrl ? "Change signature" : "Upload signature"}
                  </button>
                  {form.signatureUrl && (
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, signatureUrl: "" }))}
                      className="block text-xs text-slate-400 hover:text-red-500 mt-1"
                    >
                      Remove
                    </button>
                  )}
                  <p className="text-xs text-slate-400 mt-1">PNG with transparent bg recommended</p>
                </div>
              </div>
              <input
                ref={signatureInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e, "signatureUrl")}
              />
            </div>

            {/* Payment link */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment Link (Pay Here URL)</label>
              <input
                type="url"
                value={form.paymentLink}
                onChange={(e) => setForm((f) => ({ ...f, paymentLink: e.target.value }))}
                placeholder="https://paystack.com/pay/your-link"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
              <p className="text-xs text-slate-400 mt-1">Shown as a "Pay Now" button on digital invoices (Paystack, Flutterwave, Stripe, etc.)</p>
            </div>

            {/* Custom footer */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Custom Footer Message</label>
              <textarea
                value={form.customFooter}
                onChange={(e) => setForm((f) => ({ ...f, customFooter: e.target.value }))}
                placeholder="Thank you for your business! Payment is due within 30 days."
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm resize-none"
              />
              <p className="text-xs text-slate-400 mt-1">Appears at the bottom of every invoice</p>
            </div>
          </div>
        </div>

        {/* Plan */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Current Plan</p>
              <p className="text-2xl font-bold mt-1">Free</p>
              <p className="text-white/70 text-sm mt-1">5 invoices/month · Basic features</p>
            </div>
            <button
              type="button"
              className="bg-white text-amber-600 font-bold px-4 py-2 rounded-xl text-sm hover:bg-amber-50 transition-all"
            >
              Upgrade to Pro
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 pt-4 border-t border-white/20">
            {["Unlimited invoices", "Remove branding", "Auto reminders", "Expense tracking"].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-white/90">
                <span className="text-white">✓</span> {f}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-3 rounded-xl transition-all"
          >
            {saved ? <><IconCheck size={16} /> Saved!</> : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
