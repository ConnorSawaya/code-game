import type { Route } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Code2,
  Dice5,
  LockKeyhole,
  Radio,
  UsersRound,
  WandSparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const quickActions: {
  href: Route;
  title: string;
  description: string;
  icon: typeof LockKeyhole;
}[] = [
  {
    href: "/play",
    title: "Create Room",
    description: "Spin up a private room, tweak the mode, and get everyone in with one code.",
    icon: LockKeyhole,
  },
  {
    href: "/play",
    title: "Join by Code",
    description: "Hop straight into a friend's room or reconnect to your old seat fast.",
    icon: UsersRound,
  },
  {
    href: "/rooms/public",
    title: "Public Rooms",
    description: "Browse open lobbies, spectate live chaos, and queue for the next game.",
    icon: Radio,
  },
  {
    href: "/play",
    title: "Quick Play",
    description: "Match into the oldest compatible public room and start causing chain drift.",
    icon: Dice5,
  },
];

const highlights = [
  {
    title: "Prompt -> Code -> Description",
    description: "Every step only sees the previous one, so ideas mutate in funny, surprising directions.",
    icon: Code2,
  },
  {
    title: "Built for groups",
    description: "Private room codes, public lobbies, guest identities, reconnects, and replay sharing are all baked in.",
    icon: UsersRound,
  },
  {
    title: "Reveal-night payoff",
    description: "Animated chain reveals, reactions, favorites, and replay links make the ending feel like the main event.",
    icon: WandSparkles,
  },
];

export default function HomePage() {
  return (
    <div className="section-grid">
      <section className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <Card className="overflow-hidden p-0">
          <div className="relative overflow-hidden px-5 py-6 sm:px-7 sm:py-7">
            <div className="hero-orb left-[-2rem] top-[-1rem] h-24 w-24 bg-[rgba(239,109,75,0.28)]" />
            <div className="hero-orb right-[-1rem] top-4 h-28 w-28 bg-[rgba(53,90,216,0.22)]" />
            <div className="relative grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-5">
                <Badge>Multiplayer Code-Chain Party Game</Badge>
                <div className="space-y-3">
                  <h1 className="max-w-3xl text-balance font-display text-4xl font-semibold tracking-[-0.07em] text-[color:var(--color-ink)] sm:text-[4.3rem] sm:leading-[0.95]">
                    Pass the idea. Break the meaning. Reveal the disaster.
                  </h1>
                  <p className="max-w-2xl text-base leading-8 text-[color:var(--color-muted)] sm:text-lg">
                    Relay turns prompts into a chain reaction of code and descriptions. Friends only see one step at a time, then everyone watches the full mutation unfold at the end.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href="/play">
                    <Button size="lg">
                      Play now
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/play">
                    <Button variant="secondary" size="lg">
                      Create room
                    </Button>
                  </Link>
                  <Link href="/rooms/public">
                    <Button variant="ghost" size="lg">
                      Public rooms
                    </Button>
                  </Link>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="stack-panel px-4 py-4">
                    <p className="text-[0.7rem] uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                      Players
                    </p>
                    <p className="mt-2 font-display text-3xl tracking-[-0.06em]">3-12</p>
                  </div>
                  <div className="stack-panel px-4 py-4">
                    <p className="text-[0.7rem] uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                      Languages
                    </p>
                    <p className="mt-2 font-display text-3xl tracking-[-0.06em]">4</p>
                  </div>
                  <div className="stack-panel px-4 py-4">
                    <p className="text-[0.7rem] uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                      Prompt pack ideas
                    </p>
                    <p className="mt-2 font-display text-3xl tracking-[-0.06em]">600</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 self-start">
                <div className="panel-ink rounded-[30px] p-4 text-[#dfe7f7]">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[#8fa1c5]">
                        Live Chain
                      </p>
                      <p className="mt-1 font-display text-2xl tracking-[-0.05em] text-white">
                        What started as a weather app...
                      </p>
                    </div>
                    <Badge className="border-white/10 bg-white/8 text-[#dce5f7] shadow-none">
                      Reveal ready
                    </Badge>
                  </div>
                  <div className="mt-4 grid gap-3">
                    <div className="rounded-[22px] border border-white/8 bg-white/5 px-4 py-4">
                      <p className="text-[0.68rem] uppercase tracking-[0.16em] text-[#8fa1c5]">
                        Prompt
                      </p>
                      <p className="mt-2 text-base leading-7 text-[#eef3ff]">
                        &quot;Build a weather widget that overreacts to tiny temperature changes.&quot;
                      </p>
                    </div>
                    <div className="rounded-[22px] border border-white/8 bg-[#0a1020] px-0 py-0">
                      <div className="flex items-center justify-between border-b border-white/8 px-4 py-3 text-sm text-[#8fa1c5]">
                        <span>relay-step.js</span>
                        <span>JavaScript</span>
                      </div>
                      <pre className="overflow-auto px-4 py-4 font-mono text-sm leading-7 text-[#dfe7f7]">{`const mood = temp < 62 ? "panic" : "relax";
banner.textContent = \`Forecast: \${mood}\`;`}</pre>
                    </div>
                    <div className="rounded-[22px] border border-white/8 bg-white/5 px-4 py-4">
                      <p className="text-[0.68rem] uppercase tracking-[0.16em] text-[#8fa1c5]">
                        Description
                      </p>
                      <p className="mt-2 text-base leading-7 text-[#eef3ff]">
                        &quot;It changes the banner mood and treats slightly chilly weather like a full emergency.&quot;
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="stack-panel px-4 py-4">
                    <p className="text-[0.7rem] uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                      Best with
                    </p>
                    <p className="mt-2 font-display text-2xl tracking-[-0.05em]">
                      4-8 friends
                    </p>
                  </div>
                  <div className="stack-panel px-4 py-4">
                    <p className="text-[0.7rem] uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                      Pace
                    </p>
                    <p className="mt-2 font-display text-2xl tracking-[-0.05em]">
                      Fast rounds
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Badge>Join Fast</Badge>
              <CardTitle className="mt-3">Everything important is one click away.</CardTitle>
            </div>
            <UsersRound className="h-6 w-6 text-[color:var(--color-cobalt)]" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <Link key={action.title} href={action.href}>
                  <div className="stack-panel h-full px-4 py-4 transition hover:-translate-y-1">
                    <div className="flex items-center gap-2 text-[color:var(--color-cobalt)]">
                      <Icon className="h-4 w-4" />
                      <p className="text-sm font-semibold uppercase tracking-[0.14em]">
                        {action.title}
                      </p>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[color:var(--color-muted)]">
                      {action.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {highlights.map((feature) => {
          const Icon = feature.icon;

          return (
            <Card key={feature.title} className="space-y-4">
              <div className="surface-pill inline-flex h-12 w-12 items-center justify-center rounded-[18px] text-[color:var(--color-cobalt)]">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription className="mt-2">{feature.description}</CardDescription>
              </div>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
