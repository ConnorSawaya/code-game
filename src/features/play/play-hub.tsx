"use client";

import { useMemo, useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Dice5, DoorOpen, Sparkles, TimerReset } from "lucide-react";
import { usePersistedNickname } from "@/features/auth/use-persisted-nickname";
import { getSkillModeConfig, LANGUAGE_LABELS } from "@/features/game/logic";
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

export function PlayHub() {
  const router = useRouter();
  const { nickname, setNickname } = usePersistedNickname("");
  const [roomName, setRoomName] = useState("Relay Room");
  const [roomCode, setRoomCode] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [skillMode, setSkillMode] = useState<"beginner" | "intermediate" | "advanced" | "chaos">("beginner");
  const [languageMode, setLanguageMode] = useState<"single" | "rotate" | "random">("single");
  const [languagePool, setLanguagePool] = useState<(typeof CODE_LANGUAGES)[number][]>([
    "html_css_js",
    "javascript",
    "python",
  ]);
  const [singleLanguage, setSingleLanguage] = useState<(typeof CODE_LANGUAGES)[number]>("html_css_js");
  const [roundCount, setRoundCount] = useState(4);
  const [playerCap, setPlayerCap] = useState(8);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const skillConfig = useMemo(() => getSkillModeConfig(skillMode), [skillMode]);

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

    try {
      setLoadingAction(asSpectator ? "spectate" : "join");
      const result = await postJson<{ room_code: string }>("/api/rooms/join", {
        roomCode,
        nickname,
        asSpectator,
        turnstileToken,
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

    try {
      setLoadingAction("quick");
      const result = await postJson<{ room_code: string }>("/api/rooms/quick-play", {
        nickname,
        skillMode,
        turnstileToken,
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
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]"
      >
        <Card className="overflow-hidden p-0">
          <div className="grid gap-6 px-6 py-8 sm:px-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-5">
              <Badge>Room Setup</Badge>
              <div className="space-y-3">
                <h1 className="text-balance text-4xl font-semibold tracking-[-0.05em] text-[color:var(--color-ink)] sm:text-5xl">
                  Build a room in minutes, then let the chains get gloriously weird.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-[color:var(--color-muted)]">
                  Relay is tuned for quick party starts: guest-friendly identity,
                  curated prompt packs, multi-language rounds, and polished reveal links.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="paper-panel rounded-[24px] p-4">
                  <p className="text-sm font-medium text-[color:var(--color-muted)]">Room Code</p>
                  <p className="mt-3 font-display text-2xl tracking-[-0.05em]">5 characters</p>
                </div>
                <div className="paper-panel rounded-[24px] p-4">
                  <p className="text-sm font-medium text-[color:var(--color-muted)]">Modes</p>
                  <p className="mt-3 font-display text-2xl tracking-[-0.05em]">4 skill presets</p>
                </div>
                <div className="paper-panel rounded-[24px] p-4">
                  <p className="text-sm font-medium text-[color:var(--color-muted)]">Prompts</p>
                  <p className="mt-3 font-display text-2xl tracking-[-0.05em]">600 starters</p>
                </div>
              </div>
            </div>
            <Card className="border-white/70 bg-white/88">
              <CardTitle>Identity</CardTitle>
              <CardDescription>
                Guests are first-class here. Pick a nickname once, and we’ll carry it through create, join, and quick play.
              </CardDescription>
              <Field className="mt-5">
                <FieldLabel>Nickname</FieldLabel>
                <Input
                  placeholder="Ada, ByteMuse, SnackBug..."
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                />
                <FieldHint>Use 2-28 characters. You can upgrade to email later without losing your history.</FieldHint>
              </Field>
            </Card>
          </div>
        </Card>
        <Card className="space-y-5">
          <Badge>Mode Preview</Badge>
          <div>
            <CardTitle>{skillConfig.label}</CardTitle>
            <CardDescription>{skillConfig.summary}</CardDescription>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-[22px] bg-white/80 p-4">
              <p className="text-[color:var(--color-muted)]">Timer</p>
              <p className="mt-2 font-display text-2xl tracking-[-0.04em]">{skillConfig.timerSeconds}s</p>
            </div>
            <div className="rounded-[22px] bg-white/80 p-4">
              <p className="text-[color:var(--color-muted)]">Line Cap</p>
              <p className="mt-2 font-display text-2xl tracking-[-0.04em]">{skillConfig.lineLimit}</p>
            </div>
            <div className="rounded-[22px] bg-white/80 p-4">
              <p className="text-[color:var(--color-muted)]">Char Cap</p>
              <p className="mt-2 font-display text-2xl tracking-[-0.04em]">{skillConfig.charLimit}</p>
            </div>
          </div>
          <Field>
            <FieldLabel>Skill Mode</FieldLabel>
            <SegmentedControl
              value={skillMode}
              onChange={(value) => setSkillMode(value)}
              options={SKILL_MODES.map((mode) => ({
                value: mode,
                label: getSkillModeConfig(mode).label,
              }))}
            />
          </Field>
        </Card>
      </motion.section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Create Room</CardTitle>
              <CardDescription>Private by default, public when you want the room to surface in the browser and quick play.</CardDescription>
            </div>
            <Sparkles className="h-5 w-5 text-[color:var(--color-coral)]" />
          </div>
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
          <Field>
            <FieldLabel>Language Mode</FieldLabel>
            <SegmentedControl
              value={languageMode}
              onChange={setLanguageMode}
              options={LANGUAGE_MODES.map((mode) => ({
                value: mode,
                label:
                  mode === "single"
                    ? "Single"
                    : mode === "rotate"
                      ? "Rotate"
                      : "Random",
              }))}
            />
          </Field>
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
          <AnimatePresence initial={false}>
            {languageMode === "single" ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
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
              </motion.div>
            ) : null}
          </AnimatePresence>
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
          {visibility === "public" ? <TurnstileWidget onToken={setTurnstileToken} /> : null}
          <Button fullWidth onClick={handleCreateRoom} disabled={loadingAction === "create"}>
            {loadingAction === "create" ? "Creating room..." : "Create Relay room"}
          </Button>
        </Card>

        <Card className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Join by Code</CardTitle>
              <CardDescription>Jump straight into a private room, reconnect to an old seat, or spectate a live match.</CardDescription>
            </div>
            <DoorOpen className="h-5 w-5 text-[color:var(--color-cobalt)]" />
          </div>
          <Field>
            <FieldLabel>Room Code</FieldLabel>
            <Input
              placeholder="ABCDE"
              maxLength={5}
              value={roomCode}
              onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
            />
          </Field>
          <TurnstileWidget onToken={setTurnstileToken} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => handleJoinRoom(false)}
              disabled={loadingAction === "join"}
            >
              {loadingAction === "join" ? "Joining..." : "Join room"}
            </Button>
            <Button
              variant="ghost"
              fullWidth
              onClick={() => handleJoinRoom(true)}
              disabled={loadingAction === "spectate"}
            >
              {loadingAction === "spectate" ? "Opening..." : "Spectate live room"}
            </Button>
          </div>
        </Card>

        <Card className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Quick Play</CardTitle>
              <CardDescription>Match into the oldest compatible public room for your selected vibe, or spin up a fresh one automatically.</CardDescription>
            </div>
            <Dice5 className="h-5 w-5 text-[color:var(--color-gold)]" />
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
          <div className="rounded-[24px] bg-white/75 p-4">
            <div className="flex items-center gap-2 text-[color:var(--color-muted)]">
              <TimerReset className="h-4 w-4" />
              <span className="text-sm">Current default</span>
            </div>
            <p className="mt-3 font-display text-2xl tracking-[-0.04em]">
              {skillConfig.timerSeconds}s rounds
            </p>
            <p className="mt-2 text-sm leading-6 text-[color:var(--color-muted)]">
              {skillMode === "chaos"
                ? "Chaos uses random-per-code-round language assignment automatically."
                : "Quick Play keeps the room’s language settings if you join an existing lobby."}
            </p>
          </div>
          <TurnstileWidget onToken={setTurnstileToken} />
          <Button variant="accent" fullWidth onClick={handleQuickPlay} disabled={loadingAction === "quick"}>
            {loadingAction === "quick" ? "Matching..." : "Find a room"}
          </Button>
        </Card>
      </section>
    </div>
  );
}
