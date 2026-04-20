import type { RoomViewData } from "@/features/rooms/queries";
import type {
  CodeLanguage,
  RoomExperienceSettings,
  RoomMemberSnapshot,
  RoomSettings,
  StepType,
} from "@/features/game/types";
import {
  assignSeatForRound,
  buildScoreboardEntries,
  getCodeFallback,
  getCodeRoundLanguage,
  getPhaseForRound,
  getRoundLabel,
  getRoundSequence,
  getSkillModeConfig,
  getStepTypeForRound,
  getTextFallback,
  isCodeLikeStep,
  normalizeRoomExperience,
  normalizeRoomSettings,
} from "@/features/game/logic";
import {
  buildDemoCaption,
  buildDemoChains,
  buildDemoCode,
  buildDemoGuess,
  buildDemoLobbyRoomViewData,
  buildDemoPrompt,
  buildDemoRoomViewData,
  buildDemoVoteNote,
  demoNowIso,
  getDemoReplaySlugForRoom,
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

function getRoundSequenceFromData(data: RoomViewData) {
  if (!data.snapshot) {
    return ["prompt", "code", "guess"] satisfies StepType[];
  }

  if (data.snapshot.game?.roundSequence?.length) {
    return data.snapshot.game.roundSequence;
  }

  const experience = normalizeRoomExperience(
    data.snapshot.experience,
    data.snapshot.settings,
  );
  return getRoundSequence(experience.gameMode, data.snapshot.settings.roundCount);
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

  const roundSequence = getRoundSequenceFromData(data);
  const roundIndex = data.snapshot.game.roundIndex;

  if (!isCodeLikeStep(getStepTypeForRound(roundIndex, roundSequence))) {
    return null;
  }

  return getCodeRoundLanguage(
    data.snapshot.settings.languageMode,
    data.snapshot.settings.languagePool,
    roundIndex,
    1,
    data.snapshot.settings.singleLanguage,
    roundSequence,
  );
}

function buildBotStepText(
  stepType: StepType,
  originSeatIndex: number,
  roundIndex: number,
  language: CodeLanguage | null,
) {
  switch (stepType) {
    case "prompt":
      return buildDemoPrompt(originSeatIndex);
    case "guess":
    case "description":
      return buildDemoGuess(originSeatIndex, roundIndex);
    case "caption":
      return buildDemoCaption(originSeatIndex, roundIndex);
    case "vote":
      return buildDemoVoteNote(originSeatIndex, roundIndex);
    case "fix":
      return buildDemoCode(originSeatIndex, roundIndex, language ?? "javascript", "fix");
    case "rebuild":
      return buildDemoCode(originSeatIndex, roundIndex, language ?? "javascript", "rebuild");
    case "code":
    default:
      return buildDemoCode(originSeatIndex, roundIndex, language ?? "javascript", "code");
  }
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
  const roundSequence = getRoundSequenceFromData(data);
  const roundIndex = data.snapshot.game.roundIndex;
  const stepType = getStepTypeForRound(roundIndex, roundSequence);

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

    const language = isCodeLikeStep(stepType)
      ? data.snapshot.game.currentCodeLanguage
      : null;

    chain.steps.push({
      id: `demo-step-${chain.id}-${roundIndex}`,
      chainId: chain.id,
      roundIndex,
      stepType,
      text: buildBotStepText(stepType, chain.originSeatIndex, roundIndex, language),
      language,
      fallback: false,
      authorMemberId: assignedMember.id,
      createdAt: demoNowIso(-(24 - roundIndex * 3)),
      stepLabel: chain.steps.find((step) => step.roundIndex === roundIndex)?.stepLabel ?? null,
    });
  }
}

