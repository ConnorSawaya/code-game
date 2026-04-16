import { nanoid } from "nanoid";
import type {
  ChainSnapshot,
  CodeLanguage,
  GamePhase,
  LanguageMode,
  PromptRecord,
  RoomSnapshot,
  RoomSettings,
  SkillMode,
  SkillModeConfig,
  StepType,
  ViewerTask,
} from "@/features/game/types";
import { clamp, toTitleCase } from "@/lib/utils";

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

export function getStepTypeForRound(roundIndex: number): StepType {
  if (roundIndex === 0) {
    return "prompt";
  }

  return roundIndex % 2 === 1 ? "code" : "description";
}

export function getPhaseForRound(roundIndex: number): GamePhase {
  const stepType = getStepTypeForRound(roundIndex);

  if (stepType === "prompt") {
    return "prompt";
  }

  return stepType;
}

export function isCodeRound(roundIndex: number) {
  return getStepTypeForRound(roundIndex) === "code";
}

export function getLanguageLabel(language: CodeLanguage | null) {
  return language ? LANGUAGE_LABELS[language] : "Prompt";
}

export function canRunPreviewLanguage(language: CodeLanguage | null) {
  return language === "html_css_js" || language === "javascript";
}

export function getRoundLabel(roundIndex: number) {
  if (roundIndex === 0) {
    return "Starter Prompt";
  }

  return `${toTitleCase(getStepTypeForRound(roundIndex))} ${roundIndex}`;
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
) {
  if (mode === "single") {
    return singleLanguage ?? pool[0] ?? "javascript";
  }

  const codeRoundIndex = Math.max(0, Math.ceil(roundIndex / 2) - 1);

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

  const roundIndex = snapshot.game.roundIndex;

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

  return {
    chainId: targetChain.id,
    roundIndex,
    expectedStepType: getStepTypeForRound(roundIndex),
    language:
      getStepTypeForRound(roundIndex) === "code"
        ? snapshot.game.currentCodeLanguage
        : null,
    previousStep:
      roundIndex === 0
        ? null
        : (targetChain.steps.find((step) => step.roundIndex === roundIndex - 1) ??
          null),
    currentSubmission:
      targetChain.steps.find((step) => step.roundIndex === roundIndex) ?? null,
  };
}
