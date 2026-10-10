import * as cookie from "cookie";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Session } from "@contracts/constants";
import { createRouter, publicQuery } from "./middleware";
import { getSessionCookieOptions } from "./lib/cookies";
import { signSessionToken } from "./kimi/session";
import { findUserByUnionId, upsertUser } from "./queries/users";
import { env } from "./lib/env";
import type { TrpcContext } from "./context";

// Password hashing uses WebCrypto PBKDF2 (available in Workers; Node's scrypt
// is too CPU-heavy for the Workers runtime). Workers cap PBKDF2 at 100k
// iterations. Stored format: pbkdf2$<iterations>$<saltHex>$<hashHex>
const PBKDF2_ITERATIONS = 100_000;

const toHex = (buf: ArrayBuffer | Uint8Array) =>
  Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
const fromHex = (hex: string) =>
  new Uint8Array((hex.match(/.{2}/g) ?? []).map((h) => parseInt(h, 16)));

async function derive(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  return new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations },
      key,
      256,
    ),
  );
}

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const derived = await derive(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toHex(salt)}$${toHex(derived)}`;
}

async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [scheme, iterStr, saltHex, hashHex] = stored.split("$");
  if (scheme !== "pbkdf2" || !iterStr || !saltHex || !hashHex) return false;
  const derived = await derive(password, fromHex(saltHex), parseInt(iterStr, 10));
  const expected = fromHex(hashHex);
  if (derived.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < derived.length; i++) diff |= derived[i] ^ expected[i];
  return diff === 0;
}

const emailUnionId = (email: string) =>
  `email:${email.trim().toLowerCase()}`;

async function startSession(ctx: TrpcContext, unionId: string) {
  const token = await signSessionToken({ unionId, clientId: env.appId });
  const opts = getSessionCookieOptions(ctx.req.headers);
  ctx.resHeaders.append(
    "set-cookie",
    cookie.serialize(Session.cookieName, token, {
      httpOnly: opts.httpOnly,
      path: opts.path,
      sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
      secure: opts.secure,
      maxAge: Session.maxAgeMs / 1000,
    }),
  );
}

const credentials = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const emailAuthRouter = createRouter({
  signup: publicQuery
    .input(credentials.extend({ name: z.string().trim().min(2, "Enter your name") }))
    .mutation(async ({ ctx, input }) => {
      const unionId = emailUnionId(input.email);
      const existing = await findUserByUnionId(unionId);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists — sign in instead.",
        });
      }
      await upsertUser({
        unionId,
        name: input.name,
        email: input.email,
        passwordHash: await hashPassword(input.password),
        lastSignInAt: new Date(),
      });
      await startSession(ctx, unionId);
      return { success: true };
    }),

  login: publicQuery.input(credentials).mutation(async ({ ctx, input }) => {
    const unionId = emailUnionId(input.email);
    const user = await findUserByUnionId(unionId);
    if (
      !user?.passwordHash ||
      !(await verifyPassword(input.password, user.passwordHash))
    ) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Incorrect email or password.",
      });
    }
    await upsertUser({ unionId });
    await startSession(ctx, unionId);
    return { success: true };
  }),
});
