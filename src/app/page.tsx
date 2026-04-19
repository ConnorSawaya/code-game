"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  PlayCircle,
  TerminalSquare,
  Users,
} from "lucide-react";
import { EditorShell } from "@/components/editor/editor-shell";
import { useDemoMode } from "@/components/providers/demo-mode-provider";
import { HandoffStrip } from "@/components/ui/handoff-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const steps = [
  {
    title: "Join a room",
    body: "Pick a nickname and get in.",
  },
  {
    title: "Build your turn",
    body: "Code it or describe it.",
  },
  {
    title: "Reveal it",
    body: "See what the room turned it into.",
  },
];

const features = [
  {
    icon: Users,
    title: "Live rooms",
    body: "Private codes, public rooms, spectators.",
  },
  {
    icon: TerminalSquare,
    title: "Real editor",
    body: "Monaco, limits, preview, dark viewer.",
  },
  {
    icon: PlayCircle,
    title: "Demo mode",
    body: "Mock rooms and testing controls.",
  },
];

const demoRooms = ["boss-fight-jam", "shader-chaos", "late-night-refactor", "cursed-platformer"];
const heroFlow = [
  { label: "Prompt", hint: "Boss fight hates campers." },
  { label: "Code", hint: "The boss escalates if you stop moving." },
  { label: "Describe", hint: "Now somebody has to explain that clearly." },
  { label: "Reveal", hint: "By the end it barely resembles the opener." },
];

