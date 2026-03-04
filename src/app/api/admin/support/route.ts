import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { supportTickets, users } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const tickets = await db
    .select({
      id: supportTickets.id,
      subject: supportTickets.subject,
      message: supportTickets.message,
      status: supportTickets.status,
      priority: supportTickets.priority,
      response: supportTickets.response,
      respondedAt: supportTickets.respondedAt,
      createdAt: supportTickets.createdAt,
      userId: supportTickets.userId,
      userName: users.name,
      userEmail: users.email,
    })
    .from(supportTickets)
    .leftJoin(users, eq(supportTickets.userId, users.id))
    .orderBy(desc(supportTickets.createdAt));

  return NextResponse.json({ tickets });
}

// User-facing: create a support ticket
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const { subject, message } = await req.json();
  if (!subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
  }

  const [ticket] = await db
    .insert(supportTickets)
    .values({ userId, subject: subject.trim(), message: message.trim() })
    .returning();

  return NextResponse.json({ ticket });
}
