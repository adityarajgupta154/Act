import { defineConfig } from "drizzle-kit";
import path from "path";

// SUPABASE_DATABASE_URL takes priority (migration target).
// Falls back to Replit-provisioned DATABASE_URL for local dev.
const rawUrl = process.env.SUPABASE_DATABASE_URL ?? process.env.DATABASE_URL;
if (!rawUrl) {
  throw new Error("SUPABASE_DATABASE_URL or DATABASE_URL must be set");
}

// Supabase requires SSL — append sslmode if not already present.
const dbUrl =
  rawUrl.includes("supabase") && !rawUrl.includes("sslmode")
    ? `${rawUrl}?sslmode=require`
    : rawUrl;

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl,
  },
});
