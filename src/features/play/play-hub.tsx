"use client";

import { useEffect, useMemo, useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  DoorOpen,
  LockKeyhole,
  RadioTower,
  SlidersHorizontal,
  TestTube2,
  WandSparkles,
} from "lucide-react";
import { useDemoMode } from "@/components/providers/demo-mode-provider";
import { usePersistedNickname } from "@/features/auth/use-persisted-nickname";
import { buildDemoLobbyRoomViewData } from "@/features/demo/mock-data";
import { getDemoStorageKey } from "@/features/demo/room-state";
import {
  getAllowedLanguagesForSkillMode,
  getSkillModeConfig,
  LANGUAGE_LABELS,
  normalizeRoomSettings,
} from "@/features/game/logic";
import { getPublicEnv } from "@/lib/env";
import { postJson } from "@/lib/client-api";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
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

function arraysEqual<T>(left: T[], right: T[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

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
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  const skillConfig = useMemo(() => getSkillModeConfig(skillMode), [skillMode]);
  const availableLanguages = useMemo(
    () => getAllowedLanguagesForSkillMode(skillMode),
    [skillMode],
  );
  const shouldUseDemoBackend = demoMode || !backendConfigured;

  useEffect(() => {
    const normalized = normalizeRoomSettings({
      visibility,
      playerCap,
      roundCount,
      skillMode,
      languageMode,
      languagePool,
      singleLanguage,
      profanityFilterEnabled: true,
      quickPlayDiscoverable: visibility === "public",
    });

    if (!arraysEqual(normalized.languagePool, languagePool)) {
      setLanguagePool(normalized.languagePool);
    }

    if (normalized.singleLanguage !== singleLanguage) {
      setSingleLanguage(normalized.singleLanguage ?? normalized.languagePool[0]);
    }
  }, [
    languageMode,
    languagePool,
    playerCap,
    roundCount,
    singleLanguage,
    skillMode,
    visibility,
  ]);

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
      const normalizedSettings = normalizeRoomSettings({
        visibility,
        playerCap,
        roundCount,
        skillMode,
        languageMode,
        languagePool,
        singleLanguage,
        profanityFilterEnabled: true,
        quickPlayDiscoverable: visibility === "public",
      });
      const result = await postJson<{ room_code: string }>("/api/rooms/create", {
        nickname,
        roomName,
        visibility: normalizedSettings.visibility,
        skillMode: normalizedSettings.skillMode,
        languageMode: normalizedSettings.languageMode,
        languagePool: normalizedSettings.languagePool,
        singleLanguage: normalizedSettings.singleLanguage,
        roundCount: normalizedSettings.roundCount,
        playerCap: normalizedSettings.playerCap,
        profanityFilterEnabled: normalizedSettings.profanityFilterEnabled,
        quickPlayDiscoverable: normalizedSettings.quickPlayDiscoverable,
        turnstileToken,
        demoMode: shouldUseDemoBackend,
      });

      if (shouldUseDemoBackend && typeof window !== "undefined") {
        const demoRoomData = buildDemoLobbyRoomViewData(result.room_code, nickname, {
          roomName,
          settings: normalizedSettings,
        });

        if (demoRoomData) {
          window.localStorage.setItem(
            getDemoStorageKey(result.room_code),
            JSON.stringify(demoRoomData),
          );
        }
      }

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
      <Card className="space-y-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>Play</Badge>
              {shouldUseDemoBackend ? <Badge>Demo backend active</Badge> : <Badge>Live backend</Badge>}
              <Badge>{skillConfig.label}</Badge>
            </div>
            <div>
              <CardTitle className="text-[1.9rem] sm:text-[2.2rem]">
                Get into a room fast.
              </CardTitle>
              <CardDescription className="mt-2 max-w-2xl text-base">
                Set a nickname, start a room, or punch in a code. The rest should stay out of your way.
              </CardDescription>
            </div>
          </div>
          <Field className="w-full max-w-[340px]">
            <FieldLabel>Nickname</FieldLabel>
            <Input
              placeholder="late-night-dev"
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
            />
          </Field>
        </div>
        {!backendConfigured ? (
          <div className="rounded-[14px] border border-dashed border-[rgba(210,153,34,0.45)] bg-[rgba(210,153,34,0.08)] px-4 py-3 text-sm text-[color:var(--color-text-soft)]">
            Live backend is not configured in this workspace yet. Demo mode keeps the full room flow usable while you test.
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <div className="surface-pill inline-flex items-center gap-2 rounded-[12px] px-3 py-2">
            <span className="label-mono text-[color:var(--color-text-muted)]">time</span>
            <span className="font-semibold text-[color:var(--color-text-strong)]">{skillConfig.timerSeconds}s</span>
          </div>
          <div className="surface-pill inline-flex items-center gap-2 rounded-[12px] px-3 py-2">
            <span className="label-mono text-[color:var(--color-text-muted)]">lines</span>
            <span className="font-semibold text-[color:var(--color-text-strong)]">{skillConfig.lineLimit}</span>
          </div>
          <div className="surface-pill inline-flex items-center gap-2 rounded-[12px] px-3 py-2">
            <span className="label-mono text-[color:var(--color-text-muted)]">chars</span>
            <span className="font-semibold text-[color:var(--color-text-strong)]">{skillConfig.charLimit}</span>
          </div>
        </div>
      </Card>

      <section className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <Card className="space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Badge>Create</Badge>
              <CardTitle className="mt-3">Start a room</CardTitle>
              <CardDescription className="mt-2">
                Pick the vibe, share the code, and launch when the roster looks right.
              </CardDescription>
            </div>
            <LockKeyhole className="mt-1 h-5 w-5 shrink-0 text-[color:var(--color-accent-hover)]" />
          </div>

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

          <Field>
            <FieldLabel>Skill Mode</FieldLabel>
            <SegmentedControl
              value={skillMode}
              onChange={(value) => {
                setSkillMode(value);
                if (value === "chaos" && languageMode === "single") {
                  setLanguageMode("random");
                }
              }}
              options={SKILL_MODES.map((mode) => ({
                value: mode,
                label: getSkillModeConfig(mode).label,
              }))}
            />
          </Field>

          {(visibility === "public" || shouldUseDemoBackend) ? (
            <TurnstileWidget onToken={setTurnstileToken} />
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button fullWidth size="lg" className="sm:w-auto" onClick={handleCreateRoom} disabled={loadingAction === "create"}>
              {loadingAction === "create" ? "Creating..." : shouldUseDemoBackend ? "Create demo room" : "Create room"}
            </Button>
            <Button
              variant="ghost"
              className="sm:w-auto"
              onClick={() => setShowAdvancedSettings((current) => !current)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Advanced settings
              {showAdvancedSettings ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>

          {showAdvancedSettings ? (
            <div className="space-y-4 rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-bg-main)] p-4">
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
                  {availableLanguages.map((language) => (
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
            </div>
          ) : null}
        </Card>

        <Card className="space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>Join</Badge>
                <Badge>Quick Play</Badge>
              </div>
              <CardTitle className="mt-3">Jump into a room</CardTitle>
              <CardDescription className="mt-2">
                Use a room code, spectate, or let Relay find the fastest match.
              </CardDescription>
            </div>
            <DoorOpen className="mt-1 h-5 w-5 shrink-0 text-[color:var(--color-warning)]" />
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

          <div className="rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-bg-main)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="label-mono text-[color:var(--color-text-muted)]">Quick Play</p>
                <p className="text-sm text-[color:var(--color-text-soft)]">
                  Uses <span className="text-[color:var(--color-text-strong)]">{skillConfig.label}</span>{skillMode === "chaos" ? " with random code languages." : " and the current room setup."}
                </p>
              </div>
              <Badge>{skillConfig.label}</Badge>
            </div>
            <Button variant="accent" fullWidth size="lg" className="mt-4" onClick={handleQuickPlay} disabled={loadingAction === "quick"}>
              <RadioTower className="h-4 w-4" />
              {loadingAction === "quick" ? "Matching..." : shouldUseDemoBackend ? "Find demo room" : "Find room"}
            </Button>
          </div>

          <div className="rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-bg-main)] px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <TestTube2 className="h-4 w-4 text-[color:var(--color-warning)]" />
                  <p className="text-sm font-medium text-[color:var(--color-text-strong)]">
                    Demo / testing mode
                  </p>
                </div>
                <p className="mt-1 text-sm text-[color:var(--color-text-muted)]">
                  {demoMode
                    ? "Unlocked for mock rooms and faster QA."
                    : "Use the temporary password gate when you need the mock path."}
                </p>
              </div>
              <Button variant="ghost" onClick={openDialog}>
                <WandSparkles className="h-4 w-4" />
                {demoMode ? "Demo tools" : "Enter demo"}
              </Button>
            </div>
            {demoMode ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {demoShortcutRooms.map((room) => (
                  <Button
                    key={room.code}
                    variant="secondary"
                    size="sm"
                    onClick={() => navigateToRoom(room.code)}
                  >
                    {room.code}
                  </Button>
                ))}
              </div>
            ) : null}
          </div>
        </Card>
      </section>
    </div>
  );
}
