import type { Route } from "next";
import Link from "next/link";
import { FolderHeart, Play, Radio, UsersRound } from "lucide-react";
import { Wordmark } from "@/components/brand/wordmark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems: { href: Route; label: string; icon: typeof Play }[] = [
  { href: "/play", label: "Play", icon: Play },
  { href: "/rooms/public", label: "Public Rooms", icon: Radio },
  { href: "/account", label: "Account", icon: FolderHeart },
];

export function SiteHeader({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <header className={cn("sticky top-0 z-40 px-4 pt-3 sm:px-6", className)}>
      <div className="mx-auto flex w-full max-w-[1320px] items-center justify-between gap-4 rounded-[28px] border border-white/65 bg-[rgba(255,249,240,0.88)] px-4 py-3 shadow-[var(--shadow-panel)] backdrop-blur-xl">
        <Wordmark />
        <nav className="hidden items-center gap-2 lg:flex">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="surface-pill inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-[color:var(--color-muted)] transition hover:-translate-y-0.5 hover:text-[color:var(--color-ink)]"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          {!compact ? (
            <>
              <Badge className="hidden sm:inline-flex">
                <UsersRound className="h-3.5 w-3.5" />
                Guest-friendly
              </Badge>
              <Link href="/rooms/public" className="hidden md:block">
                <Button variant="secondary" size="sm">
                  Browse rooms
                </Button>
              </Link>
              <Link href="/play">
                <Button size="sm">Create room</Button>
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
