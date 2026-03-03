import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { invoices, clients } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const { invoiceId } = await req.json();

  const [invoice] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, invoiceId), eq(invoices.userId, userId)))
    .limit(1);

  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  // Get client email for Paystack
  let clientEmail = "customer@invoicehive.ng";
  if (invoice.clientId) {
    const [client] = await db
      .select({ email: clients.email })
      .from(clients)
      .where(eq(clients.id, invoice.clientId))
      .limit(1);
    if (client?.email) clientEmail = client.email;
  }

  // Paystack amount is in kobo (1 NGN = 100 kobo)
  const amountKobo = Math.round(parseFloat(invoice.total) * 100);
  const reference = `inv_${invoiceId}_${Date.now()}`;

  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: clientEmail,
      amount: amountKobo,
      reference,
      currency: "NGN",
      metadata: {
        invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        userId,
      },
      callback_url: `${process.env.NEXTAUTH_URL}/invoices/${invoiceId}?paid=1`,
    }),
  });

  const data = await res.json();
  if (!data.status) {
    return NextResponse.json({ error: data.message ?? "Paystack error" }, { status: 400 });
  }

  return NextResponse.json({
    authorizationUrl: data.data.authorization_url,
    reference: data.data.reference,
  });
}
