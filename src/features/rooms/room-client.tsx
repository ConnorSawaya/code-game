"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  startTransition,
} from "react";
import { useRouter } from "next/navigation";
import { differenceInSeconds } from "date-fns";
import { TestTube2, SkipForward, RotateCcw } from "lucide-react";
import type { PromptRecord } from "@/features/game/types";
import { deriveViewerTask, normalizeRoomSettings } from "@/features/game/logic";
import {
  favoriteDemoStep,
  forceAdvanceDemoRoom,
  getDemoStorageKey,
  reactToDemoStep,
  resetDemoRoom,
  saveDemoSettings,
  startDemoRoom,
  submitDemoTurn,
  toggleDemoQueue,
  toggleDemoReady,
} from "@/features/demo/room-state";
import type { RoomViewData } from "@/features/rooms/queries";
import { getSupabaseBrowserClient } from "@/features/supabase/browser";
import { postJson } from "@/lib/client-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { RoomActivePhase } from "@/features/rooms/room-active-phase";
import { RoomLobby } from "@/features/rooms/room-lobby";
import { RoomReportCard } from "@/features/rooms/room-report-card";
import { RoomReveal } from "@/features/rooms/room-reveal";
import { RoomHeader, RoomRosterCard } from "@/features/rooms/room-shared";
import { toast } from "sonner";

function getDraftKey(data: RoomViewData["snapshot"], chainId: string | null) {
  if (!data?.game || !chainId) {
    return null;
  }

  return `relay:draft:${data.code}:${data.game.id}:${data.game.roundIndex}:${chainId}`;
}

