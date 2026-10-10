import { defineConfig } from "drizzle-kit";

// D1 (SQLite). `npm run db:generate` writes SQL migrations to ./migrations,
// which wrangler applies with `wrangler d1 migrations apply`.
export default defineConfig({
  schema: "./db/schema.ts",
  out: "./migrations",
  dialect: "sqlite",
});
