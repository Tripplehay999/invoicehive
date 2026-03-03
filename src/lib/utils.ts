import type { Invoice, LineItem, MonthlyRevenue, InvoiceStatus } from "./types";

export function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateInput(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return formatDateInput(date);
}

export function isOverdue(dueDate: string, status: InvoiceStatus): boolean {
  if (status === "paid" || status === "cancelled") return false;
  return new Date(dueDate) < new Date();
}

export function generateInvoiceNumber(existingNumbers: string[]): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `INV-${year}${month}-`;
  const existing = existingNumbers
    .filter((n) => n.startsWith(prefix))
    .map((n) => parseInt(n.replace(prefix, "")) || 0);
  const next = existing.length > 0 ? Math.max(...existing) + 1 : 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
}

export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function calculateLineItemTotal(item: LineItem): number {
  const base = item.quantity * item.unitPrice;
  const tax = base * (item.taxRate / 100);
  return base + tax;
}

export function calculateInvoiceTotals(items: LineItem[], discount: number) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const taxAmount = items.reduce((sum, item) => {
    return sum + item.quantity * item.unitPrice * (item.taxRate / 100);
  }, 0);
  const total = subtotal + taxAmount - discount;
  return { subtotal, taxAmount, total };
}

export function getStatusColor(status: InvoiceStatus): string {
  const map: Record<InvoiceStatus, string> = {
    draft: "bg-slate-100 text-slate-600",
    sent: "bg-blue-100 text-blue-700",
    viewed: "bg-purple-100 text-purple-700",
    paid: "bg-emerald-100 text-emerald-700",
    overdue: "bg-red-100 text-red-700",
    cancelled: "bg-slate-100 text-slate-500",
  };
  return map[status];
}

export function getStatusDot(status: InvoiceStatus): string {
  const map: Record<InvoiceStatus, string> = {
    draft: "bg-slate-400",
    sent: "bg-blue-500",
    viewed: "bg-purple-500",
    paid: "bg-emerald-500",
    overdue: "bg-red-500",
    cancelled: "bg-slate-400",
  };
  return map[status];
}

export function getStatusLabel(status: InvoiceStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function getMonthlyRevenue(invoices: Invoice[]): MonthlyRevenue[] {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const result: MonthlyRevenue[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthIndex = d.getMonth();
    const year = d.getFullYear();

    const revenue = invoices
      .filter((inv) => {
        const date = new Date(inv.issueDate);
        return (
          inv.status === "paid" &&
          date.getMonth() === monthIndex &&
          date.getFullYear() === year
        );
      })
      .reduce((sum, inv) => sum + inv.total, 0);

    result.push({ month: months[monthIndex], revenue, expenses: 0 });
  }
  return result;
}

export function getDashboardStats(invoices: Invoice[]) {
  const paid = invoices.filter((i) => i.status === "paid");
  const outstanding = invoices.filter((i) => ["sent", "viewed"].includes(i.status));
  const overdue = invoices.filter((i) => i.status === "overdue");
  const draft = invoices.filter((i) => i.status === "draft");

  return {
    totalRevenue: paid.reduce((s, i) => s + i.total, 0),
    outstanding: outstanding.reduce((s, i) => s + i.total, 0),
    paidCount: paid.length,
    outstandingCount: outstanding.length,
    overdueCount: overdue.length,
    overdueAmount: overdue.reduce((s, i) => s + i.total, 0),
    draftCount: draft.length,
    total: invoices.length,
  };
}

export function getCategoryColor(category: string): string {
  const map: Record<string, string> = {
    rent: "bg-violet-100 text-violet-700",
    utilities: "bg-blue-100 text-blue-700",
    salaries: "bg-amber-100 text-amber-700",
    marketing: "bg-pink-100 text-pink-700",
    supplies: "bg-teal-100 text-teal-700",
    travel: "bg-orange-100 text-orange-700",
    software: "bg-indigo-100 text-indigo-700",
    other: "bg-slate-100 text-slate-600",
  };
  return map[category] || map.other;
}

export function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return formatDate(dateStr);
}
