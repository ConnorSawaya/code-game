import type {
  CodeLanguage,
  RelayGameMode,
  RoomExperienceSettings,
  StepInputType,
  StepType,
} from "@/features/game/types";

export interface RelayModeDefinition {
  id: RelayGameMode;
  label: string;
  shortLabel: string;
  description: string;
  lobbyHint: string;
  starterKind: "human_prompt" | "system_prompt";
  minimumRounds: number;
  roundCycle: StepType[];
  inputByStep: Record<StepType, StepInputType>;
  revealHeading: string;
  scoringRules: string[];
}

export const DEFAULT_ROOM_EXPERIENCE: RoomExperienceSettings = {
  gameMode: "prompt_code_guess",
  mixedLanguagesAllowed: false,
  executionEnabled: true,
  liveSpectatorsEnabled: true,
  promptSourceMode: "human",
  scoringMode: "casual",
};

export const RELAY_MODE_DEFINITIONS: Record<RelayGameMode, RelayModeDefinition> = {
  prompt_code_guess: {
    id: "prompt_code_guess",
    label: "Prompt -> Code -> Guess",
    shortLabel: "Prompt chain",
    description: "Start from a prompt, code it fast, then let the next dev guess what they think happened.",
    lobbyHint: "Classic Relay. Great when you want the cleanest Gartic Phone rhythm.",
    starterKind: "human_prompt",
    minimumRounds: 2,
    roundCycle: ["code", "guess"],
    inputByStep: {
      prompt: "prompt",
      code: "code",
      description: "text",
      guess: "text",
      rebuild: "code",
      fix: "code",
      caption: "text",
      vote: "vote",
    },
    revealHeading: "Watch the prompt turn into a probably-wrong guess.",
    scoringRules: ["good guess", "crowd favorite", "kept it runnable"],
  },
  code_guess_rebuild: {
    id: "code_guess_rebuild",
    label: "Code -> Guess -> Rebuild",
    shortLabel: "Rebuild",
    description: "A prompt becomes code, then a guess, then a rebuild from that guess.",
    lobbyHint: "Best when the room wants to watch intent drift and then get rebuilt badly.",
    starterKind: "human_prompt",
    minimumRounds: 3,
    roundCycle: ["code", "guess", "rebuild"],
    inputByStep: {
      prompt: "prompt",
      code: "code",
      description: "text",
      guess: "text",
      rebuild: "code",
      fix: "code",
      caption: "text",
      vote: "vote",
    },
    revealHeading: "The room guesses first, then rebuilds from the guess.",
    scoringRules: ["close rebuild", "good guess", "funniest drift"],
  },
  broken_code_fix_guess: {
    id: "broken_code_fix_guess",
    label: "Broken Code -> Fix -> Guess",
    shortLabel: "Fix it",
    description: "A cursed snippet lands first. Someone patches it. The next dev tries to explain the original plan.",
    lobbyHint: "Good for rooms that like debugging more than dignity.",
    starterKind: "human_prompt",
    minimumRounds: 3,
    roundCycle: ["code", "fix", "guess"],
    inputByStep: {
      prompt: "prompt",
      code: "code",
      description: "text",
      guess: "text",
      rebuild: "code",
      fix: "code",
      caption: "text",
      vote: "vote",
    },
    revealHeading: "Bad code goes in. A patch and a guess come back out.",
    scoringRules: ["fix bonus", "good guess", "kept the spirit"],
  },
  ui_challenge_recreate_vote: {
    id: "ui_challenge_recreate_vote",
    label: "UI Challenge -> Recreate -> Vote",
    shortLabel: "UI relay",
    description: "A tiny UI idea gets recreated fast, then the next step captions what the room should vote on.",
    lobbyHint: "Best with HTML / CSS / JS on and preview enabled.",
    starterKind: "human_prompt",
    minimumRounds: 2,
    roundCycle: ["rebuild", "vote"],
    inputByStep: {
      prompt: "prompt",
      code: "code",
      description: "text",
      guess: "text",
      rebuild: "code",
      fix: "code",
      caption: "text",
      vote: "vote",
    },
    revealHeading: "The room recreates the UI and calls the winning moment.",
    scoringRules: ["closest recreation", "most cursed UI", "crowd favorite"],
  },
  algorithm_prompt_caption: {
    id: "algorithm_prompt_caption",
    label: "Algorithm Prompt -> Implement -> Caption",
    shortLabel: "Algorithm",
    description: "Turn a small algorithm idea into code, then hand off a caption that frames what it became.",
    lobbyHint: "Useful when the room wants slightly more serious coding before it breaks.",
    starterKind: "human_prompt",
    minimumRounds: 2,
    roundCycle: ["code", "caption"],
    inputByStep: {
      prompt: "prompt",
      code: "code",
      description: "text",
      guess: "text",
      rebuild: "code",
      fix: "code",
      caption: "text",
      vote: "vote",
    },
    revealHeading: "A tiny algorithm turns into code, then into a one-line caption.",
    scoringRules: ["clean implementation", "sharp caption", "crowd favorite"],
  },
  chaos_relay: {
    id: "chaos_relay",
    label: "Chaos mode",
    shortLabel: "Chaos",
    description: "Alternates through guesses, rebuilds, fixes, captions, and other bad decisions.",
    lobbyHint: "The safe choice if the room wants maximum drift.",
    starterKind: "human_prompt",
    minimumRounds: 2,
    roundCycle: ["code", "guess", "rebuild", "caption", "fix"],
    inputByStep: {
      prompt: "prompt",
      code: "code",
      description: "text",
      guess: "text",
      rebuild: "code",
      fix: "code",
      caption: "text",
      vote: "vote",
    },
    revealHeading: "Every handoff makes the next one less trustworthy.",
    scoringRules: ["funniest fail", "sharpest recovery", "crowd favorite"],
  },
};

