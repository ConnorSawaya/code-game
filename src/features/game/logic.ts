import { nanoid } from "nanoid";
import type {
  ChainSnapshot,
  CodeLanguage,
  GamePhase,
  LanguageMode,
  PromptRecord,
  RelayGameMode,
  RoomExperienceSettings,
  RoomSnapshot,
  RoomSettings,
  ScoreboardEntry,
  SkillMode,
  SkillModeConfig,
  StepType,
  ViewerTask,
} from "@/features/game/types";
import {
  DEFAULT_ROOM_EXPERIENCE,
  getDefaultTemplateForStep,
  getRelayModeDefinition,
  getRelayRoundSequence,
} from "@/features/game/modes";
import { clamp } from "@/lib/utils";

export const SKILL_MODE_CONFIG: Record<SkillMode, SkillModeConfig> = {
  beginner: {
    label: "Beginner",
    summary: "Roomy timers, short snippets, low-pressure prompts.",
    timerSeconds: 120,
    lineLimit: 10,
    charLimit: 500,
    defaultLanguages: ["html_css_js", "javascript", "python"],
  },
  intermediate: {
    label: "Intermediate",
    summary: "A little faster, a little sharper, still readable.",
    timerSeconds: 90,
    lineLimit: 14,
    charLimit: 700,
    defaultLanguages: ["html_css_js", "javascript", "python", "typescript"],
  },
  advanced: {
    label: "Advanced",
    summary: "Quick turns with denser snippets and broader language access.",
    timerSeconds: 75,
    lineLimit: 18,
    charLimit: 1000,
    defaultLanguages: ["html_css_js", "javascript", "python", "typescript"],
  },
  chaos: {
    label: "Chaos",
    summary: "Faster clocks, wider pool, delightfully unhinged outcomes.",
    timerSeconds: 60,
    lineLimit: 20,
    charLimit: 1200,
    defaultLanguages: ["html_css_js", "javascript", "python", "typescript"],
  },
};

export const LANGUAGE_LABELS: Record<CodeLanguage, string> = {
  html_css_js: "HTML / CSS / JS",
  javascript: "JavaScript",
  python: "Python",
  typescript: "TypeScript",
};

const PLAYER_ACCENTS = [
  "#58a6ff",
  "#d2a8ff",
  "#3fb950",
  "#ff7b72",
  "#f2cc60",
  "#7ee787",
  "#a5d6ff",
  "#ffa657",
];

export function getSkillModeConfig(skillMode: SkillMode) {
  return SKILL_MODE_CONFIG[skillMode];
}

export function getAllowedLanguagesForSkillMode(skillMode: SkillMode) {
  return [...SKILL_MODE_CONFIG[skillMode].defaultLanguages];
}

export function normalizeLanguageSettings<T extends {
  skillMode: SkillMode;
  languageMode: LanguageMode;
  languagePool: CodeLanguage[];
  singleLanguage?: CodeLanguage | null;
}>(settings: T): T & {
  languagePool: CodeLanguage[];
  singleLanguage: CodeLanguage;
} {
  const allowed = getAllowedLanguagesForSkillMode(settings.skillMode);
  const filteredPool = Array.from(
    new Set(settings.languagePool.filter((language) => allowed.includes(language))),
  );
  const languagePool = filteredPool.length > 0 ? filteredPool : allowed;
  const singleLanguage =
    settings.singleLanguage && languagePool.includes(settings.singleLanguage)
      ? settings.singleLanguage
      : languagePool[0];

  return {
    ...settings,
    languagePool,
    singleLanguage,
  };
}

export function normalizeRoomSettings(settings: RoomSettings): RoomSettings {
  const normalized = normalizeLanguageSettings(settings);

  return {
    ...settings,
    languageMode: normalized.languageMode,
    languagePool: normalized.languagePool,
    singleLanguage: normalized.singleLanguage,
  };
}

export function normalizeRoomExperience(
  experience?: Partial<RoomExperienceSettings> | null,
  settings?: Pick<RoomSettings, "languageMode"> | null,
): RoomExperienceSettings {
  const merged = {
    ...DEFAULT_ROOM_EXPERIENCE,
    ...(experience ?? {}),
  };

  return {
    ...merged,
    mixedLanguagesAllowed:
      experience?.mixedLanguagesAllowed ?? settings?.languageMode !== "single",
  };
}

