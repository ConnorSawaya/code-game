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
      panelPosition="right"
      treeItems={[
        { label: "relay-room", depth: 0, kind: "folder" },
        { label: "src", depth: 1, kind: "folder" },
        { label: "enemySpawner.ts", depth: 2, active: true, kind: "file" },
        { label: "playerController.js", depth: 2, kind: "file" },
        { label: "README.md", depth: 1, kind: "file", documentId: "notes" },
      ]}
      panel={
        <div className="grid h-full min-h-0 grid-rows-[auto_auto_minmax(0,1fr)] bg-[#111317]">
          <div className="border-b border-[#2d2d30] px-4 py-3">
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[#8b949e]">
              Prompt
            </p>
            <p className="mt-2 text-sm leading-6 text-[#e6edf3]">
              Boss fight hates campers.
            </p>
          </div>
          <div className="border-b border-[#2d2d30] px-4 py-3">
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[#8b949e]">
              Passes on
            </p>
            <p className="mt-2 text-sm leading-6 text-[#c9d1d9]">
              Boss gets meaner if you stop moving.
            </p>
          </div>
          <div className="min-h-0">
            <div className="flex items-center justify-between border-b border-[#2d2d30] bg-[#252526] px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[#8b949e]">
              <span>Run / Output</span>
              <span>console</span>
            </div>
            <div className="space-y-2 overflow-auto bg-[#0f1115] px-4 py-4 font-mono text-[12px] leading-6 text-[#c9d1d9]">
              <p>
                <span className="text-[#8b949e]">log</span> warning: KEEP MOVING
              </p>
              <p>
                <span className="text-[#8b949e]">log</span> adds spawned x3
              </p>
              <p>
                <span className="text-[#8b949e]">log</span> boss phase: overdrive
              </p>
            </div>
          </div>
        </div>
      }
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
      <div className="bg-[#1e1e1e] p-4">
        <div className="rounded-[10px] border border-[#2d2d30] bg-[#1e1e1e]">
          <div className="grid grid-cols-[40px_minmax(0,1fr)] font-mono text-[13px] leading-7">
            {[
              {
                id: "boss-mood",
                content: (
                  <>
                <span className="text-[#569cd6]">const</span>{" "}
                <span className="text-[#9cdcfe]">bossMood</span>{" "}
                <span className="text-[#d4d4d4]">=</span>{" "}
                <span className="text-[#9cdcfe]">player</span>
                <span className="text-[#d4d4d4]">.</span>
                <span className="text-[#dcdCAA]">speed</span>{" "}
                <span className="text-[#d4d4d4]">&lt;</span>{" "}
                <span className="text-[#b5cea8]">0.2</span>{" "}
                <span className="text-[#d4d4d4]">?</span>{" "}
                <span className="text-[#ce9178]">&quot;offended&quot;</span>{" "}
                <span className="text-[#d4d4d4]">:</span>{" "}
                <span className="text-[#ce9178]">&quot;locked-in&quot;</span>
                <span className="text-[#d4d4d4]">;</span>
                  </>
                ),
              },
              {
                id: "warning",
                content: (
                  <>
                <span className="text-[#9cdcfe]">arena</span>
                <span className="text-[#d4d4d4]">.</span>
                <span className="text-[#dcdCAA]">flashWarning</span>
                <span className="text-[#d4d4d4]">(</span>
                <span className="text-[#9cdcfe]">bossMood</span>{" "}
                <span className="text-[#d4d4d4]">===</span>{" "}
                <span className="text-[#ce9178]">&quot;offended&quot;</span>{" "}
                <span className="text-[#d4d4d4]">?</span>{" "}
                <span className="text-[#ce9178]">&quot;KEEP MOVING&quot;</span>{" "}
                <span className="text-[#d4d4d4]">:</span>{" "}
                <span className="text-[#ce9178]">&quot;DODGE&quot;</span>
                <span className="text-[#d4d4d4]">);</span>
                  </>
                ),
              },
              {
                id: "if-open",
                content: (
                  <>
                <span className="text-[#569cd6]">if</span>{" "}
                <span className="text-[#d4d4d4]">(</span>
                <span className="text-[#9cdcfe]">bossMood</span>{" "}
                <span className="text-[#d4d4d4]">===</span>{" "}
                <span className="text-[#ce9178]">&quot;offended&quot;</span>
                <span className="text-[#d4d4d4]">) {"{"}</span>
                  </>
                ),
              },
              {
                id: "spawn-adds",
                content: (
                  <>
                <span className="text-[#9cdcfe]">spawnAdds</span>
                <span className="text-[#d4d4d4]">(</span>
                <span className="text-[#b5cea8]">3</span>
                <span className="text-[#d4d4d4]">);</span>
                  </>
                ),
              },
              {
                id: "phase-step",
                content: (
                  <>
                <span className="text-[#9cdcfe]">boss</span>
                <span className="text-[#d4d4d4]">.</span>
                <span className="text-[#9cdcfe]">phase</span>{" "}
                <span className="text-[#d4d4d4]">+=</span>{" "}
                <span className="text-[#b5cea8]">1</span>
                <span className="text-[#d4d4d4]">;</span>
                  </>
                ),
              },
              {
                id: "if-close",
                content: <span className="text-[#d4d4d4]">{"}"}</span>,
              },
              {
                id: "console",
                content: (
                  <>
                <span className="text-[#9cdcfe]">console</span>
                <span className="text-[#d4d4d4]">.</span>
                <span className="text-[#dcdCAA]">log</span>
                <span className="text-[#d4d4d4]">(</span>
                <span className="text-[#ce9178]">&quot;phase&quot;</span>
                <span className="text-[#d4d4d4]">,</span>{" "}
                <span className="text-[#9cdcfe]">boss</span>
                <span className="text-[#d4d4d4]">.</span>
                <span className="text-[#9cdcfe]">phase</span>
                <span className="text-[#d4d4d4]">);</span>
                  </>
                ),
              },
            ].map((line, index) => (
              <div key={line.id} className="contents">
                <div className="border-r border-[#2d2d30] pr-3 text-right text-[#6e7681]">
                  {index + 1}
                </div>
                <div className="overflow-x-auto pl-4 text-[#d4d4d4]">{line.content}</div>
              </div>
            ))}
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
                Join a room, inherit the last step, and either code it or describe it.
                By reveal, the whole thing has mutated into something nobody meant.
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