export function getRelayModeDefinition(mode: RelayGameMode) {
  return RELAY_MODE_DEFINITIONS[mode];
}

export function getRelayRoundSequence(
  mode: RelayGameMode,
  roundCount: number,
): StepType[] {
  const definition = getRelayModeDefinition(mode);
  const desiredRounds = Math.max(definition.minimumRounds, roundCount);
  const steps: StepType[] = ["prompt"];

  for (let index = 0; index < desiredRounds; index += 1) {
    steps.push(definition.roundCycle[index % definition.roundCycle.length]);
  }

  return steps;
}

export function getDefaultTemplateForStep(
  stepType: StepType,
  language: CodeLanguage | null,
) {
  if (stepType === "prompt") {
    return "Tiny mechanic, tiny app, or tiny disaster.";
  }

  if (stepType === "guess") {
    return "What do you think this is trying to do?";
  }

  if (stepType === "caption") {
    return "Give the next dev a short caption to work from.";
  }

  if (stepType === "vote") {
    return "Call out what should win, fail, or get dragged at reveal.";
  }

  if (stepType === "fix") {
    switch (language) {
      case "python":
        return "# Patch the broken behavior\nprint('fixed')";
      case "html_css_js":
        return "<!-- Patch the UI and make it work again -->";
      case "typescript":
        return "export function patchBug() {\n  return 'fixed';\n}";
      case "javascript":
      default:
        return "export function patchBug() {\n  return 'fixed';\n}";
    }
  }

  if (stepType === "rebuild") {
    switch (language) {
      case "python":
        return "def rebuild_from_guess():\n    return 'rebuilt'";
      case "html_css_js":
        return "<section>\n  <h1>Rebuild the idea</h1>\n</section>";
      case "typescript":
        return "type RebuildState = 'draft' | 'done';\n\nconst state: RebuildState = 'draft';";
      case "javascript":
      default:
        return "const rebuild = () => ({ status: 'draft' });";
    }
  }

  switch (language) {
    case "python":
      return "print('hello from relay')";
    case "html_css_js":
      return "<button id=\"go\">Run</button>\n<script>\n  go.onclick = () => console.log('relay');\n</script>";
    case "typescript":
      return "const message: string = 'relay';\nconsole.log(message);";
    case "javascript":
    default:
      return "const message = 'relay';\nconsole.log(message);";
  }
}