export function getGameModeLabel(mode: RelayGameMode) {
  return getRelayModeDefinition(mode).label;
}

export function getPlayerAccent(seatIndex: number | null) {
  return PLAYER_ACCENTS[(seatIndex ?? 0) % PLAYER_ACCENTS.length];
}

export function getRoundSequence(
  mode: RelayGameMode,
  roundCount: number,
) {
  return getRelayRoundSequence(mode, roundCount);
}

export function getRoundSequenceForSnapshot(snapshot: RoomSnapshot | null) {
  if (!snapshot?.game) {
    const experience = normalizeRoomExperience(snapshot?.experience, snapshot?.settings);
    return getRoundSequence(experience.gameMode, snapshot?.settings.roundCount ?? 3);
  }

  if (snapshot.game.roundSequence?.length) {
    return snapshot.game.roundSequence;
  }

  const experience = normalizeRoomExperience(snapshot.experience, snapshot.settings);
  return getRoundSequence(experience.gameMode, snapshot.settings.roundCount);
}

export function getStepTypeForRound(
  roundIndex: number,
  roundSequence?: StepType[] | null,
): StepType {
  if (roundSequence?.length) {
    return roundSequence[roundIndex] ?? roundSequence[roundSequence.length - 1] ?? "prompt";
  }

  if (roundIndex === 0) {
    return "prompt";
  }

  return roundIndex % 2 === 1 ? "code" : "description";
}

export function getPhaseForRound(
  roundIndex: number,
  roundSequence?: StepType[] | null,
): GamePhase {
  const stepType = getStepTypeForRound(roundIndex, roundSequence);

  if (stepType === "prompt") {
    return "prompt";
  }

  if (stepType === "description") {
    return "description";
  }

  return stepType;
}

export function isCodeLikeStep(stepType: StepType) {
  return stepType === "code" || stepType === "rebuild" || stepType === "fix";
}

export function isGuessLikeStep(stepType: StepType) {
  return stepType === "guess" || stepType === "description" || stepType === "caption" || stepType === "vote";
}

export function isCodeRound(
  roundIndex: number,
  roundSequence?: StepType[] | null,
) {
  return isCodeLikeStep(getStepTypeForRound(roundIndex, roundSequence));
}

export function getLanguageLabel(language: CodeLanguage | null) {
  return language ? LANGUAGE_LABELS[language] : "Prompt";
}

export function canRunPreviewLanguage(language: CodeLanguage | null) {
  return (
    language === "html_css_js" ||
    language === "javascript" ||
    language === "typescript" ||
    language === "python"
  );
}

export function getStepLabel(stepType: StepType) {
  switch (stepType) {
    case "prompt":
      return "Prompt";
    case "guess":
    case "description":
      return "Guess";
    case "rebuild":
      return "Rebuild";
    case "fix":
      return "Fix";
    case "caption":
      return "Caption";
    case "vote":
      return "Vote";
    case "code":
    default:
      return "Code";
  }
}

export function getRoundLabel(
  roundIndex: number,
  roundSequence?: StepType[] | null,
) {
  if (roundIndex === 0) {
    return "Starter Prompt";
  }

  return `${getStepLabel(getStepTypeForRound(roundIndex, roundSequence))} ${roundIndex}`;
}

export function getStepVerb(stepType: StepType) {
  switch (stepType) {
    case "prompt":
      return "Started by";
    case "guess":
    case "description":
      return "Guessed by";
    case "rebuild":
      return "Rebuilt by";
    case "fix":
      return "Fixed by";
    case "caption":
      return "Captioned by";
    case "vote":
      return "Marked by";
    case "code":
    default:
      return "Written by";
  }
}

export function getStepSourceLabel(stepType: StepType, previousStep: StepType | null) {
  if (stepType === "prompt") {
    return "Chain opener";
  }

  if (isCodeLikeStep(stepType)) {
    return previousStep === "code" || previousStep === "fix" || previousStep === "rebuild"
      ? "Code to transform"
      : "Prompt to build from";
  }

  if (stepType === "vote") {
    return "What just happened";
  }

  return previousStep && isCodeLikeStep(previousStep) ? "Code to read" : "Text to interpret";
}

