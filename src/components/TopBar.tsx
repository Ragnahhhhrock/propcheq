import { ClipboardCheck, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";

export default function TopBar() {
  const { user, logout } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <ClipboardCheck className="h-5 w-5" />
          </span>
          <span className="text-lg">Propcheq</span>
        </Link>
        <div className="flex items-center gap-2">
          {user?.name && (
            <span className="hidden max-w-[140px] truncate text-sm text-muted-foreground sm:inline">
              {user.name}
            </span>
          )}
          <Button variant="ghost" size="icon" onClick={logout} title="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
