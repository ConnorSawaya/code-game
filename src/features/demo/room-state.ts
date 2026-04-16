import type { RoomViewData } from "@/features/rooms/queries";
import type {
  CodeLanguage,
  RoomMemberSnapshot,
  RoomSettings,
} from "@/features/game/types";
import {
  assignSeatForRound,
  getCodeFallback,
  getCodeRoundLanguage,
  getPhaseForRound,
  getSkillModeConfig,
  getStepTypeForRound,
} from "@/features/game/logic";
import {
  buildDemoChains,
  buildDemoCode,
  buildDemoDescription,
  buildDemoPrompt,
  buildDemoRoomViewData,
  demoNowIso,
  getDemoReplaySlugForRoom,
  getDemoScenarioByCode,
} from "@/features/demo/mock-data";

function cloneDemoData(data: RoomViewData) {
  return JSON.parse(JSON.stringify(data)) as RoomViewData;
}

function getActivePlayers(members: RoomMemberSnapshot[]) {
  return members.filter((member) => member.role !== "spectator");
}

function getCurrentUser(snapshot: RoomViewData["snapshot"]) {
  return snapshot?.members.find((member) => member.isCurrentUser) ?? null;
}

function setPhaseWindow(data: RoomViewData) {
  if (!data.snapshot?.game) {
    return;
  }

  const skill = getSkillModeConfig(data.snapshot.settings.skillMode);
  data.snapshot.game.phaseStartedAt = demoNowIso(-2);
  data.snapshot.game.phaseEndsAt = demoNowIso(skill.timerSeconds);
}

function getCurrentRoundLanguage(data: RoomViewData): CodeLanguage | null {
  if (!data.snapshot?.game) {
    return null;
  }

  const roundIndex = data.snapshot.game.roundIndex;
  if (getStepTypeForRound(roundIndex) !== "code") {
    return null;
  }

  return getCodeRoundLanguage(
    data.snapshot.settings.languageMode,
    data.snapshot.settings.languagePool,
    roundIndex,
    1,
    data.snapshot.settings.singleLanguage,
  );
}

function seedBotsForCurrentRound(data: RoomViewData) {
  if (!data.snapshot?.game) {
    return;
  }

  const currentUser = getCurrentUser(data.snapshot);

  if (!currentUser || currentUser.seatIndex === null || currentUser.role === "spectator") {
    return;
  }

  const activePlayers = getActivePlayers(data.snapshot.members);
  const roundIndex = data.snapshot.game.roundIndex;
  const stepType = getStepTypeForRound(roundIndex);

  for (const chain of data.snapshot.game.chains) {
    const assignedSeat = assignSeatForRound(
      chain.originSeatIndex,
      roundIndex,
      activePlayers.length,
    );
    const assignedMember =
      activePlayers.find((member) => member.seatIndex === assignedSeat) ?? activePlayers[0];

    if (assignedMember.id === currentUser.id) {
      continue;
    }

    if (chain.steps.some((step) => step.roundIndex === roundIndex)) {
      continue;
    }

    const language = stepType === "code" ? data.snapshot.game.currentCodeLanguage : null;
    const text =
      stepType === "prompt"
        ? buildDemoPrompt(chain.originSeatIndex)
        : stepType === "description"
          ? buildDemoDescription(chain.originSeatIndex, roundIndex)
          : buildDemoCode(chain.originSeatIndex, roundIndex, language ?? "javascript");

    chain.steps.push({
      id: `demo-step-${chain.id}-${roundIndex}`,
      chainId: chain.id,
      roundIndex,
      stepType,
      text,
      language,
      fallback: false,
      authorMemberId: assignedMember.id,
      createdAt: demoNowIso(-(24 - roundIndex * 3)),
    });
  }
}

function advanceDemoGame(data: RoomViewData) {
  if (!data.snapshot?.game) {
    return data;
  }

  const roundIndex = data.snapshot.game.roundIndex;
  const roundComplete = data.snapshot.game.chains.every((chain) =>
    chain.steps.some((step) => step.roundIndex === roundIndex),
  );

  if (!roundComplete) {
    return data;
  }

  if (roundIndex >= data.snapshot.game.totalRounds) {
    data.snapshot.status = "reveal";
    data.snapshot.game.phase = "reveal";
    data.snapshot.game.phaseStartedAt = demoNowIso(-8);
    data.snapshot.game.phaseEndsAt = null;
    data.snapshot.game.currentCodeLanguage = null;
    return data;
  }

  data.snapshot.game.roundIndex += 1;
  data.snapshot.game.phase = getPhaseForRound(data.snapshot.game.roundIndex);
  data.snapshot.game.currentCodeLanguage = getCurrentRoundLanguage(data);
  setPhaseWindow(data);
  seedBotsForCurrentRound(data);
  return data;
}

