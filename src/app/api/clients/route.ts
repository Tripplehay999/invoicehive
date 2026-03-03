import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

function mapClient(c: typeof clients.$inferSelect) {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone ?? "",
    address: c.address ?? "",
    city: c.city ?? "",
    createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : String(c.createdAt),
  };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const result = await db
    .select()
    .from(clients)
    .where(eq(clients.userId, userId))
    .orderBy(clients.createdAt);

  return NextResponse.json(result.map(mapClient));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const body = await req.json();

  if (!body.name || !body.email) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }

  const [client] = await db
    .insert(clients)
    .values({
      userId,
      name: body.name,
      email: body.email,
      phone: body.phone ?? "",
      address: body.address ?? "",
      city: body.city ?? "",
    })
    .returning();

  return NextResponse.json(mapClient(client), { status: 201 });
}
