"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderGit2, PlayCircle, TestTube2 } from "lucide-react";
import { useDemoMode } from "@/components/providers/demo-mode-provider";
import { Wordmark } from "@/components/brand/wordmark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems: { href: string; label: string }[] = [
  { href: "/#how-it-works", label: "How it Works" },
  { href: "/#features", label: "Features" },
  { href: "/play", label: "Play Demo" },
  { href: "/account", label: "Sign In" },
];

export function SiteHeader({
  className,
}: {
  className?: string;
}) {
  const pathname = usePathname();
  const { demoMode, openDialog, lockDemoMode, unlockPending } = useDemoMode();

  return (
    <header className={cn("sticky top-0 z-40 border-b border-[color:var(--color-border)] bg-[rgba(13,17,23,0.78)] backdrop-blur-xl", className)}>
      <div className="mx-auto flex w-full max-w-[1460px] min-w-0 items-center justify-between gap-4 px-4 py-3 sm:px-6 xl:px-8">
        <div className="shrink-0">
          <Wordmark />
        </div>
        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-5 px-4 lg:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-[color:var(--color-text-muted)] transition hover:text-[color:var(--color-text-strong)]"
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
          {pathname !== "/play" ? (
            <Link href="/play">
              <Button size="sm">
                <PlayCircle className="h-4 w-4" />
                Start a Room
              </Button>
            </Link>
          ) : (
            <Link href="/rooms/public">
              <Button variant="secondary" size="sm">
                <FolderGit2 className="h-4 w-4" />
                Public Rooms
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
