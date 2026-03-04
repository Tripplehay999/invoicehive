import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin-auth";
import bcrypt from "bcryptjs";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { action, plan } = body as { action: string; plan?: string };

  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (action === "suspend") {
    await db.update(users).set({ isSuspended: true }).where(eq(users.id, id));
    return NextResponse.json({ success: true });
  }

  if (action === "unsuspend") {
    await db.update(users).set({ isSuspended: false }).where(eq(users.id, id));
    return NextResponse.json({ success: true });
  }

  if (action === "changePlan" && plan) {
    const allowed = ["free", "pro", "business"];
    if (!allowed.includes(plan)) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    await db.update(users).set({ plan }).where(eq(users.id, id));
    return NextResponse.json({ success: true });
  }

  if (action === "resetPassword") {
    const chars = "ABCDEFGHJKMNPQRSTWXYZabcdefghjkmnpqrstwxyz23456789";
    const tempPassword = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    const hashed = await bcrypt.hash(tempPassword, 12);
    await db.update(users).set({ password: hashed }).where(eq(users.id, id));
    return NextResponse.json({ success: true, tempPassword });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (id === admin.id) return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });

  await db.delete(users).where(eq(users.id, id));
  return NextResponse.json({ success: true });
}
