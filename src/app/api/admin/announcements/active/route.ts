import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { announcements } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

// Auth required but any user can view active banners
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const active = await db
    .select({
      id: announcements.id,
      title: announcements.title,
      content: announcements.content,
    })
    .from(announcements)
    .where(and(eq(announcements.isActive, true), eq(announcements.type, "banner")))
    .orderBy(desc(announcements.createdAt))
    .limit(3);

  return NextResponse.json({ announcements: active });
}
