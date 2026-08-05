import { Button } from "@/components/ui/button";

function getOAuthUrl() {
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

export default function Login() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
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
        <Button
          className="h-11 w-full rounded-full bg-brand-gradient text-base font-semibold text-white shadow-soft transition-opacity hover:opacity-90"
          size="lg"
          onClick={() => {
            window.location.href = getOAuthUrl();
          }}
        >
          Sign in with Kimi
        </Button>
        <p className="text-center text-xs text-[#64748B]">
          Photo-first inspection reports owners actually read.
        </p>
      </div>
    </div>
  );
}
