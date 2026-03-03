import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { db } from "@/lib/db";
import { invoices } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Paystack sends a POST to this endpoint on every payment event.
// We verify the HMAC-SHA512 signature before trusting the payload.
export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-paystack-signature");
  const body = await req.text();

  const hash = createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(body)
    .digest("hex");

  if (hash !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body);

  if (event.event === "charge.success") {
    const invoiceId = event.data?.metadata?.invoiceId;
    if (invoiceId) {
      await db
        .update(invoices)
        .set({ status: "paid", updatedAt: new Date() })
        .where(eq(invoices.id, invoiceId));
    }
  }

  return NextResponse.json({ received: true });
}
