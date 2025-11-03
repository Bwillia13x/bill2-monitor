import { Logo } from "./Logo";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { LogOut, Menu } from "lucide-react";
import { useState } from "react";

const NAV_LINKS = [
  { to: "/", label: "Meter" },
  { to: "/voices", label: "Voices" },
  { to: "/pulse", label: "Pulse" },
  { to: "/studio/signs", label: "Signs" },
  { to: "/press", label: "Press" },
];

export function Header() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="relative z-10">
      <div className="mx-auto max-w-7xl px-6 py-5">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <Logo />
            <div className="leading-tight">
              <div className="text-sm uppercase tracking-wider text-muted-foreground">Digital Strike</div>
              <div className="text-[11px] text-muted-foreground/70">Lawful, privacy‑preserving educator sentiment</div>
            </div>
          </Link>

          {/* Desktop nav */}
          {user && (
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    location.pathname === link.to
                      ? "bg-primary/20 text-primary-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-3">
            {user && (
              <Button
                onClick={signOut}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <LogOut className="size-4" />
                Sign Out
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          {user && (
            <Button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              variant="ghost"
              size="sm"
              className="md:hidden"
            >
              <Menu className="size-5" />
            </Button>
          )}
        </div>

        {/* Mobile nav */}
        {mobileMenuOpen && user && (
          <nav className="md:hidden mt-4 flex flex-col gap-1 pb-4 border-t border-border pt-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  location.pathname === link.to
                    ? "bg-primary/20 text-primary-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Button
              onClick={signOut}
              variant="outline"
              size="sm"
              className="gap-2 mt-2"
            >
              <LogOut className="size-4" />
              Sign Out
            </Button>
          </nav>
        )}
      </div>
    </header>
  );
}
