import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
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

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return timingSafeEqual(derived, Buffer.from(hash, "hex"));
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