export function getTaskCopy(
  stepType: StepType,
  language: CodeLanguage | null,
) {
  switch (stepType) {
    case "prompt":
      return {
        taskTitle: "Seed the chain",
        sourceHint: "Start small. Weird is better than huge.",
        submissionLabel: "Starter prompt",
        submissionPlaceholder: "A tiny mechanic, toy, app, or disaster.",
        helperText: "Short prompts travel better and break harder.",
      };
    case "guess":
    case "description":
      return {
        taskTitle: "Guess the intent",
        sourceHint: "Say what it seems to do, not how it does it.",
        submissionLabel: "Guess",
        submissionPlaceholder: "It looks like this is trying to...",
        helperText: "Good guesses are readable, short, and slightly wrong.",
      };
    case "rebuild":
      return {
        taskTitle: "Rebuild from the guess",
        sourceHint: "Treat the previous text like your only spec.",
        submissionLabel: `${getLanguageLabel(language)} rebuild`,
        submissionPlaceholder: getDefaultTemplateForStep(stepType, language),
        helperText: "Recreate the idea fast, not perfectly.",
      };
    case "fix":
      return {
        taskTitle: "Patch the broken snippet",
        sourceHint: "Keep the spirit. Fix the damage.",
        submissionLabel: `${getLanguageLabel(language)} fix`,
        submissionPlaceholder: getDefaultTemplateForStep(stepType, language),
        helperText: "Leave enough weirdness for the next guess to be funny.",
      };
    case "caption":
      return {
        taskTitle: "Caption the result",
        sourceHint: "Give the next dev one strong sentence.",
        submissionLabel: "Caption",
        submissionPlaceholder: "A very serious system that is clearly about to misbehave.",
        helperText: "Write the caption the build deserves, not the one it earned.",
      };
    case "vote":
      return {
        taskTitle: "Mark the cursed part",
        sourceHint: "Call the shot you want the room to notice at reveal.",
        submissionLabel: "Vote note",
        submissionPlaceholder: "Most cursed: the part where it started taunting the user.",
        helperText: "This becomes the final nudge before reveal.",
      };
    case "code":
    default:
      return {
        taskTitle: `${getLanguageLabel(language)} build`,
        sourceHint: "Write one compact step and keep it runnable if you can.",
        submissionLabel: `${getLanguageLabel(language)} code`,
        submissionPlaceholder: getDefaultTemplateForStep(stepType, language),
        helperText: "Readable enough to misread is the sweet spot.",
      };
  }
}

export function countLines(text: string) {
  return text.length === 0 ? 0 : text.split(/\r\n|\r|\n/).length;
}

export function normalizeSubmission(text: string) {
  return text.replace(/\r\n/g, "\n").trimEnd();
}

export function validateSnippet(
  text: string,
  limits: { lineLimit: number; charLimit: number },
) {
  const normalized = normalizeSubmission(text);
  const lineCount = countLines(normalized);
  const charCount = normalized.length;

  return {
    normalized,
    lineCount,
    charCount,
    isValid: lineCount <= limits.lineLimit && charCount <= limits.charLimit,
  };
}

export function getCodeFallback(language: CodeLanguage) {
  switch (language) {
    case "python":
      return "# No code submitted";
    case "html_css_js":
      return "<!-- No code submitted -->";
    case "javascript":
    case "typescript":
    default:
      return "// No code submitted";
  }
}

export function getTextFallback(stepType: StepType) {
  switch (stepType) {
    case "caption":
      return "No caption submitted.";
    case "vote":
      return "No vote note submitted.";
    case "guess":
    case "description":
      return "No guess submitted.";
    case "prompt":
      return "No prompt submitted.";
    default:
      return "No description submitted.";
  }
}

export function assignSeatForRound(
  originSeatIndex: number,
  roundIndex: number,
  playerCount: number,
) {
  return (originSeatIndex + roundIndex) % playerCount;
}

