// Runtime configuration for the Cloudflare Worker.
// Bindings (DB, UPLOADS) and secrets/vars arrive via the fetch handler's `env`
// argument; api/worker.ts stores it here once per isolate. Falls back to
// process.env so local dev (vite) keeps working.

export interface Bindings {
  DB: D1Database;
  UPLOADS: R2Bucket;
  APP_ID?: string;
  APP_SECRET?: string;
  KIMI_AUTH_URL?: string;
  KIMI_OPEN_URL?: string;
  OWNER_UNION_ID?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
}

let bindings: Bindings | undefined;

export function setBindings(b: Bindings) {
  bindings = b;
}

export function getBindings(): Bindings {
  if (!bindings) throw new Error("Worker bindings not initialised");
  return bindings;
}

function read(name: keyof Bindings): string {
  const fromWorker = bindings?.[name];
  if (typeof fromWorker === "string") return fromWorker;
  if (typeof process !== "undefined") return process.env?.[name] ?? "";
  return "";
}

function required(name: keyof Bindings): string {
  const value = read(name);
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const env = {
  get appId() {
    return required("APP_ID");
  },
  get appSecret() {
    return required("APP_SECRET");
  },
  get kimiAuthUrl() {
    return required("KIMI_AUTH_URL");
  },
  get kimiOpenUrl() {
    return required("KIMI_OPEN_URL");
  },
  get ownerUnionId() {
    return read("OWNER_UNION_ID");
  },
  get googleClientId() {
    return read("GOOGLE_CLIENT_ID");
  },
  get googleClientSecret() {
    return read("GOOGLE_CLIENT_SECRET");
  },
};
