import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import type { Bindings } from "./lib/env";
import { authenticateRequest } from "./kimi/auth";
import { googleOAuthStart, googleOAuthCallback } from "./google-auth";

const app = new Hono<{ Bindings: Bindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));
app.get("/api/oauth/google/start", googleOAuthStart());
app.get("/api/oauth/google/callback", googleOAuthCallback());

// ---------------------------------------------------------------------------
// Media uploads (inspection photos / videos), stored in Cloudflare R2
// ---------------------------------------------------------------------------
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
  if (!c.env?.UPLOADS) return c.json({ error: "Uploads are not configured" }, 501);
  const form = await c.req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return c.json({ error: "No file" }, 400);
  if (file.size > 50 * 1024 * 1024) return c.json({ error: "File too large (50 MB max)" }, 400);
  const rawExt = (file.name.split(".").pop() || "bin").toLowerCase();
  const ext = rawExt.replace(/[^a-z0-9]/g, "") || "bin";
  if (!MIME_BY_EXT[ext]) return c.json({ error: "Unsupported file type" }, 400);
  const name = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
  await c.env.UPLOADS.put(name, file.stream(), {
    httpMetadata: { contentType: MIME_BY_EXT[ext] },
  });
  return c.json({ url: `/uploads/${name}` });
});

app.get("/uploads/*", async (c) => {
  if (!c.env?.UPLOADS) return c.json({ error: "Not found" }, 404);
  const key = decodeURIComponent(c.req.path.replace(/^\/uploads\//, ""));
  if (!key || key.includes("/") || key.includes("..")) {
    return c.json({ error: "Not found" }, 404);
  }
  const obj = await c.env.UPLOADS.get(key);
  if (!obj) return c.json({ error: "Not found" }, 404);
  const ext = key.split(".").pop()?.toLowerCase() ?? "";
  return new Response(obj.body, {
    status: 200,
    headers: {
      "Content-Type": MIME_BY_EXT[ext] ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
      ETag: obj.httpEtag,
    },
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