export function getAssignedChainForSeat(
  chains: ChainSnapshot[],
  seatIndex: number,
  roundIndex: number,
  playerCount: number,
) {
  return (
    chains.find(
      (chain) =>
        assignSeatForRound(chain.originSeatIndex, roundIndex, playerCount) ===
        seatIndex,
    ) ?? null
  );
}

export function getCodeRoundLanguage(
  mode: "single" | "rotate" | "random",
  pool: CodeLanguage[],
  roundIndex: number,
  seed = 0,
  singleLanguage?: CodeLanguage | null,
  roundSequence?: StepType[] | null,
) {
  if (mode === "single") {
    return singleLanguage ?? pool[0] ?? "javascript";
  }

  const safeSequence = roundSequence ?? null;
  const codeRoundIndex = safeSequence?.length
    ? Math.max(
        0,
        safeSequence
          .slice(0, roundIndex + 1)
          .filter((stepType) => isCodeLikeStep(stepType)).length - 1,
      )
    : Math.max(0, Math.ceil(roundIndex / 2) - 1);

  if (mode === "rotate") {
    return pool[codeRoundIndex % pool.length] ?? "javascript";
  }

  const safeSeed = seed + codeRoundIndex * 17;
  return pool[safeSeed % pool.length] ?? "javascript";
}

export function getDefaultRoundCount(playerCount: number) {
  return clamp(playerCount - 1, 2, 6);
}

export function buildRoomCode() {
  return nanoid(5).replace(/[^A-Za-z0-9]/g, "X").toUpperCase();
}

export function buildReplaySlug() {
  return nanoid(12);
}

export function pickPromptLibraryFallback(prompts: PromptRecord[]) {
  return (
    prompts[0] ?? {
      id: "fallback-tiny-tool",
      text: "Build a tiny web toy that surprises the user after one click.",
      category: "weird tools",
      difficulty: "beginner" as const,
      tags: ["fallback", "web"],
      languages: ["html_css_js", "javascript"],
      pack: "fallbacks",
      packLabel: "Fallbacks",
      packOrder: 0,
    }
  );
}

function getPromptSourceStep(chain: ChainSnapshot, roundIndex: number) {
  return roundIndex === 0
    ? null
    : (chain.steps.find((step) => step.roundIndex === roundIndex - 1) ?? null);
}

export function deriveViewerTask(snapshot: RoomSnapshot): ViewerTask | null {
  if (!snapshot.game || !snapshot.currentUserMemberId) {
    return null;
  }

  const currentMember = snapshot.members.find(
    (member) => member.id === snapshot.currentUserMemberId,
  );

  if (
    !currentMember ||
    currentMember.seatIndex === null ||
    snapshot.game.phase === "reveal" ||
    snapshot.game.phase === "summary" ||
    snapshot.game.phase === "lobby"
  ) {
    return null;
  }

  const playerCount = snapshot.members.filter((member) =>
    member.role === "host" || member.role === "player",
  ).length;

  if (playerCount === 0) {
    return null;
  }

  const roundSequence = getRoundSequenceForSnapshot(snapshot);
  const roundIndex = snapshot.game.roundIndex;
  const expectedStepType = getStepTypeForRound(roundIndex, roundSequence);
  const targetChain =
    roundIndex === 0
      ? snapshot.game.chains.find(
          (chain) => chain.originMemberId === snapshot.currentUserMemberId,
        )
      : getAssignedChainForSeat(
          snapshot.game.chains,
          currentMember.seatIndex,
          roundIndex,
          playerCount,
        );

  if (!targetChain) {
    return null;
  }

  const previousStep = getPromptSourceStep(targetChain, roundIndex);
  const language = isCodeLikeStep(expectedStepType)
    ? snapshot.game.currentCodeLanguage
    : null;
  const copy = getTaskCopy(expectedStepType, language);
  const experience = normalizeRoomExperience(snapshot.experience, snapshot.settings);

  return {
    chainId: targetChain.id,
    roundIndex,
    expectedStepType,
    language,
    previousStep,
    currentSubmission:
      targetChain.steps.find((step) => step.roundIndex === roundIndex) ?? null,
    roundLabel: getRoundLabel(roundIndex, roundSequence),
    taskTitle: copy.taskTitle,
    sourceLabel: getStepSourceLabel(
      expectedStepType,
      previousStep?.stepType ?? null,
    ),
    sourceHint: copy.sourceHint,
    submissionLabel: copy.submissionLabel,
    submissionPlaceholder: copy.submissionPlaceholder,
    helperText: copy.helperText,
    runEnabled:
      experience.executionEnabled &&
      isCodeLikeStep(expectedStepType) &&
      canRunPreviewLanguage(language),
    starterTemplate: getDefaultTemplateForStep(expectedStepType, language),
  };
}

