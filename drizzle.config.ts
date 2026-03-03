import type { Config } from "drizzle-kit";
import { config } from "dotenv";

// Try .env first, fall back to .env.local
config({ path: ".env" });
config({ path: ".env.local" });

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
