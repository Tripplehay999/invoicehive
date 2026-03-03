"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import type { Invoice, Client, Expense, User } from "./types";

interface AppContextType {
  user: User | null;
  invoices: Invoice[];
  clients: Client[];
  expenses: Expense[];
  isLoaded: boolean;
  // Auth
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, businessName: string) => Promise<boolean>;
  logout: () => void;
  // Invoices
  addInvoice: (invoice: Omit<Invoice, "id" | "createdAt" | "updatedAt">) => Promise<Invoice>;
  updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  // Clients
  addClient: (client: Omit<Client, "id" | "createdAt">) => Promise<Client>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  // Expenses
  addExpense: (expense: Omit<Expense, "id">) => Promise<Expense>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [dbUser, setDbUser] = useState<Record<string, string> | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Derive User from session (non-null whenever authenticated) + optional db profile
  const user: User | null = session?.user
    ? {
        id: (session.user as { id: string }).id,
        name: session.user.name ?? "",
        email: session.user.email ?? "",
        businessProfile: {
          name:
            dbUser?.businessName ??
            (session.user as { businessName?: string }).businessName ??
            "",
          email: session.user.email ?? "",
          phone: dbUser?.businessPhone ?? "",
          address: dbUser?.businessAddress ?? "",
          city: dbUser?.businessCity ?? "",
          logo: dbUser?.logoUrl ?? "",
          bankName: dbUser?.bankName ?? "",
          accountNumber: dbUser?.accountNumber ?? "",
          accountName: dbUser?.accountName ?? "",
          brandColor: dbUser?.brandColor ?? "#f59e0b",
          customFooter: dbUser?.customFooter ?? "",
          signatureUrl: dbUser?.signatureUrl ?? "",
          },
        }
      : null;

  // Fetch everything when session becomes authenticated
  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      setDbUser(null);
      setInvoices([]);
      setClients([]);
      setExpenses([]);
      setIsLoaded(true);
      return;
    }

    setIsLoaded(false);
    Promise.all([
      fetch("/api/user").then((r) => r.json()),
      fetch("/api/invoices").then((r) => r.json()),
      fetch("/api/clients").then((r) => r.json()),
      fetch("/api/expenses").then((r) => r.json()),
    ])
      .then(([userRes, invRes, cliRes, expRes]) => {
        setDbUser(userRes);
        setInvoices(Array.isArray(invRes) ? invRes : []);
        setClients(Array.isArray(cliRes) ? cliRes : []);
        setExpenses(Array.isArray(expRes) ? expRes : []);
      })
      .catch(console.error)
      .finally(() => setIsLoaded(true));
  }, [status]);

  // ─── Auth ───────────────────────────────────────────────────

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const res = await signIn("credentials", { email, password, redirect: false });
    return res?.ok ?? false;
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string, businessName: string): Promise<boolean> => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, businessName }),
      });
      if (!res.ok) return false;
      const signInRes = await signIn("credentials", { email, password, redirect: false });
      return signInRes?.ok ?? false;
    },
    []
  );

  const logout = useCallback(() => {
    signOut({ callbackUrl: "/login" });
  }, []);

  // ─── Invoices ───────────────────────────────────────────────

  const addInvoice = useCallback(
    async (invoice: Omit<Invoice, "id" | "createdAt" | "updatedAt">): Promise<Invoice> => {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoice),
      });
      const created: Invoice = await res.json();
      setInvoices((prev) => [created, ...prev]);
      return created;
    },
    []
  );

  const updateInvoice = useCallback(async (id: string, updates: Partial<Invoice>): Promise<void> => {
    const res = await fetch(`/api/invoices/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const updated: Invoice = await res.json();
    setInvoices((prev) => prev.map((inv) => (inv.id === id ? updated : inv)));
  }, []);

  const deleteInvoice = useCallback(async (id: string): Promise<void> => {
    await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
  }, []);

  // ─── Clients ────────────────────────────────────────────────

  const addClient = useCallback(
    async (client: Omit<Client, "id" | "createdAt">): Promise<Client> => {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(client),
      });
      const created: Client = await res.json();
      setClients((prev) => [created, ...prev]);
      return created;
    },
    []
  );

  const updateClient = useCallback(async (id: string, updates: Partial<Client>): Promise<void> => {
    const res = await fetch(`/api/clients/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const updated: Client = await res.json();
    setClients((prev) => prev.map((c) => (c.id === id ? updated : c)));
  }, []);

  const deleteClient = useCallback(async (id: string): Promise<void> => {
    await fetch(`/api/clients/${id}`, { method: "DELETE" });
    setClients((prev) => prev.filter((c) => c.id !== id));
  }, []);

  // ─── Expenses ───────────────────────────────────────────────

  const addExpense = useCallback(
    async (expense: Omit<Expense, "id">): Promise<Expense> => {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expense),
      });
      const created: Expense = await res.json();
      setExpenses((prev) => [created, ...prev]);
      return created;
    },
    []
  );

  const updateExpense = useCallback(async (id: string, updates: Partial<Expense>): Promise<void> => {
    const res = await fetch(`/api/expenses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const updated: Expense = await res.json();
    setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)));
  }, []);

  const deleteExpense = useCallback(async (id: string): Promise<void> => {
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return (
    <AppContext.Provider
      value={{
        user, invoices, clients, expenses, isLoaded,
        login, register, logout,
        addInvoice, updateInvoice, deleteInvoice,
        addClient, updateClient, deleteClient,
        addExpense, updateExpense, deleteExpense,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
