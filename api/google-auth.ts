import type { Context } from "hono";
import { setCookie } from "hono/cookie";
import { Session } from "@contracts/constants";
import { getSessionCookieOptions } from "./lib/cookies";
import { signSessionToken } from "./kimi/session";
import { upsertUser } from "./queries/users";
import { env } from "./lib/env";

const clientId = () => process.env.GOOGLE_CLIENT_ID ?? "";
const clientSecret = () => process.env.GOOGLE_CLIENT_SECRET ?? "";
const CALLBACK_PATH = "/api/oauth/google/callback";

export function googleOAuthStart() {
  return (c: Context) => {
    if (!clientId() || !clientSecret()) {
      return c.json({ error: "Google sign-in is not configured yet" }, 501);
    }
    const origin = new URL(c.req.url).origin;
    const redirectUri = `${origin}${CALLBACK_PATH}`;
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", clientId());
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("state", redirectUri);
    return c.redirect(url.toString(), 302);
  };
}

export function googleOAuthCallback() {
  return async (c: Context) => {
    const code = c.req.query("code");
    const state = c.req.query("state");
    const oauthError = c.req.query("error");
    if (oauthError) return c.redirect("/", 302);
    if (!code || !state) {
      return c.json({ error: "code and state are required" }, 400);
    }
    try {
      const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          client_id: clientId(),
          client_secret: clientSecret(),
          redirect_uri: state,
        }).toString(),
      });
      if (!tokenResp.ok) {
        throw new Error(
          `Token exchange failed (${tokenResp.status}): ${await tokenResp.text()}`,
        );
      }
      const tokens = (await tokenResp.json()) as { access_token: string };

      const profileResp = await fetch(
        "https://openidconnect.googleapis.com/v1/userinfo",
        { headers: { Authorization: `Bearer ${tokens.access_token}` } },
      );
      if (!profileResp.ok) {
        throw new Error(`Profile fetch failed (${profileResp.status})`);
      }
      const profile = (await profileResp.json()) as {
        sub: string;
        name?: string;
        email?: string;
        picture?: string;
      };

      const unionId = `google:${profile.sub}`;
      await upsertUser({
        unionId,
        name: profile.name,
        email: profile.email,
        avatar: profile.picture,
        lastSignInAt: new Date(),
      });

      const token = await signSessionToken({ unionId, clientId: env.appId });
      const cookieOpts = getSessionCookieOptions(c.req.raw.headers);
      setCookie(c, Session.cookieName, token, {
        ...cookieOpts,
        maxAge: Session.maxAgeMs / 1000,
      });
      return c.redirect("/", 302);
    } catch (error) {
      console.error("[OAuth][Google] Callback failed", error);
      return c.json({ error: "Google sign-in failed" }, 500);
    }
  };
}
