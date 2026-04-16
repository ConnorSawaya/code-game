"use client";

import { useMemo, useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  DoorOpen,
  LockKeyhole,
  RadioTower,
  TestTube2,
  TimerReset,
  WandSparkles,
} from "lucide-react";
import { useDemoMode } from "@/components/providers/demo-mode-provider";
import { usePersistedNickname } from "@/features/auth/use-persisted-nickname";
import { getSkillModeConfig, LANGUAGE_LABELS } from "@/features/game/logic";
import { getPublicEnv } from "@/lib/env";
import { postJson } from "@/lib/client-api";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldHint, FieldLabel } from "@/components/ui/field";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { SelectableChip } from "@/components/ui/chip";
import { TurnstileWidget } from "@/components/ui/turnstile-widget";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CODE_LANGUAGES, LANGUAGE_MODES, SKILL_MODES } from "@/features/game/types";

const demoShortcutRooms = [
  { code: "BOSS1", label: "Playable demo lobby", description: "Host a mock room and test the full flow." },
  { code: "SHDR5", label: "Live spectator room", description: "Watch an in-progress room with believable data." },
  { code: "CURSD", label: "Reveal room", description: "Open the final playback stage immediately." },
];

export function PlayHub() {
  const router = useRouter();
  const env = getPublicEnv();
  const backendConfigured = Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
  const { demoMode, openDialog } = useDemoMode();
  const { nickname, setNickname } = usePersistedNickname("late-night-dev");
  const [roomName, setRoomName] = useState("Relay Room");
  const [roomCode, setRoomCode] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [skillMode, setSkillMode] = useState<"beginner" | "intermediate" | "advanced" | "chaos">("intermediate");
  const [languageMode, setLanguageMode] = useState<"single" | "rotate" | "random">("single");
  const [languagePool, setLanguagePool] = useState<(typeof CODE_LANGUAGES)[number][]>([
    "typescript",
    "javascript",
    "html_css_js",
  ]);
  const [singleLanguage, setSingleLanguage] = useState<(typeof CODE_LANGUAGES)[number]>("typescript");
  const [roundCount, setRoundCount] = useState(4);
  const [playerCap, setPlayerCap] = useState(8);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const skillConfig = useMemo(() => getSkillModeConfig(skillMode), [skillMode]);
  const shouldUseDemoBackend = demoMode || !backendConfigured;

  const handleToggleLanguage = (language: (typeof CODE_LANGUAGES)[number]) => {
    setLanguagePool((current) => {
      if (current.includes(language)) {
        const next = current.filter((entry) => entry !== language);
        return next.length > 0 ? next : current;
      }

      return [...current, language];
    });
  };

  const guardNickname = () => {
    if (nickname.trim().length < 2) {
      toast.error("Pick a nickname first.");
      return false;
    }

    return true;
  };

  const navigateToRoom = (code: string) => {
    startTransition(() => {
      router.push(`/room/${code}`);
      router.refresh();
    });
  };

  const handleCreateRoom = async () => {
    if (!guardNickname()) {
      return;
    }

    if (!demoMode && !backendConfigured) {
      toast.error("Real room creation needs backend env. Use demo mode for now.");
      openDialog();
      return;
    }

    try {
      setLoadingAction("create");
      const result = await postJson<{ room_code: string }>("/api/rooms/create", {
        nickname,
        roomName,
        visibility,
        skillMode,
        languageMode,
        languagePool,
        singleLanguage: languageMode === "single" ? singleLanguage : null,
        roundCount,
        playerCap,
        profanityFilterEnabled: true,
        quickPlayDiscoverable: visibility === "public",
        turnstileToken,
        demoMode: shouldUseDemoBackend,
      });
      navigateToRoom(result.room_code);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create room.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleJoinRoom = async (asSpectator = false) => {
    if (!guardNickname()) {
      return;
    }

    if (!demoMode && !backendConfigured) {
      toast.error("Room join needs backend env. Unlock demo mode to test locally.");
      openDialog();
      return;
    }

    try {
      setLoadingAction(asSpectator ? "spectate" : "join");
      const result = await postJson<{ room_code: string }>("/api/rooms/join", {
        roomCode,
        nickname,
        asSpectator,
        turnstileToken,
        demoMode: shouldUseDemoBackend,
      });
      navigateToRoom(result.room_code);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to join room.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleQuickPlay = async () => {
    if (!guardNickname()) {
      return;
    }

    if (!demoMode && !backendConfigured) {
      toast.error("Quick Play needs backend env. Demo mode can fake it for testing.");
      openDialog();
      return;
    }

    try {
      setLoadingAction("quick");
      const result = await postJson<{ room_code: string }>("/api/rooms/quick-play", {
        nickname,
        skillMode,
        turnstileToken,
        demoMode: shouldUseDemoBackend,
      });
      navigateToRoom(result.room_code);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to find a quick-play room.");
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="section-grid">
      <section className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <Card className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Play</Badge>
            {shouldUseDemoBackend ? <Badge>Demo backend active</Badge> : <Badge>Live backend</Badge>}
          </div>
          <div>
            <CardTitle className="text-[2rem] sm:text-[2.4rem]">
              Start a room, join a code, or jump straight into a test match.
            </CardTitle>
            <CardDescription className="mt-3 max-w-2xl text-base leading-7">
              Relay should feel fast before the first round even begins. Set your nickname once,
              pick the room vibe, and get into the fun part quickly.
            </CardDescription>
          </div>
          {!backendConfigured ? (
            <div className="stack-panel px-4 py-4">
              <p className="label-mono text-[color:var(--color-warning)]">Backend note</p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--color-text)]">
                Supabase env is missing in this workspace. Real multiplayer flows are preserved,
                but demo mode is the safest way to test the product end-to-end right now.
              </p>
            </div>
          ) : null}
          <Field>
            <FieldLabel>Nickname</FieldLabel>
            <Input
              placeholder="late-night-dev"
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
            />
            <FieldHint>Guests are first-class here. Pick something quick and recognizable.</FieldHint>
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="stack-panel px-4 py-4">
              <p className="label-mono text-[color:var(--color-text-muted)]">Time</p>
              <p className="mt-2 font-display text-3xl tracking-[-0.06em] text-[color:var(--color-text-strong)]">
                {skillConfig.timerSeconds}s
              </p>
            </div>
            <div className="stack-panel px-4 py-4">
              <p className="label-mono text-[color:var(--color-text-muted)]">Lines</p>
              <p className="mt-2 font-display text-3xl tracking-[-0.06em] text-[color:var(--color-text-strong)]">
                {skillConfig.lineLimit}
              </p>
            </div>
            <div className="stack-panel px-4 py-4">
              <p className="label-mono text-[color:var(--color-text-muted)]">Chars</p>
              <p className="mt-2 font-display text-3xl tracking-[-0.06em] text-[color:var(--color-text-strong)]">
                {skillConfig.charLimit}
              </p>
            </div>
          </div>
        </Card>

        <Card className="space-y-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <Badge>Room Profile</Badge>
              <CardTitle className="mt-3">{skillConfig.label}</CardTitle>
              <CardDescription className="mt-2">{skillConfig.summary}</CardDescription>
            </div>
            <div className="rounded-[12px] border border-[color:var(--color-border)] bg-[color:var(--color-bg-main)] px-3 py-2 font-mono text-[0.72rem] uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
              {visibility === "public" ? "public room" : "private room"}
            </div>
          </div>
          <Field>
            <FieldLabel>Skill Mode</FieldLabel>
            <SegmentedControl
              value={skillMode}
              onChange={setSkillMode}
              options={SKILL_MODES.map((mode) => ({
                value: mode,
                label: getSkillModeConfig(mode).label,
              }))}
            />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel>Room Name</FieldLabel>
              <Input value={roomName} onChange={(event) => setRoomName(event.target.value)} />
            </Field>
            <Field>
              <FieldLabel>Visibility</FieldLabel>
              <SegmentedControl
                value={visibility}
                onChange={setVisibility}
                options={[
                  { label: "Private", value: "private" },
                  { label: "Public", value: "public" },
                ]}
              />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel>Language Mode</FieldLabel>
              <SegmentedControl
                value={languageMode}
                onChange={setLanguageMode}
                options={LANGUAGE_MODES.map((mode) => ({
                  value: mode,
                  label:
                    mode === "single" ? "Single" : mode === "rotate" ? "Rotate" : "Random",
                }))}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel>Rounds</FieldLabel>
                <Input
                  type="number"
                  min={2}
                  max={11}
                  value={roundCount}
                  onChange={(event) => setRoundCount(Number(event.target.value))}
                />
              </Field>
              <Field>
                <FieldLabel>Player Cap</FieldLabel>
                <Input
                  type="number"
                  min={3}
                  max={12}
                  value={playerCap}
                  onChange={(event) => setPlayerCap(Number(event.target.value))}
                />
              </Field>
            </div>
          </div>
          <Field>
            <FieldLabel>Language Pool</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {CODE_LANGUAGES.map((language) => (
                <SelectableChip
                  key={language}
                  selected={languagePool.includes(language)}
                  label={LANGUAGE_LABELS[language]}
                  onClick={() => handleToggleLanguage(language)}
                />
              ))}
            </div>
          </Field>
          {languageMode === "single" ? (
            <Field>
              <FieldLabel>Single Language</FieldLabel>
              <SegmentedControl
                value={singleLanguage}
                onChange={setSingleLanguage}
                options={languagePool.map((language) => ({
                  value: language,
                  label: LANGUAGE_LABELS[language],
                }))}
              />
            </Field>
          ) : null}
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <Card className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <Badge>Create</Badge>
              <CardTitle className="mt-3">Build a room</CardTitle>
            </div>
            <LockKeyhole className="h-5 w-5 text-[color:var(--color-accent-hover)]" />
          </div>
          <CardDescription>
            Private by default. Public when you want browsers and quick-play traffic.
          </CardDescription>
          {visibility === "public" || shouldUseDemoBackend ? (
            <TurnstileWidget onToken={setTurnstileToken} />
          ) : null}
          <Button fullWidth size="lg" onClick={handleCreateRoom} disabled={loadingAction === "create"}>
            {loadingAction === "create" ? "Creating..." : shouldUseDemoBackend ? "Create demo room" : "Create room"}
          </Button>
        </Card>

        <Card className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <Badge>Join</Badge>
              <CardTitle className="mt-3">Join by code</CardTitle>
            </div>
            <DoorOpen className="h-5 w-5 text-[color:var(--color-warning)]" />
          </div>
          <Field>
            <FieldLabel>Room Code</FieldLabel>
            <Input
              placeholder="BOSS1"
              maxLength={5}
              value={roomCode}
              onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
            />
          </Field>
          <TurnstileWidget onToken={setTurnstileToken} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Button variant="secondary" fullWidth onClick={() => void handleJoinRoom(false)} disabled={loadingAction === "join"}>
              {loadingAction === "join" ? "Joining..." : "Join room"}
            </Button>
            <Button variant="ghost" fullWidth onClick={() => void handleJoinRoom(true)} disabled={loadingAction === "spectate"}>
              {loadingAction === "spectate" ? "Opening..." : "Spectate"}
            </Button>
          </div>
        </Card>

        <Card className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <Badge>Quick Play</Badge>
              <CardTitle className="mt-3">Match into a room</CardTitle>
            </div>
            <RadioTower className="h-5 w-5 text-[color:var(--color-success)]" />
          </div>
          <CardDescription>
            Relay finds the oldest compatible public lobby or starts a new one with the same vibe.
          </CardDescription>
          <div className="stack-panel px-4 py-4">
            <div className="flex items-center gap-2 text-[color:var(--color-text-muted)]">
              <TimerReset className="h-4 w-4" />
              <span className="text-sm font-medium">Current match profile</span>
            </div>
            <p className="mt-3 font-display text-3xl tracking-[-0.06em] text-[color:var(--color-text-strong)]">
              {skillConfig.timerSeconds}s rounds
            </p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--color-text-muted)]">
              {skillMode === "chaos"
                ? "Chaos defaults to random code languages every code round."
                : "If you join an existing room, Relay preserves that room's language setup."}
            </p>
          </div>
          <TurnstileWidget onToken={setTurnstileToken} />
          <Button variant="accent" fullWidth size="lg" onClick={handleQuickPlay} disabled={loadingAction === "quick"}>
            {loadingAction === "quick" ? "Matching..." : shouldUseDemoBackend ? "Find demo room" : "Find room"}
          </Button>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <Card className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <Badge>Demo / Testing</Badge>
              <CardTitle className="mt-3">Temporary unlock for local QA</CardTitle>
            </div>
            <TestTube2 className="h-5 w-5 text-[color:var(--color-warning)]" />
          </div>
          <CardDescription>
            Use the temporary password gate when you need believable mock rooms, replay data,
            and admin test controls without a fully wired backend.
          </CardDescription>
          <div className="stack-panel px-4 py-4">
            <p className="label-mono text-[color:var(--color-text-muted)]">Current state</p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--color-text)]">
              {demoMode
                ? "Demo mode is active. Create, join, and replay flows will use the mock test path where needed."
                : "Demo mode is locked. Unlock it if you want mock data and bypasses for unfinished flows."}
            </p>
          </div>
          <Button variant="secondary" onClick={openDialog}>
            <WandSparkles className="h-4 w-4" />
            {demoMode ? "Re-open demo mode panel" : "Enter Demo Mode"}
          </Button>
        </Card>

        <Card className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <Badge>Demo Shortcuts</Badge>
              <CardTitle className="mt-3">Useful fake rooms for quick checks</CardTitle>
            </div>
            <ArrowRight className="h-5 w-5 text-[color:var(--color-accent-hover)]" />
          </div>
          <div className="space-y-3">
            {demoShortcutRooms.map((room) => (
              <div
                key={room.code}
                className="flex flex-wrap items-center justify-between gap-4 rounded-[14px] border border-[color:var(--color-border)] bg-[color:var(--color-bg-main)] px-4 py-4"
              >
                <div>
                  <p className="font-medium text-[color:var(--color-text-strong)]">{room.label}</p>
                  <p className="mt-1 text-sm text-[color:var(--color-text-muted)]">{room.description}</p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (!demoMode) {
                      openDialog();
                      return;
                    }

                    navigateToRoom(room.code);
                  }}
                >
                  {room.code}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
