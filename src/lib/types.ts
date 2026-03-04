export type InvoiceStatus = "draft" | "sent" | "viewed" | "paid" | "overdue" | "cancelled";

export type RecurringInterval = "weekly" | "monthly" | "quarterly" | "yearly";

export type TemplateStyle = "classic" | "modern" | "minimal" | "professional" | "executive" | "vibrant";

export type ExpenseCategory =
  | "rent"
  | "utilities"
  | "salaries"
  | "marketing"
  | "supplies"
  | "travel"
  | "software"
  | "other";

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number; // percentage e.g. 7.5 for 7.5% VAT
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  items: LineItem[];
  subtotal: number;
  taxAmount: number;
  discount: number;
  total: number;
  notes: string;
  paymentInstructions: string;
  showPaymentDetails: boolean;
  whtRate: number;
  currency: string;
  isRecurring: boolean;
  recurringInterval?: RecurringInterval;
  nextInvoiceDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  notes: string;
}

export interface BusinessProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  logo: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  brandColor: string;
  customFooter: string;
  signatureUrl: string;
  paymentLink: string;
  templateStyle: TemplateStyle;
  firsRegNumber: string;
  defaultCurrency: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  businessProfile: BusinessProfile;
}

export interface AppState {
  user: User | null;
  invoices: Invoice[];
  clients: Client[];
  expenses: Expense[];
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  expenses: number;
}
