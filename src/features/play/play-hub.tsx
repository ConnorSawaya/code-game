"use client";

import { useMemo, useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Dice5, DoorOpen, LockKeyhole, Sparkles, TimerReset } from "lucide-react";
import { usePersistedNickname } from "@/features/auth/use-persisted-nickname";
import { getSkillModeConfig, LANGUAGE_LABELS } from "@/features/game/logic";
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
        className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]"
      >
        <Card className="overflow-hidden p-0">
          <div className="relative overflow-hidden px-5 py-6 sm:px-7 sm:py-7">
            <div className="hero-orb left-[-2rem] top-[-1rem] h-24 w-24 bg-[rgba(239,109,75,0.26)]" />
            <div className="hero-orb right-[-1rem] top-3 h-28 w-28 bg-[rgba(53,90,216,0.2)]" />
            <div className="relative grid gap-6 lg:grid-cols-[1fr_0.92fr]">
              <div className="space-y-5">
                <Badge>Jump In Fast</Badge>
                <div className="space-y-3">
                  <h1 className="text-balance text-4xl font-semibold tracking-[-0.07em] text-[color:var(--color-ink)] sm:text-[4rem] sm:leading-[0.96]">
                    Start a room, join a code, or get matched into chaos.
                  </h1>
                  <p className="max-w-2xl text-base leading-8 text-[color:var(--color-muted)] sm:text-lg">
                    Relay is built for fast group starts. Pick your nickname once, choose the room vibe, and let the chain mutation do the rest.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="stack-panel px-4 py-4">
                    <p className="text-[0.7rem] uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                      Room Codes
                    </p>
                    <p className="mt-2 font-display text-3xl tracking-[-0.06em]">5 chars</p>
                  </div>
                  <div className="stack-panel px-4 py-4">
                    <p className="text-[0.7rem] uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                      Prompt Library
                    </p>
                    <p className="mt-2 font-display text-3xl tracking-[-0.06em]">600 ideas</p>
                  </div>
                  <div className="stack-panel px-4 py-4">
                    <p className="text-[0.7rem] uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                      Modes
                    </p>
                    <p className="mt-2 font-display text-3xl tracking-[-0.06em]">4 vibes</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="panel-ink rounded-[30px] p-5 text-[#dfe7f7]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[0.7rem] uppercase tracking-[0.16em] text-[#8fa1c5]">
                        Room Preview
                      </p>
                      <p className="mt-2 font-display text-3xl tracking-[-0.05em] text-white">
                        {skillConfig.label}
                      </p>
                    </div>
                    <Badge className="border-white/10 bg-white/6 text-[#dce5f7] shadow-none">
                      {visibility === "public" ? "Public" : "Private"}
                    </Badge>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="rounded-[20px] border border-white/8 bg-white/5 px-3 py-3">
                      <p className="text-[0.68rem] uppercase tracking-[0.14em] text-[#8fa1c5]">
                        Timer
                      </p>
                      <p className="mt-2 font-display text-2xl tracking-[-0.05em] text-white">
                        {skillConfig.timerSeconds}s
                      </p>
                    </div>
                    <div className="rounded-[20px] border border-white/8 bg-white/5 px-3 py-3">
                      <p className="text-[0.68rem] uppercase tracking-[0.14em] text-[#8fa1c5]">
                        Lines
                      </p>
                      <p className="mt-2 font-display text-2xl tracking-[-0.05em] text-white">
                        {skillConfig.lineLimit}
                      </p>
                    </div>
                    <div className="rounded-[20px] border border-white/8 bg-white/5 px-3 py-3">
                      <p className="text-[0.68rem] uppercase tracking-[0.14em] text-[#8fa1c5]">
                        Chars
                      </p>
                      <p className="mt-2 font-display text-2xl tracking-[-0.05em] text-white">
                        {skillConfig.charLimit}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="stack-panel space-y-4 px-5 py-5">
                  <div>
                    <FieldLabel>Nickname</FieldLabel>
                    <CardTitle className="mt-2">Pick your party-game identity.</CardTitle>
                    <CardDescription className="mt-2">
                      Guests are first-class players here. Use 2-28 characters and upgrade to email later without losing your history.
                    </CardDescription>
                  </div>
                  <Input
                    placeholder="Ada, ByteMuse, SnackBug..."
                    value={nickname}
                    onChange={(event) => setNickname(event.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="space-y-5">
          <Badge>Pick the Vibe</Badge>
          <div>
            <CardTitle>{skillConfig.label}</CardTitle>
            <CardDescription>{skillConfig.summary}</CardDescription>
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
          <div className="grid grid-cols-3 gap-3">
            <div className="stack-panel px-4 py-4">
              <p className="text-[0.7rem] uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                Timer
              </p>
              <p className="mt-2 font-display text-2xl tracking-[-0.05em]">{skillConfig.timerSeconds}s</p>
            </div>
            <div className="stack-panel px-4 py-4">
              <p className="text-[0.7rem] uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                Lines
              </p>
              <p className="mt-2 font-display text-2xl tracking-[-0.05em]">{skillConfig.lineLimit}</p>
            </div>
            <div className="stack-panel px-4 py-4">
              <p className="text-[0.7rem] uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                Chars
              </p>
              <p className="mt-2 font-display text-2xl tracking-[-0.05em]">{skillConfig.charLimit}</p>
            </div>
          </div>
        </Card>
      </motion.section>

      <section className="grid gap-5 xl:grid-cols-3">
        <Card className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <Badge>Create</Badge>
              <CardTitle className="mt-3">Build a room</CardTitle>
              <CardDescription className="mt-2">
                Private by default, public when you want the browser and Quick Play to feed it.
              </CardDescription>
            </div>
            <LockKeyhole className="h-5 w-5 text-[color:var(--color-cobalt)]" />
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
          <Button fullWidth size="lg" onClick={handleCreateRoom} disabled={loadingAction === "create"}>
            {loadingAction === "create" ? "Creating room..." : "Create Relay room"}
          </Button>
        </Card>

        <Card className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <Badge>Join</Badge>
              <CardTitle className="mt-3">Join by code</CardTitle>
              <CardDescription className="mt-2">
                Jump into a friend&apos;s lobby, reconnect to a seat, or spectate a game already in progress.
              </CardDescription>
            </div>
            <DoorOpen className="h-5 w-5 text-[color:var(--color-coral)]" />
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
          <div className="stack-panel space-y-3 px-4 py-4">
            <FieldLabel className="text-[color:var(--color-ink-soft)]">Quick note</FieldLabel>
            <p className="text-sm leading-7 text-[color:var(--color-muted)]">
              Private rooms open directly. Public rooms may ask for Turnstile verification before you join.
            </p>
          </div>
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
              {loadingAction === "spectate" ? "Opening..." : "Spectate live"}
            </Button>
          </div>
        </Card>

        <Card className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <Badge>Quick Play</Badge>
              <CardTitle className="mt-3">Match into a room</CardTitle>
              <CardDescription className="mt-2">
                Relay drops you into the oldest compatible public lobby or starts a fresh one automatically.
              </CardDescription>
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
          <div className="stack-panel space-y-3 px-4 py-4">
            <div className="flex items-center gap-2 text-[color:var(--color-muted)]">
              <TimerReset className="h-4 w-4" />
              <span className="text-sm font-medium">Match preview</span>
            </div>
            <p className="font-display text-2xl tracking-[-0.05em]">
              {skillConfig.timerSeconds}s rounds
            </p>
            <p className="text-sm leading-7 text-[color:var(--color-muted)]">
              {skillMode === "chaos"
                ? "Chaos defaults to random language assignment every code round."
                : "If you join an existing public lobby, Relay keeps that room&apos;s current language settings."}
            </p>
          </div>
          <TurnstileWidget onToken={setTurnstileToken} />
          <Button variant="accent" fullWidth size="lg" onClick={handleQuickPlay} disabled={loadingAction === "quick"}>
            {loadingAction === "quick" ? "Matching..." : "Find a room"}
          </Button>
          <div className="stack-panel space-y-3 px-4 py-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[color:var(--color-cobalt)]" />
              <FieldLabel className="text-[color:var(--color-ink-soft)]">Why Quick Play works</FieldLabel>
            </div>
            <p className="text-sm leading-7 text-[color:var(--color-muted)]">
              Matchmaking is lightweight on purpose: choose the vibe, keep the friction low, and get into the funny part quickly.
            </p>
          </div>
        </Card>
      </section>
    </div>
  );
}
