import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { mkdir, writeFile, readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { createOAuthCallbackHandler, authenticateRequest } from "./kimi/auth";
import { Paths } from "@contracts/constants";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));
app.get(Paths.oauthCallback, createOAuthCallbackHandler());

// ---------------------------------------------------------------------------
// Media uploads (inspection photos / videos), stored on local disk
// ---------------------------------------------------------------------------
const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");
const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
  gif: "image/gif", heic: "image/heic",
  mp4: "video/mp4", mov: "video/quicktime", webm: "video/webm", m4v: "video/mp4",
};

app.post("/api/upload", async (c) => {
  try {
    await authenticateRequest(c.req.raw.headers);
  } catch {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const form = await c.req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return c.json({ error: "No file" }, 400);
  if (file.size > 50 * 1024 * 1024) return c.json({ error: "File too large (50 MB max)" }, 400);
  const rawExt = (file.name.split(".").pop() || "bin").toLowerCase();
  const ext = rawExt.replace(/[^a-z0-9]/g, "") || "bin";
  if (!MIME_BY_EXT[ext]) return c.json({ error: "Unsupported file type" }, 400);
  const name = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
  return c.json({ url: `/uploads/${name}` });
});

app.get("/uploads/*", async (c) => {
  const rel = decodeURIComponent(c.req.path.replace(/^\/uploads\//, ""));
  const filePath = path.resolve(UPLOAD_DIR, rel);
  if (!filePath.startsWith(UPLOAD_DIR + path.sep) || !existsSync(filePath)) {
    return c.json({ error: "Not found" }, 404);
  }
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  const buf = await readFile(filePath);
  return c.body(buf as unknown as ArrayBuffer, 200, {
    "Content-Type": MIME_BY_EXT[ext] ?? "application/octet-stream",
    "Cache-Control": "public, max-age=31536000, immutable",
  });
});

app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
