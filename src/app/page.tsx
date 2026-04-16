"use client";

import Link from "next/link";
import {
  ArrowRight,
  Gamepad2,
  PlayCircle,
  TerminalSquare,
  Users,
} from "lucide-react";
import { EditorShell } from "@/components/editor/editor-shell";
import { useDemoMode } from "@/components/providers/demo-mode-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const steps = [
  {
    title: "Join a room",
    body: "Grab a nickname, drop into the lobby, and pick a room vibe that matches the night.",
  },
  {
    title: "Build your turn",
    body: "Write code or decode what the last dev meant. Fast rounds keep the energy high.",
  },
  {
    title: "Pass it on",
    body: "Each player only sees the previous step, so the original idea starts drifting immediately.",
  },
  {
    title: "Reveal the mess",
    body: "Playback the full chain, react to the breaks, and save the funniest moments for later.",
  },
];

const features = [
  {
    icon: Users,
    title: "Live rooms",
    body: "Private codes, public lobbies, reconnect protection, and spectator support.",
  },
  {
    icon: TerminalSquare,
    title: "Real editor",
    body: "Monaco, language-aware syntax, limits, and runtime preview where it makes sense.",
  },
  {
    icon: Gamepad2,
    title: "Reveal playback",
    body: "Animated reveal flow, reactions, favorites, and replay links.",
  },
  {
    icon: PlayCircle,
    title: "Demo mode",
    body: "Temporary password unlock for mock rooms and testing controls while backend pieces evolve.",
  },
];

const useCases = [
  "Hack nights",
  "Game jams",
  "CS classes",
  "Friend groups",
  "Workshop icebreakers",
  "Late-night refactors",
];

const demoRooms = ["boss-fight-jam", "shader-chaos", "late-night-refactor", "cursed-platformer"];

