import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { invoices } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const reference = req.nextUrl.searchParams.get("reference");
  if (!reference) return NextResponse.json({ error: "reference required" }, { status: 400 });

  const res = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
  );

  const data = await res.json();
  if (!data.status) {
    return NextResponse.json({ error: data.message }, { status: 400 });
  }

  const { status, metadata } = data.data;
  const invoiceId = metadata?.invoiceId;

  if (status === "success" && invoiceId) {
    await db
      .update(invoices)
      .set({ status: "paid", updatedAt: new Date() })
      .where(and(eq(invoices.id, invoiceId), eq(invoices.userId, userId)));

    return NextResponse.json({ verified: true, invoiceId });
  }

  return NextResponse.json({ verified: false, status });
}
