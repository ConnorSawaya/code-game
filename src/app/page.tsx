import Link from "next/link";
import { ArrowRight, Code2, Sparkles, WandSparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const featureCards = [
  {
    title: "Alternating rounds",
    description:
      "Relay rotates between code and description so every chain drifts in a new direction each pass.",
    icon: Code2,
  },
  {
    title: "Real-time rooms",
    description:
      "Private codes, public lobbies, guest-friendly onboarding, and reconnect-aware multiplayer flow.",
    icon: Sparkles,
  },
  {
    title: "Reveal-worthy endings",
    description:
      "Animated reveal timelines, reaction bursts, favorite-moment voting, and unlisted replay links.",
    icon: WandSparkles,
  },
];

export default function HomePage() {
  return (
    <div className="section-grid">
      <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <Card className="overflow-hidden p-0">
          <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6">
              <Badge>Code-Chain Party Game</Badge>
              <div className="space-y-4">
                <h1 className="text-balance text-5xl font-semibold tracking-[-0.06em] text-[color:var(--color-ink)] sm:text-6xl">
                  Watch an idea mutate from prompt, to code, to chaos, to legend.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-[color:var(--color-muted)]">
                  Relay is a polished multiplayer web app for coders and curious non-coders alike. Start from a prompt, pass the chain around in alternating code and description rounds, then reveal the whole thing like a party-game slow-motion crash replay.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/play">
                  <Button size="lg">
                    Start Playing
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/rooms/public">
                  <Button variant="secondary" size="lg">
                    Browse Public Rooms
                  </Button>
                </Link>
              </div>
            </div>
            <div className="paper-panel rounded-[30px] p-5">
              <div className="space-y-4">
                <div className="rounded-[24px] bg-[color:var(--color-surface-strong)] p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
                    Starter Prompt
                  </p>
                  <p className="mt-3 font-display text-2xl tracking-[-0.04em]">
                    “A tiny weather app that panics a little too much.”
                  </p>
                </div>
                <div className="rounded-[24px] bg-white/80 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
                    Code Round
                  </p>
                  <pre className="mt-3 overflow-auto rounded-[18px] bg-[#1f2430] p-4 font-mono text-sm leading-6 text-[#f4efe8]">
{`const mood = temp < 50 ? "ALARM" : "calm";
banner.textContent = \`Forecast: \${mood}\`;`}
                  </pre>
                </div>
                <div className="rounded-[24px] bg-[rgba(76,104,200,0.08)] p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
                    Description Round
                  </p>
                  <p className="mt-3 text-lg leading-8">
                    “It changes the banner based on temperature and makes cold weather sound dramatic.”
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <Badge>Why Relay</Badge>
          <CardTitle>A consumer-feeling party product, not a coding demo.</CardTitle>
          <CardDescription>
            Built for real multiplayer deployment with Supabase Realtime, replay persistence, multi-language rooms, and an original visual system that feels crafted rather than templated.
          </CardDescription>
          <div className="grid gap-3">
            <div className="rounded-[22px] bg-white/80 p-4">
              <p className="text-sm text-[color:var(--color-muted)]">Prompts</p>
              <p className="mt-2 font-display text-3xl tracking-[-0.05em]">600 curated starters</p>
            </div>
            <div className="rounded-[22px] bg-white/80 p-4">
              <p className="text-sm text-[color:var(--color-muted)]">Languages</p>
              <p className="mt-2 font-display text-3xl tracking-[-0.05em]">HTML/CSS/JS, JS, Python, TS</p>
            </div>
            <div className="rounded-[22px] bg-white/80 p-4">
              <p className="text-sm text-[color:var(--color-muted)]">Player Count</p>
              <p className="mt-2 font-display text-3xl tracking-[-0.05em]">3 to 12 players</p>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {featureCards.map((feature) => {
          const Icon = feature.icon;

          return (
            <Card key={feature.title} className="space-y-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/85 text-[color:var(--color-cobalt)]">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </div>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