export function RoomClient({
  initialData,
  promptLibrary,
}: {
  initialData: RoomViewData;
  promptLibrary: PromptRecord[];
}) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [draft, setDraft] = useState("");
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [promptSearch, setPromptSearch] = useState("");
  const [promptDifficulty, setPromptDifficulty] = useState<"all" | PromptRecord["difficulty"]>("all");
  const [promptPack, setPromptPack] = useState<"all" | string>("all");
  const [settingsDraft, setSettingsDraft] = useState(initialData.snapshot?.settings ?? null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [demoStorageReady, setDemoStorageReady] = useState(false);

  const snapshot = data.snapshot;
  const isDemoRoom = Boolean(snapshot?.isDemo);
  const task = snapshot ? deriveViewerTask(snapshot) : null;
  const draftKey = getDraftKey(snapshot ?? null, task?.chainId ?? null);

  const refreshRoom = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  useEffect(() => {
    if (initialData.snapshot?.isDemo && initialData.snapshot.code) {
      try {
        const storedState = window.localStorage.getItem(
          getDemoStorageKey(initialData.snapshot.code),
        );

        if (storedState) {
          setData(JSON.parse(storedState) as RoomViewData);
          setDemoStorageReady(true);
          return;
        }
      } catch {
        window.localStorage.removeItem(getDemoStorageKey(initialData.snapshot.code));
      }
    }

    setData(initialData);
    setDemoStorageReady(true);
  }, [initialData]);

  useEffect(() => {
    if (snapshot?.isDemo && snapshot.code && demoStorageReady) {
      window.localStorage.setItem(getDemoStorageKey(snapshot.code), JSON.stringify(data));
    }
  }, [data, demoStorageReady, snapshot?.code, snapshot?.isDemo]);

  useEffect(() => {
    setSettingsDraft(snapshot?.settings ? normalizeRoomSettings(snapshot.settings) : null);
  }, [snapshot?.code, snapshot?.settings]);

  useEffect(() => {
    if (!draftKey) {
      setDraft(task?.currentSubmission?.text ?? "");
      return;
    }

    const storedDraft = window.localStorage.getItem(draftKey);
    setDraft(storedDraft ?? task?.currentSubmission?.text ?? "");
  }, [draftKey, task?.currentSubmission?.text]);

  useEffect(() => {
    if (draftKey) {
      window.localStorage.setItem(draftKey, draft);
    }
  }, [draft, draftKey]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!snapshot?.id || snapshot.isDemo) {
      return;
    }

    const supabase = getSupabaseBrowserClient();
    const channel = supabase.channel(`relay-room:${snapshot.id}`, {
      config: {
        presence: {
          key: snapshot.currentUserMemberId ?? snapshot.code,
        },
        private: true,
      },
    });

    channel
      .on("postgres_changes", { event: "*", schema: "public", table: "room_members", filter: `room_id=eq.${snapshot.id}` }, refreshRoom)
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms", filter: `id=eq.${snapshot.id}` }, refreshRoom)
      .on("postgres_changes", { event: "*", schema: "public", table: "games", filter: `room_id=eq.${snapshot.id}` }, refreshRoom)
      .on("postgres_changes", { event: "*", schema: "public", table: "chain_steps" }, refreshRoom)
      .on("postgres_changes", { event: "*", schema: "public", table: "reveal_reactions" }, refreshRoom)
      .on("postgres_changes", { event: "*", schema: "public", table: "replay_favorites" }, refreshRoom)
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refreshRoom, snapshot?.code, snapshot?.currentUserMemberId, snapshot?.id, snapshot?.isDemo]);

  useEffect(() => {
    if (!snapshot?.code || snapshot.isDemo) {
      return;
    }

    const heartbeat = async () => {
      try {
        await postJson(`/api/room/${snapshot.code}/heartbeat`);
      } catch {
        // Best-effort heartbeat only.
      }
    };

    void heartbeat();
    const interval = window.setInterval(() => {
      void heartbeat();
    }, 15000);

    return () => window.clearInterval(interval);
  }, [snapshot?.code, snapshot?.isDemo]);

  const timeRemaining = useMemo(() => {
    if (!snapshot?.game?.phaseEndsAt) {
      return null;
    }

    return Math.max(0, differenceInSeconds(new Date(snapshot.game.phaseEndsAt), now));
  }, [now, snapshot?.game?.phaseEndsAt]);

  const handleApi = async (label: string, action: () => Promise<void>) => {
    try {
      setSubmitting(label);
      await action();
      if (!isDemoRoom) {
        refreshRoom();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setSubmitting(null);
    }
  };

  const handleDemoMutation = (
    label: string,
    updater: (current: RoomViewData) => RoomViewData,
    successMessage?: string,
  ) => {
    setSubmitting(label);
    setData((current) => updater(current));
    if (successMessage) {
      toast.success(successMessage);
    }
    setSubmitting(null);
  };

  const handleCopyCode = async () => {
    if (!snapshot) {
      return;
    }

    await navigator.clipboard.writeText(snapshot.code);
    toast.success("Room code copied.");
  };

  const handleCopyReplay = async () => {
    if (!snapshot?.game?.replaySlug) {
      return;
    }

    await navigator.clipboard.writeText(`${window.location.origin}/replay/${snapshot.game.replaySlug}`);
    toast.success("Replay link copied.");
  };

  if (!snapshot) {
    return (
      <Card className="mx-auto max-w-2xl p-8 text-center">
        <CardTitle>Join the room from Relay first.</CardTitle>
        <CardDescription>
          This room page is membership-aware, so create or join through the play entry to establish your seat.
        </CardDescription>
        <div className="mt-5">
          <Button onClick={() => router.push("/play")}>Go to Play</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="section-grid">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.16fr)_minmax(320px,0.84fr)]">
        <RoomHeader
          snapshot={snapshot}
          timeRemaining={timeRemaining}
          onCopyCode={() => void handleCopyCode()}
          onCopyReplay={() => void handleCopyReplay()}
        />
        <RoomRosterCard
          snapshot={snapshot}
          submitting={submitting}
          onToggleReady={() =>
            isDemoRoom
              ? handleDemoMutation("ready", toggleDemoReady)
              : void handleApi("ready", async () => {
                  await postJson(`/api/room/${snapshot.code}/ready`, {});
                })
          }
          onStart={() =>
            isDemoRoom
              ? handleDemoMutation(
                  "start",
                  (current) => startDemoRoom(current),
                  snapshot.status === "reveal" ? "Demo room reset." : "Demo game launched.",
                )
              : void handleApi("start", async () => {
                  await postJson(`/api/room/${snapshot.code}/start`);
                })
          }
          onQueueNextGame={() =>
            isDemoRoom
              ? handleDemoMutation("queue", toggleDemoQueue)
              : void handleApi("queue", async () => {
                  await postJson(`/api/room/${snapshot.code}/queue`, {});
                })
          }
          onModerate={(memberId, ban) =>
            isDemoRoom
              ? toast.success(ban ? "Demo ban recorded." : "Demo kick recorded.")
              : void handleApi("moderate", async () => {
                  await postJson(`/api/room/${snapshot.code}/moderate`, {
                    memberId,
                    ban,
                    reason: ban ? "Banned by host" : "Removed by host",
                  });
                })
          }
        />
      </section>

      {isDemoRoom ? (
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Badge>Demo / Testing Controls</Badge>
                <Badge>Temporary</Badge>
              </div>
              <CardTitle className="mt-3">Mock the awkward cases without waiting on backend work.</CardTitle>
              <CardDescription className="mt-2">
                These controls only exist in demo mode. Use them to move phases, reset the room,
                and verify reveal or spectator states quickly.
              </CardDescription>
            </div>
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] border border-[color:var(--color-border)] bg-[color:var(--color-bg-main)] text-[color:var(--color-warning)]">
              <TestTube2 className="h-5 w-5" />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              onClick={() =>
                handleDemoMutation("advance-demo", forceAdvanceDemoRoom, "Demo room advanced.")
              }
            >
              <SkipForward className="h-4 w-4" />
              Advance phase
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                handleDemoMutation("reset-demo", resetDemoRoom, "Demo room reset.")
              }
            >
              <RotateCcw className="h-4 w-4" />
              Reset room
            </Button>
          </div>
        </Card>
      ) : null}

      {snapshot.status === "lobby" && settingsDraft ? (
        <RoomLobby
          snapshot={snapshot}
          settingsDraft={settingsDraft}
          setSettingsDraft={setSettingsDraft}
          onSaveSettings={() =>
            isDemoRoom
              ? handleDemoMutation(
                  "settings",
                  (current) => saveDemoSettings(current, settingsDraft),
                  "Demo settings saved.",
                )
              : void handleApi("settings", async () => {
                  await postJson(`/api/room/${snapshot.code}/settings`, settingsDraft);
                })
          }
          submitting={submitting}
        />
      ) : null}

      {snapshot.game && snapshot.game.phase !== "reveal" && snapshot.game.phase !== "summary" ? (
        <RoomActivePhase
          snapshot={snapshot}
          task={task}
          promptLibrary={promptLibrary}
          draft={draft}
          setDraft={setDraft}
          selectedPromptId={selectedPromptId}
          setSelectedPromptId={setSelectedPromptId}
          promptSearch={promptSearch}
          setPromptSearch={setPromptSearch}
          promptDifficulty={promptDifficulty}
          setPromptDifficulty={setPromptDifficulty}
          promptPack={promptPack}
          setPromptPack={setPromptPack}
          onRandomPrompt={() => {
            const randomPrompt =
              promptLibrary[Math.floor(Math.random() * promptLibrary.length)];
            setSelectedPromptId(randomPrompt.id);
            setDraft(randomPrompt.text);
          }}
          onSubmit={() =>
            isDemoRoom
              ? handleDemoMutation("submit", (current) => {
                  if (!snapshot || !task) {
                    return current;
                  }

                  const text =
                    task.expectedStepType === "prompt" && selectedPromptId
                      ? promptLibrary.find((prompt) => prompt.id === selectedPromptId)?.text ?? draft
                      : draft;

                  if (draftKey) {
                    window.localStorage.removeItem(draftKey);
                  }
                  setDraft("");

                  return submitDemoTurn(
                    current,
                    text,
                    selectedPromptId,
                    task.expectedStepType === "prompt" && selectedPromptId
                      ? "library"
                      : "custom",
                  );
                })
              : void handleApi("submit", async () => {
                  if (!snapshot || !task) {
                    return;
                  }

                  const text =
                    task.expectedStepType === "prompt" && selectedPromptId
                      ? promptLibrary.find((prompt) => prompt.id === selectedPromptId)?.text ?? draft
                      : draft;

                  await postJson(`/api/room/${snapshot.code}/submit`, {
                    text,
                    promptRecordId: selectedPromptId,
                    promptSourceType:
                      task.expectedStepType === "prompt" && selectedPromptId
                        ? "library"
                        : "custom",
                  });

                  if (draftKey) {
                    window.localStorage.removeItem(draftKey);
                  }
                  setDraft("");
                })
          }
          submitting={submitting}
        />
      ) : null}

      {snapshot.game && (snapshot.game.phase === "reveal" || snapshot.game.phase === "summary") ? (
        <RoomReveal
          snapshot={snapshot}
          reactionsByStep={data.reactionsByStep}
          favoritesByStep={data.favoritesByStep}
          onReact={(stepId, emoji) =>
            isDemoRoom
              ? handleDemoMutation("react", (current) => reactToDemoStep(current, stepId, emoji))
              : void handleApi("react", async () => {
                  await postJson(`/api/room/${snapshot.code}/react`, { stepId, emoji });
                })
          }
          onFavorite={(chainId, stepId) =>
            isDemoRoom
              ? handleDemoMutation("favorite", (current) => favoriteDemoStep(current, stepId))
              : void handleApi("favorite", async () => {
                  await postJson(`/api/room/${snapshot.code}/favorite`, { chainId, stepId });
                })
          }
          onOpenReplay={() => router.push(`/replay/${snapshot.game?.replaySlug}`)}
        />
      ) : null}

      <RoomReportCard
        reportReason={reportReason}
        setReportReason={setReportReason}
        reportDetails={reportDetails}
        setReportDetails={setReportDetails}
        onTurnstileToken={setTurnstileToken}
        onReport={() =>
          isDemoRoom
            ? handleDemoMutation("report", (current) => current, "Demo report recorded.")
            : void handleApi("report", async () => {
                await postJson(`/api/room/${snapshot.code}/report`, {
                  reason: reportReason,
                  details: reportDetails,
                  turnstileToken,
                });
                setReportReason("");
                setReportDetails("");
              })
        }
        onRefresh={refreshRoom}
        submitting={submitting}
      />
    </div>
  );
}
