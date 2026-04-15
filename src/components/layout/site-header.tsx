import type { Route } from "next";
import Link from "next/link";
import { FolderHeart, Play, Radio } from "lucide-react";
import { Wordmark } from "@/components/brand/wordmark";
import { Badge } from "@/components/ui/badge";
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
    <header className={cn("sticky top-0 z-40 px-4 pt-4 sm:px-6", className)}>
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between rounded-[28px] border border-white/70 bg-[color:var(--color-surface)]/82 px-4 py-3 shadow-[0_18px_45px_rgba(30,37,48,0.08)] backdrop-blur-xl">
        <Wordmark />
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-[color:var(--color-muted)] transition hover:bg-white hover:text-[color:var(--color-ink)]"
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
              <Badge className="hidden sm:inline-flex">Guest-friendly</Badge>
              <Link
                href="/play"
                className="inline-flex h-10 items-center rounded-full bg-[color:var(--color-ink)] px-4 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-[color:var(--color-cobalt)]"
              >
                Start a room
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
