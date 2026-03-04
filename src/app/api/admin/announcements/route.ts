import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { announcements, users } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await db
    .select({
      id: announcements.id,
      title: announcements.title,
      content: announcements.content,
      type: announcements.type,
      isActive: announcements.isActive,
      createdAt: announcements.createdAt,
      creatorName: users.name,
      creatorEmail: users.email,
    })
    .from(announcements)
    .leftJoin(users, eq(announcements.createdBy, users.id))
    .orderBy(desc(announcements.createdAt));

  return NextResponse.json({ announcements: rows });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { title, content, type } = await req.json();
  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
  }

  const validTypes = ["banner", "email"];
  const announcementType = validTypes.includes(type) ? type : "banner";

  const [row] = await db
    .insert(announcements)
    .values({ title: title.trim(), content: content.trim(), type: announcementType, createdBy: admin.id })
    .returning();

  // If type is "email", trigger a batch email to all users via Resend
  if (announcementType === "email" && process.env.RESEND_API_KEY) {
    try {
      const allUsers = await db.select({ email: users.email, name: users.name }).from(users);
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

      // Send in batches of 50
      for (let i = 0; i < allUsers.length; i += 50) {
        const batch = allUsers.slice(i, i + 50);
        await Promise.allSettled(
          batch.map((u) =>
            resend.emails.send({
              from: `InvoiceHive <${fromEmail}>`,
              to: [u.email],
              subject: title.trim(),
              html: `<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px">
                <h2 style="color:#f59e0b">${title.trim()}</h2>
                <p style="color:#334155;line-height:1.6">${content.trim()}</p>
                <hr style="border-color:#e2e8f0;margin:24px 0">
                <p style="color:#94a3b8;font-size:12px">Sent via <a href="https://invoicehive.ng" style="color:#f59e0b">InvoiceHive</a></p>
              </div>`,
            })
          )
        );
      }
    } catch (e) {
      console.error("Batch email error:", e);
    }
  }

  return NextResponse.json({ announcement: row });
}
