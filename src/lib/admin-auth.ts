import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type AdminUser = { id: string; role: string };

/** Call in admin API routes. Returns the admin user or null if not authorized. */
export async function requireAdmin(): Promise<AdminUser | null> {
  const session = await getServerSession(authOptions);
  const user = session?.user as AdminUser | undefined;
  if (!user?.id || user.role !== "admin") return null;
  return user;
}