function HeroWorkbench() {
  const [activeTab, setActiveTab] = useState("enemySpawner.ts");
  const heroTabs = useMemo(
    () => [
      { id: "enemySpawner.ts", label: "enemySpawner.ts", fileKind: "code" as const },
      { id: "README.md", label: "README.md", fileKind: "markdown" as const },
      { id: "room.settings.json", label: "room.settings.json", fileKind: "json" as const },
    ],
    [],
  );
  const heroTree = useMemo(
    () => [
      { id: "workspace-root", label: "relay-room", depth: 0, kind: "folder" as const },
      { id: "workspace-source", label: "src", depth: 1, kind: "folder" as const },
      { id: "enemySpawner.ts", label: "enemySpawner.ts", depth: 2, kind: "file" as const, fileKind: "code" as const },
      { id: "playerController.js", label: "playerController.js", depth: 2, kind: "file" as const, fileKind: "code" as const },
      { id: "README.md", label: "README.md", depth: 1, kind: "file" as const, fileKind: "markdown" as const },
      { id: "room.settings.json", label: "room.settings.json", depth: 1, kind: "file" as const, fileKind: "json" as const },
    ],
    [],
  );
  const activePath =
    activeTab === "README.md"
      ? "README.md"
      : activeTab === "room.settings.json"
        ? "room.settings.json"
        : `src/${activeTab}`;

  return (
    <EditorShell
      title={`relay-demo/${activePath}`}
      workspaceLabel="relay-workspace"
      activeTabId={activeTab}
      onTabChange={setActiveTab}
      panelPosition="right"
      tabs={heroTabs}
      treeItems={heroTree}
      panel={
        <div className="grid h-full min-h-0 grid-rows-[auto_auto_minmax(0,1fr)] bg-[#111317]">
          <div className="border-b border-[#2d2d30] px-4 py-3">
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[#8b949e]">
              Handoff live
            </p>
            <div className="mt-3">
              <HandoffStrip items={heroFlow} activeIndex={2} orientation="vertical" />
            </div>
          </div>
          <div className="grid gap-3 border-b border-[#2d2d30] px-4 py-3">
            <div>
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[#8b949e]">
                Received
              </p>
              <p className="mt-2 text-sm leading-6 text-[#e6edf3]">
                Boss fight hates campers.
              </p>
            </div>
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
          <span>{activeTab === "README.md" ? "Markdown" : activeTab === "room.settings.json" ? "JSON" : "TypeScript"}</span>
          <span>Round 2 / 4</span>
        </>
      }
      statusRight={
        <>
          <span>4 players</span>
          <span>relay live</span>
        </>
      }
      content={
        activeTab === "README.md" ? (
          <div className="grid gap-4 bg-[#1e1e1e] px-5 py-4 font-mono text-[13px] leading-7 text-[#c9d1d9]" style={{ minHeight: 320 }}>
            <p className="text-[#4ec9b0]"># README.md</p>
            <p>Room theme: boss encounter with zero patience.</p>
            <p>Prompt: build a fight that gets offended if the player stalls.</p>
            <p>Goal: keep the handoff clear enough that the next person can still wreck it.</p>
          </div>
        ) : activeTab === "room.settings.json" ? (
          <div className="grid gap-4 bg-[#1e1e1e] px-5 py-4 font-mono text-[13px] leading-7 text-[#c9d1d9]" style={{ minHeight: 320 }}>
            <p className="text-[#4ec9b0]">{`// room.settings.json`}</p>
            <p>{`{`}</p>
            <p>{`  "mode": "intermediate",`}</p>
            <p>{`  "language": "typescript",`}</p>
            <p>{`  "rounds": 4,`}</p>
            <p>{`  "timerSeconds": 90`}</p>
            <p>{`}`}</p>
          </div>
        ) : (
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
        )
      }
    />
  );
}

export default function HomePage() {
  const { demoMode, openDialog } = useDemoMode();

  return (
    <div className="section-grid pb-8">
      <section className="hero-grid relay-ambient relative overflow-hidden rounded-[22px] border border-[color:var(--color-border)] bg-[linear-gradient(180deg,rgba(13,17,23,0.98),rgba(11,16,21,0.98))] p-6 shadow-[var(--shadow-panel)] sm:p-8">
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.14),transparent)]" />
        <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr] xl:items-start">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>Multiplayer code telephone</Badge>
                {demoMode ? <Badge>Demo mode unlocked</Badge> : null}
              </div>
              <div className="space-y-4">
                <p className="font-mono text-[0.72rem] uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
                  Live room
                </p>
                <h1 className="max-w-[10.5ch] text-balance font-display text-5xl font-semibold tracking-[-0.07em] text-[color:var(--color-text-strong)] sm:text-6xl sm:leading-[0.94]">
                  Pass the code. Ship the chaos.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-[color:var(--color-text-soft)]">
                  One prompt starts it. Everyone only gets the last step. By reveal, it barely looks the same.
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
            <div className="hidden lg:block">
              <div className="stack-panel relay-ambient space-y-4 px-4 py-4">
                <div>
                  <p className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-[color:var(--color-text-muted)]">
                    Handoff
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--color-text-soft)]">
                    Prompt in. Code out. Damage report later.
                  </p>
                </div>
                <div className="relay-divider" />
                <HandoffStrip items={heroFlow} activeIndex={2} orientation="vertical" />
                <div className="relay-divider" />
                <div className="space-y-1">
                  <p className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-[color:var(--color-text-muted)]">
                    Right now
                  </p>
                  <p className="text-sm font-medium text-[color:var(--color-text-strong)]">
                    Room BOSS1 is already drifting.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="xl:translate-y-4">
            <HeroWorkbench />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="grid gap-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <Badge>How It Works</Badge>
            <h2 className="mt-3 font-display text-3xl tracking-[-0.05em] text-[color:var(--color-text-strong)]">
              That’s the whole thing.
            </h2>
          </div>
          <p className="hidden max-w-md text-sm leading-7 text-[color:var(--color-text-muted)] lg:block">
            Short rounds. One visible step. Reveal at the end.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
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
          <Badge>Inside</Badge>
          <div>
            <CardTitle>What you get.</CardTitle>
            <CardDescription className="mt-2">
              Just the parts you need to get a room moving.
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
        <Card className="space-y-5 relay-ambient">
          <div>
            <div>
              <Badge>Rooms</Badge>
              <CardTitle className="mt-3">A few rooms already open.</CardTitle>
              <CardDescription className="mt-2">
                Private, live, or already at reveal.
              </CardDescription>
            </div>
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
