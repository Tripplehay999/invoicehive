import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { supportTickets } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin-auth";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { action, response, priority } = body as {
    action: string;
    response?: string;
    priority?: string;
  };

  const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.id, id)).limit(1);
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  if (action === "respond" && response) {
    await db.update(supportTickets).set({
      response: response.trim(),
      respondedAt: new Date(),
      status: "closed",
    }).where(eq(supportTickets.id, id));
    return NextResponse.json({ success: true });
  }

  if (action === "close") {
    await db.update(supportTickets).set({ status: "closed" }).where(eq(supportTickets.id, id));
    return NextResponse.json({ success: true });
  }

  if (action === "reopen") {
    await db.update(supportTickets).set({ status: "open" }).where(eq(supportTickets.id, id));
    return NextResponse.json({ success: true });
  }

  if (action === "setPriority" && priority) {
    const allowed = ["normal", "high", "urgent"];
    if (!allowed.includes(priority)) return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
    await db.update(supportTickets).set({ priority }).where(eq(supportTickets.id, id));
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
