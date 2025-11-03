import { Logo } from "./Logo";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="relative z-10">
      <div className="mx-auto max-w-7xl px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo />
          <div className="leading-tight">
            <div className="text-sm uppercase tracking-wider text-muted-foreground">Digital Strike</div>
            <div className="text-[11px] text-muted-foreground/70">Lawful, privacy‑preserving educator sentiment</div>
          </div>
        </div>
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
    </header>
  );
}