function HeroWorkbench() {
  return (
    <EditorShell
      title="relay/demo-room"
      tabLabel="enemySpawner.ts"
      treeItems={[
        { label: "relay-room", depth: 0 },
        { label: "src", depth: 1 },
        { label: "enemySpawner.ts", depth: 2, active: true },
        { label: "playerController.js", depth: 2 },
        { label: "README.md", depth: 1 },
      ]}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-[0.72rem] uppercase tracking-[0.14em] text-[#8b949e]">
            Room BOSS1
          </span>
          <span className="font-mono text-[0.72rem] uppercase tracking-[0.14em] text-[#8b949e]">
            Code / Description / Code
          </span>
        </div>
      }
      statusLeft={
        <>
          <span>main</span>
          <span>TypeScript</span>
          <span>Round 2 / 4</span>
        </>
      }
      statusRight={
        <>
          <span>4 players</span>
          <span>relay live</span>
        </>
      }
    >
      <div className="grid gap-4 bg-[#1e1e1e] p-4 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="rounded-[10px] border border-[#2d2d30] bg-[#1e1e1e]">
          <div className="grid grid-cols-[40px_minmax(0,1fr)] font-mono text-[13px] leading-7">
            {[
              "const mood = rage > 0.7 ? 'overdrive' : 'hold';",
              "hud.flash(mood);",
              "spawnWave(mood === 'overdrive' ? 3 : 1);",
              "",
              "if (playerIsCamping) {",
              "  boss.taunt('move or perish');",
              "}",
            ].map((line, index) => (
              <div key={index} className="contents">
                <div className="border-r border-[#2d2d30] pr-3 text-right text-[#6e7681]">
                  {index + 1}
                </div>
                <div className="overflow-x-auto pl-4 text-[#d4d4d4]">{line || " "}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-3">
            <div className="rounded-[10px] border border-[#2d2d30] bg-[#181818] p-3">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-[#8b949e]">
                Current chain
              </p>
              <p className="mt-2 text-sm leading-6 text-[#e6edf3]">
                &quot;Build a boss fight that gets offended when the player stands still.&quot;
              </p>
            </div>
            <div className="rounded-[10px] border border-[#2d2d30] bg-[#181818] p-3">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-[#8b949e]">
                Next player sees
              </p>
              <p className="mt-2 text-sm leading-6 text-[#c9d1d9]">
                &quot;It escalates the encounter and taunts anyone who stops moving.&quot;
              </p>
            </div>
        </div>
      </div>
    </EditorShell>
  );
}

export default function HomePage() {
  const { demoMode, openDialog } = useDemoMode();

  return (
    <div className="section-grid pb-8">
      <section className="hero-grid relative overflow-hidden rounded-[22px] border border-[color:var(--color-border)] bg-[linear-gradient(180deg,rgba(13,17,23,0.98),rgba(11,16,21,0.98))] p-6 shadow-[var(--shadow-panel)] sm:p-8">
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.14),transparent)]" />
        <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr] xl:items-center">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>Multiplayer code telephone</Badge>
              {demoMode ? <Badge>Demo mode unlocked</Badge> : null}
            </div>
            <div className="space-y-4">
              <h1 className="max-w-[11ch] text-balance font-display text-5xl font-semibold tracking-[-0.07em] text-[color:var(--color-text-strong)] sm:text-6xl sm:leading-[0.95]">
                Pass the code. Ship the chaos.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[color:var(--color-text-soft)]">
                Relay is the party game where each dev mutates the last step. Join a room,
                write code or describe what you think it does, then watch the final build go
                gloriously off the rails.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={openDialog}>
                Try Demo
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Link href="#how-it-works">
                <Button variant="secondary" size="lg">
                  See How It Works
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="surface-pill rounded-full px-3 py-2 font-mono text-[0.74rem] uppercase tracking-[0.12em] text-[color:var(--color-text-soft)]">
                3-12 players
              </span>
              <span className="surface-pill rounded-full px-3 py-2 font-mono text-[0.74rem] uppercase tracking-[0.12em] text-[color:var(--color-text-soft)]">
                HTML / JS / TS / Py
              </span>
              <span className="surface-pill rounded-full px-3 py-2 font-mono text-[0.74rem] uppercase tracking-[0.12em] text-[color:var(--color-text-soft)]">
                600+ prompts
              </span>
            </div>
          </div>
          <HeroWorkbench />
        </div>
      </section>

      <section id="how-it-works" className="grid gap-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <Badge>How It Works</Badge>
            <h2 className="mt-3 font-display text-3xl tracking-[-0.05em] text-[color:var(--color-text-strong)]">
              One prompt. A few devs. Terrible communication.
            </h2>
          </div>
          <p className="hidden max-w-md text-sm leading-7 text-[color:var(--color-text-muted)] lg:block">
            Relay is fast on purpose. Short rounds keep the room moving and make the final reveal
            hit harder.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-4">
          {steps.map((step, index) => (
            <Card key={step.title} className="noise-panel space-y-4">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] border border-[color:var(--color-border)] bg-[color:var(--color-bg-main)] font-mono text-sm text-[color:var(--color-accent-hover)]">
                0{index + 1}
              </div>
              <div>
                <CardTitle>{step.title}</CardTitle>
                <CardDescription className="mt-2">{step.body}</CardDescription>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section id="features" className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="space-y-5">
          <Badge>Features</Badge>
          <div>
            <CardTitle>Only the useful stuff stays on the page.</CardTitle>
            <CardDescription className="mt-2">
              Rooms, editor, reveal, moderation, and demo tools. No extra filler.
            </CardDescription>
          </div>
          <div className="space-y-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="flex items-start gap-3 rounded-[14px] border border-[color:var(--color-border)] bg-[color:var(--color-bg-main)] px-4 py-4"
                >
                  <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-[color:var(--color-border)] bg-[rgba(255,255,255,0.02)] text-[color:var(--color-accent-hover)]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-[color:var(--color-text-strong)]">{feature.title}</p>
                    <p className="mt-1 text-sm leading-6 text-[color:var(--color-text-muted)]">
                      {feature.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        <Card className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <Badge>Built For</Badge>
              <CardTitle className="mt-3">Hackathons, classrooms, and friend groups.</CardTitle>
              <CardDescription className="mt-2">
                Works best when people are half serious and half trying to make each other laugh.
              </CardDescription>
            </div>
            <Gamepad2 className="h-5 w-5 text-[color:var(--color-accent-hover)]" />
          </div>
          <div className="flex flex-wrap gap-2">
            {useCases.map((useCase) => (
              <span
                key={useCase}
                className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-bg-main)] px-3 py-2 font-mono text-[0.75rem] uppercase tracking-[0.12em] text-[color:var(--color-text-soft)]"
              >
                {useCase}
              </span>
            ))}
          </div>
          <div className="space-y-3">
            {demoRooms.map((roomName, index) => (
              <div
                key={roomName}
                className="flex items-center justify-between rounded-[14px] border border-[color:var(--color-border)] bg-[color:var(--color-bg-main)] px-4 py-3"
              >
                <div>
                  <p className="font-medium text-[color:var(--color-text-strong)]">{roomName}</p>
                  <p className="mt-1 font-mono text-[0.74rem] uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
                    {index === 0 ? "private" : index === 1 ? "live" : "public"}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm text-[color:var(--color-text-soft)]">
                  <span className="inline-flex items-center gap-2">
                    <Users className="h-4 w-4 text-[color:var(--color-accent-hover)]" />
                    {4 + index}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--color-border)] pt-4 text-sm text-[color:var(--color-text-muted)]">
        <span>Relay</span>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/play">Play</Link>
          <Link href="/rooms/public">Public Rooms</Link>
          <Link href="/account">Account</Link>
        </div>
      </footer>
    </div>
  );
}
