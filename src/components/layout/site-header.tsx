"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderGit2, PlayCircle, TestTube2, type LucideIcon } from "lucide-react";
import { useDemoMode } from "@/components/providers/demo-mode-provider";
import { Wordmark } from "@/components/brand/wordmark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const marketingNavItems: { href: string; label: string }[] = [
  { href: "/#how-it-works", label: "How it Works" },
  { href: "/#features", label: "Features" },
  { href: "/play", label: "Play Demo" },
  { href: "/account", label: "Sign In" },
];

const appNavItems: { href: string; label: string }[] = [
  { href: "/play", label: "Play" },
  { href: "/rooms/public", label: "Public Rooms" },
  { href: "/account", label: "Account" },
];

export function SiteHeader({
  className,
}: {
  className?: string;
}) {
  const pathname = usePathname();
  const { demoMode, openDialog, lockDemoMode, unlockPending } = useDemoMode();
  const isAppRoute =
    pathname === "/play" ||
    pathname.startsWith("/room/") ||
    pathname.startsWith("/rooms/") ||
    pathname.startsWith("/replay/") ||
    pathname.startsWith("/account");
  const navItems = isAppRoute ? appNavItems : marketingNavItems;
  const primaryAction: {
    href: "/play" | "/rooms/public";
    label: string;
    variant: "primary" | "secondary";
    icon: LucideIcon;
  } = isAppRoute
    ? pathname.startsWith("/room/")
      ? { href: "/play", label: "Back to Play", variant: "secondary" as const, icon: PlayCircle }
      : pathname === "/play"
        ? { href: "/rooms/public", label: "Public Rooms", variant: "secondary" as const, icon: FolderGit2 }
        : { href: "/play", label: "Start a Room", variant: "primary" as const, icon: PlayCircle }
    : { href: "/play", label: "Start a Room", variant: "primary" as const, icon: PlayCircle };
  const PrimaryActionIcon = primaryAction.icon;

  return (
    <header className={cn("sticky top-0 z-40 border-b border-[color:var(--color-border)] bg-[rgba(13,17,23,0.78)] backdrop-blur-xl", className)}>
      <div className="mx-auto flex w-full max-w-[1460px] min-w-0 items-center justify-between gap-4 px-4 py-3 sm:px-6 xl:px-8">
        <div className="shrink-0">
          <Wordmark />
        </div>
        <nav className={cn(
          "hidden min-w-0 flex-1 items-center px-4 lg:flex",
          isAppRoute ? "justify-start gap-3" : "justify-center gap-5",
        )}>
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-medium transition hover:text-[color:var(--color-text-strong)]",
                pathname === item.href ||
                  (item.href === "/play"
                    ? pathname.startsWith("/room/")
                    : pathname.startsWith(item.href))
                  ? "text-[color:var(--color-text-strong)]"
                  : "text-[color:var(--color-text-muted)]",
              )}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          {demoMode ? (
            <Badge className="hidden md:inline-flex">
              <TestTube2 className="h-3.5 w-3.5 text-[color:var(--color-warning)]" />
              Demo / Testing Mode
            </Badge>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (demoMode ? void lockDemoMode() : openDialog())}
            disabled={unlockPending}
          >
            <TestTube2 className="h-4 w-4" />
            {demoMode ? "Exit Demo" : "Try Demo"}
          </Button>
          <Link href={primaryAction.href}>
            <Button variant={primaryAction.variant} size="sm">
              <PrimaryActionIcon className="h-4 w-4" />
              {primaryAction.label}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
