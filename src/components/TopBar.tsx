import { LayoutDashboard, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, NavLink } from "react-router";

const NAV_ITEMS = [{ label: "Dashboard", path: "/", icon: LayoutDashboard }];

export default function TopBar() {
  const { user, logout } = useAuth();
  const initials = (user?.name ?? user?.email ?? "P")
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-[#E2E8F0] bg-white/90 shadow-soft backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-2 px-4">
        <Link to="/" className="flex min-w-0 items-center gap-2.5" aria-label="Propcheq dashboard">
          <img
            src="/brand/propcheq-icon-512.png"
            alt=""
            className="h-8 w-8 shrink-0 rounded-[9px]"
          />
          <span className="truncate text-lg font-extrabold tracking-tight text-[#0F172A]">
            Propcheq
          </span>
        </Link>

        <nav className="flex items-center gap-1" aria-label="Main">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.path} to={item.path} end>
              {({ isActive }) => (
                <span
                  className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </span>
              )}
            </NavLink>
          ))}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-1 rounded-full" aria-label="Account menu">
                <Avatar className="h-8 w-8">
                  {user?.avatar ? <AvatarImage src={user.avatar} alt="" /> : null}
                  <AvatarFallback className="bg-brand-gradient text-xs font-bold text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold">{user?.name ?? "Propcheq user"}</span>
                  {user?.email && (
                    <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  );
}