function finalizeReveal(data: RoomViewData) {
  if (!data.snapshot?.game || !data.snapshot) {
    return data;
  }

  data.snapshot.status = "reveal";
  data.snapshot.game.phase = "reveal";
  data.snapshot.game.phaseStartedAt = demoNowIso(-8);
  data.snapshot.game.phaseEndsAt = null;
  data.snapshot.game.currentCodeLanguage = null;
  data.snapshot.game.scoreboard = buildScoreboardEntries(
    data.snapshot,
    data.reactionsByStep,
    data.favoritesByStep,
  );
  return data;
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
    return finalizeReveal(data);
  }

  const roundSequence = getRoundSequenceFromData(data);
  data.snapshot.game.roundIndex += 1;
  data.snapshot.game.phase = getPhaseForRound(
    data.snapshot.game.roundIndex,
    roundSequence,
  );
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
  const experience = normalizeRoomExperience(
    next.snapshot.experience,
    next.snapshot.settings,
  );
  const roundSequence = getRoundSequence(
    experience.gameMode,
    next.snapshot.settings.roundCount,
  );
  const initialRoundIndex = experience.promptSourceMode === "system" ? 1 : 0;

  next.snapshot.status = "live";
  next.snapshot.members = next.snapshot.members.map((member) =>
    member.isCurrentUser ? { ...member, ready: true } : member,
  );
  next.snapshot.game = {
    id: `demo-game-${next.snapshot.code}`,
    phase: getPhaseForRound(initialRoundIndex, roundSequence),
    roundIndex: initialRoundIndex,
    totalRounds: roundSequence.length - 1,
    phaseStartedAt: demoNowIso(-4),
    phaseEndsAt: demoNowIso(getSkillModeConfig(next.snapshot.settings.skillMode).timerSeconds),
    currentCodeLanguage: null,
    replaySlug: getDemoReplaySlugForRoom(next.snapshot.code),
    chains: buildDemoChains(
      next.snapshot.code,
      next.snapshot.settings,
      experience,
      next.snapshot.members,
      next.snapshot.settings.roundCount,
    ).map((chain) => ({
      ...chain,
      promptRecordId: null,
      promptSourceType:
        experience.promptSourceMode === "system" ? "fallback" : "custom",
      steps:
        experience.promptSourceMode === "system"
          ? chain.steps.filter((step) => step.roundIndex < initialRoundIndex)
          : currentUser && chain.originMemberId === currentUser.id
            ? []
            : chain.steps.filter((step) => step.roundIndex === 0),
    })),
    gameMode: experience.gameMode,
    roundSequence,
  };

  next.snapshot.game.currentCodeLanguage = getCurrentRoundLanguage(next);
  seedBotsForCurrentRound(next);
  return next;
}

export function resetDemoRoom(data: RoomViewData) {
  const currentUser = getCurrentUser(data.snapshot);
  const snapshot = data.snapshot;

  if (!snapshot) {
    return (
      buildDemoRoomViewData("BOSS1", currentUser?.nickname ?? "late-night-dev") ?? data
    );
  }

  return (
    buildDemoLobbyRoomViewData(snapshot.code, currentUser?.nickname ?? "late-night-dev", {
      roomName: snapshot.roomName,
      settings: normalizeRoomSettings(snapshot.settings),
      experience: normalizeRoomExperience(snapshot.experience, snapshot.settings),
    }) ?? data
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

  next.snapshot.settings = normalizeRoomSettings(settings);
  return next;
}

export function saveDemoExperience(
  data: RoomViewData,
  experience: RoomExperienceSettings,
) {
  const next = cloneDemoData(data);

  if (!next.snapshot) {
    return next;
  }

  next.snapshot.experience = normalizeRoomExperience(experience, next.snapshot.settings);
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

  const roundSequence = getRoundSequenceFromData(next);
  const roundIndex = next.snapshot.game.roundIndex;
  const stepType = getStepTypeForRound(roundIndex, roundSequence);
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
    language: isCodeLikeStep(stepType) ? next.snapshot.game.currentCodeLanguage : null,
    fallback: false,
    authorMemberId: currentUser.id,
    createdAt: demoNowIso(-1),
    stepLabel: getRoundLabel(roundIndex, roundSequence),
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

  const roundSequence = getRoundSequenceFromData(data);
  const currentStepType = getStepTypeForRound(
    data.snapshot.game.roundIndex,
    roundSequence,
  );
  const fallback = isCodeLikeStep(currentStepType)
    ? getCodeFallback(data.snapshot.game.currentCodeLanguage ?? "javascript")
    : currentStepType === "prompt"
      ? buildDemoPrompt(0)
      : getTextFallback(currentStepType);

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

  if (next.snapshot?.game?.phase === "reveal" || next.snapshot?.game?.phase === "summary") {
    next.snapshot.game.scoreboard = buildScoreboardEntries(
      next.snapshot,
      next.reactionsByStep,
      next.favoritesByStep,
    );
  }

  return next;
}

export function favoriteDemoStep(data: RoomViewData, stepId: string) {
  const next = cloneDemoData(data);
  next.favoritesByStep[stepId] = (next.favoritesByStep[stepId] ?? 0) + 1;

  if (next.snapshot?.game?.phase === "reveal" || next.snapshot?.game?.phase === "summary") {
    next.snapshot.game.scoreboard = buildScoreboardEntries(
      next.snapshot,
      next.reactionsByStep,
      next.favoritesByStep,
    );
  }

  return next;
}

export function getDemoStorageKey(code: string) {
  return `relay:demo-room:${code.toUpperCase()}`;
}