export function startDemoRoom(data: RoomViewData) {
  const next = cloneDemoData(data);

  if (!next.snapshot) {
    return next;
  }

  if (next.snapshot.status === "reveal") {
    return resetDemoRoom(next);
  }

  const currentUser = getCurrentUser(next.snapshot);

  next.snapshot.status = "live";
  next.snapshot.members = next.snapshot.members.map((member) =>
    member.isCurrentUser ? { ...member, ready: true } : member,
  );
  next.snapshot.game = {
    id: `demo-game-${next.snapshot.code}`,
    phase: "prompt",
    roundIndex: 0,
    totalRounds: next.snapshot.settings.roundCount,
    phaseStartedAt: demoNowIso(-4),
    phaseEndsAt: demoNowIso(getSkillModeConfig(next.snapshot.settings.skillMode).timerSeconds),
    currentCodeLanguage: null,
    replaySlug: getDemoReplaySlugForRoom(next.snapshot.code),
    chains: buildDemoChains(
      getDemoScenarioByCode(next.snapshot.code) ?? getDemoScenarioByCode("BOSS1")!,
      next.snapshot.members,
      next.snapshot.settings.roundCount,
    ).map((chain) => ({
      ...chain,
      promptRecordId: null,
      promptSourceType: "custom",
      steps:
        currentUser && chain.originMemberId === currentUser.id
          ? []
          : chain.steps.filter((step) => step.roundIndex === 0),
    })),
  };

  seedBotsForCurrentRound(next);
  return next;
}

export function resetDemoRoom(data: RoomViewData) {
  const currentUser = getCurrentUser(data.snapshot);
  return (
    buildDemoRoomViewData(data.snapshot?.code ?? "BOSS1", currentUser?.nickname ?? "late-night-dev") ??
    data
  );
}

export function toggleDemoReady(data: RoomViewData) {
  const next = cloneDemoData(data);

  if (!next.snapshot) {
    return next;
  }

  next.snapshot.members = next.snapshot.members.map((member) =>
    member.isCurrentUser ? { ...member, ready: !member.ready } : member,
  );

  return next;
}

export function toggleDemoQueue(data: RoomViewData) {
  const next = cloneDemoData(data);

  if (!next.snapshot) {
    return next;
  }

  next.snapshot.members = next.snapshot.members.map((member) =>
    member.isCurrentUser
      ? { ...member, queuedForNextGame: !member.queuedForNextGame }
      : member,
  );

  return next;
}

export function saveDemoSettings(
  data: RoomViewData,
  settings: RoomSettings,
) {
  const next = cloneDemoData(data);

  if (!next.snapshot) {
    return next;
  }

  next.snapshot.settings = settings;
  return next;
}

export function submitDemoTurn(
  data: RoomViewData,
  text: string,
  promptRecordId?: string | null,
  promptSourceType: "custom" | "library" = "custom",
) {
  const next = cloneDemoData(data);

  if (!next.snapshot?.game) {
    return next;
  }

  const currentUser = getCurrentUser(next.snapshot);

  if (!currentUser || currentUser.seatIndex === null || currentUser.role === "spectator") {
    return next;
  }

  const roundIndex = next.snapshot.game.roundIndex;
  const stepType = getStepTypeForRound(roundIndex);
  const activePlayers = getActivePlayers(next.snapshot.members);
  const targetChain =
    roundIndex === 0
      ? next.snapshot.game.chains.find((chain) => chain.originMemberId === currentUser.id)
      : next.snapshot.game.chains.find(
          (chain) =>
            assignSeatForRound(chain.originSeatIndex, roundIndex, activePlayers.length) ===
            currentUser.seatIndex,
        );

  if (!targetChain) {
    return next;
  }

  targetChain.steps = targetChain.steps.filter((step) => step.roundIndex !== roundIndex);
  targetChain.steps.push({
    id: `demo-step-${targetChain.id}-${roundIndex}`,
    chainId: targetChain.id,
    roundIndex,
    stepType,
    text,
    language: stepType === "code" ? next.snapshot.game.currentCodeLanguage : null,
    fallback: false,
    authorMemberId: currentUser.id,
    createdAt: demoNowIso(-1),
  });

  if (roundIndex === 0) {
    targetChain.promptRecordId = promptRecordId ?? null;
    targetChain.promptSourceType = promptSourceType;
  }

  return advanceDemoGame(next);
}

export function forceAdvanceDemoRoom(data: RoomViewData) {
  if (!data.snapshot) {
    return data;
  }

  if (!data.snapshot.game) {
    return startDemoRoom(data);
  }

  if (data.snapshot.game.phase === "reveal") {
    return resetDemoRoom(data);
  }

  const currentStepType = getStepTypeForRound(data.snapshot.game.roundIndex);
  const fallback =
    currentStepType === "description"
      ? "No description submitted."
      : currentStepType === "code"
        ? getCodeFallback(data.snapshot.game.currentCodeLanguage ?? "javascript")
        : buildDemoPrompt(0);

  return submitDemoTurn(data, fallback, null, "custom");
}

export function reactToDemoStep(
  data: RoomViewData,
  stepId: string,
  emoji: string,
) {
  const next = cloneDemoData(data);
  next.reactionsByStep[stepId] ??= {};
  next.reactionsByStep[stepId][emoji] =
    (next.reactionsByStep[stepId][emoji] ?? 0) + 1;
  return next;
}

export function favoriteDemoStep(data: RoomViewData, stepId: string) {
  const next = cloneDemoData(data);
  next.favoritesByStep[stepId] = (next.favoritesByStep[stepId] ?? 0) + 1;
  return next;
}

export function getDemoStorageKey(code: string) {
  return `relay:demo-room:${code.toUpperCase()}`;
}
