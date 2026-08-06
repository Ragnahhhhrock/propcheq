import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/providers/trpc";

function getKimiOAuthUrl() {
  const kimiAuthUrl = import.meta.env.VITE_KIMI_AUTH_URL;
  const appID = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${kimiAuthUrl}/api/oauth/authorize`);
  url.searchParams.set("client_id", appID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "profile");
  url.searchParams.set("state", state);

  return url.toString();
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29A7.2 7.2 0 0 1 4.89 12c0-.8.14-1.57.38-2.29V6.62H1.29a12 12 0 0 0 0 10.76l3.98-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42A11.97 11.97 0 0 0 12 0 11.99 11.99 0 0 0 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

export default function Login() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSuccess = () => {
    window.location.href = "/dashboard";
  };
  const onError = (err: { message: string }) => setError(err.message);

  const loginMutation = trpc.emailAuth.login.useMutation({ onSuccess, onError });
  const signupMutation = trpc.emailAuth.signup.useMutation({ onSuccess, onError });
  const pending = loginMutation.isPending || signupMutation.isPending;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === "signup") {
      signupMutation.mutate({ name, email, password });
    } else {
      loginMutation.mutate({ email, password });
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] px-4 py-10">
      <div className="flex w-full max-w-sm flex-col items-center gap-7">
        <div className="flex flex-col items-center gap-4">
          <img
            src="/brand/propcheq-icon-512.png"
            alt="Propcheq"
            className="h-20 w-20 rounded-[22px] shadow-soft"
          />
          <div className="text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-[#0F172A]">Propcheq</h1>
            <p className="mt-1.5 text-sm text-[#64748B]">Property inspections, in focus.</p>
          </div>
        </div>

        <div className="w-full rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-soft">
          {/* Google */}
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-11 w-full rounded-full border-[#E2E8F0] text-base font-semibold text-[#0F172A] hover:bg-[#F8FAFC]"
            onClick={() => {
              window.location.href = "/api/oauth/google/start";
            }}
          >
            <GoogleMark /> Continue with Google
          </Button>

          <div className="my-5 flex items-center gap-3 text-xs font-medium uppercase tracking-widest text-[#94A3B8]">
            <span className="h-px flex-1 bg-[#E2E8F0]" /> or <span className="h-px flex-1 bg-[#E2E8F0]" />
          </div>

          {/* Email + password */}
          <form onSubmit={submit} className="flex flex-col gap-3">
            {mode === "signup" && (
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
                className="h-11 rounded-xl border-[#E2E8F0]"
                required
              />
            )}
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="email"
              className="h-11 rounded-xl border-[#E2E8F0]"
              required
            />
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "signup" ? "Password (8+ characters)" : "Password"}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className="h-11 rounded-xl border-[#E2E8F0]"
              required
              minLength={8}
            />
            {error && <p className="text-sm font-medium text-bad">{error}</p>}
            <Button
              type="submit"
              size="lg"
              disabled={pending}
              className="h-11 w-full rounded-full bg-brand-gradient text-base font-semibold text-white shadow-soft transition-opacity hover:opacity-90"
            >
              {pending
                ? "One moment…"
                : mode === "signup"
                  ? "Create account"
                  : "Sign in"}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError(null);
            }}
            className="mt-4 w-full text-center text-sm font-medium text-brand-teal hover:underline"
          >
            {mode === "login"
              ? "New to Propcheq? Create an account"
              : "Already have an account? Sign in"}
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            window.location.href = getKimiOAuthUrl();
          }}
          className="text-sm font-medium text-[#64748B] hover:text-[#0F172A]"
        >
          Sign in with Kimi
        </button>
      </div>
    </div>
  );
}
