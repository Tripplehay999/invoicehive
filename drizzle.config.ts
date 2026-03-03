import type { Config } from "drizzle-kit";
import { config } from "dotenv";

// Load .env.local (Next.js convention) for drizzle-kit CLI
config({ path: ".env.local" });

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