function tokenize(text: string) {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((token) => token.length > 2),
    ),
  );
}

function keywordOverlapScore(left: string, right: string) {
  const leftTokens = tokenize(left);
  const rightTokens = new Set(tokenize(right));

  if (leftTokens.length === 0 || rightTokens.size === 0) {
    return 0;
  }

  let matches = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) {
      matches += 1;
    }
  }

  return matches / leftTokens.length;
}

export function buildScoreboardEntries(
  snapshot: RoomSnapshot,
  reactionsByStep: Record<string, Record<string, number>>,
  favoritesByStep: Record<string, number>,
): ScoreboardEntry[] {
  const scoringMode =
    normalizeRoomExperience(snapshot.experience, snapshot.settings).scoringMode;
  const reactionWeight = scoringMode === "competitive" ? 2 : 1;
  const favoriteWeight = scoringMode === "competitive" ? 5 : 3;
  const baseCodeScore = scoringMode === "competitive" ? 8 : 5;
  const baseTextScore = scoringMode === "competitive" ? 6 : 4;
  const guessBonus = scoringMode === "competitive" ? 10 : 6;
  const fixBonus = scoringMode === "competitive" ? 8 : 5;
  const baseByMember = new Map<string, ScoreboardEntry>();
  const members = snapshot.members.filter((member) => member.role !== "spectator");

  for (const member of members) {
    baseByMember.set(member.id, {
      memberId: member.id,
      nickname: member.nickname,
      accentColor: member.color ?? getPlayerAccent(member.seatIndex),
      score: 0,
      badges: [],
      details: [],
    });
  }

  for (const chain of snapshot.game?.chains ?? []) {
    const starter = chain.steps[0]?.text ?? "";

    for (const step of chain.steps) {
      if (!step.authorMemberId) {
        continue;
      }

      const entry = baseByMember.get(step.authorMemberId);
      if (!entry) {
        continue;
      }

      const reactions = Object.values(reactionsByStep[step.id] ?? {}).reduce(
        (sum, count) => sum + count,
        0,
      );
      const favorites = favoritesByStep[step.id] ?? 0;
      const overlap = starter ? keywordOverlapScore(starter, step.text) : 0;

      entry.score += step.fallback ? 0 : isCodeLikeStep(step.stepType) ? baseCodeScore : baseTextScore;
      entry.score += reactions * reactionWeight;
      entry.score += favorites * favoriteWeight;

      if ((step.stepType === "guess" || step.stepType === "description") && overlap >= 0.34) {
        entry.score += guessBonus;
        entry.details.push(`Good read on chain ${chain.originSeatIndex + 1}`);
      }

      if (step.stepType === "fix" && !step.fallback) {
        entry.score += fixBonus;
        entry.details.push(`Patch bonus on chain ${chain.originSeatIndex + 1}`);
      }

      if (reactions >= 3 || favorites >= 1) {
        entry.details.push(`Room popped for step ${getRoundLabel(step.roundIndex, snapshot.game?.roundSequence)}`);
      }
    }
  }

  const entries = [...baseByMember.values()]
    .map((entry) => ({
      ...entry,
      badges: [
        ...(entry.details.some((detail) => detail.startsWith("Good read")) ? ["sharp guess"] : []),
        ...(entry.details.some((detail) => detail.startsWith("Patch bonus")) ? ["fix bonus"] : []),
        ...(entry.details.some((detail) => detail.startsWith("Room popped")) ? ["crowd favorite"] : []),
      ],
      details: entry.details.slice(0, 3),
    }))
    .sort((left, right) => right.score - left.score || left.nickname.localeCompare(right.nickname));

  return entries;
}
