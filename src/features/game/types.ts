export const SKILL_MODES = [
  "beginner",
  "intermediate",
  "advanced",
  "chaos",
] as const;

export const RELAY_GAME_MODES = [
  "prompt_code_guess",
  "code_guess_rebuild",
  "broken_code_fix_guess",
  "ui_challenge_recreate_vote",
  "algorithm_prompt_caption",
  "chaos_relay",
] as const;
export const ROUND_PHASES = [
  "lobby",
  "active_round",
  "pass_transition",
  "reveal_theater",
  "scoreboard",
  "post_game_replay",
] as const;
export const STEP_INPUT_TYPES = ["prompt", "code", "text", "vote"] as const;

export const CODE_LANGUAGES = [
  "html_css_js",
  "javascript",
  "python",
  "typescript",
] as const;

export const LANGUAGE_MODES = ["single", "rotate", "random"] as const;
export const GAME_PHASES = [
  "lobby",
  "prompt",
  "code",
  "description",
  "guess",
  "rebuild",
  "fix",
  "caption",
  "vote",
  "reveal",
  "summary",
] as const;
export const STEP_TYPES = [
  "prompt",
  "code",
  "description",
  "guess",
  "rebuild",
  "fix",
  "caption",
  "vote",
] as const;
export const ROOM_VISIBILITIES = ["private", "public"] as const;
export const PROMPT_SOURCE_MODES = ["human", "system"] as const;
export const SCORING_MODES = ["casual", "competitive"] as const;

export type SkillMode = (typeof SKILL_MODES)[number];
export type RelayGameMode = (typeof RELAY_GAME_MODES)[number];
export type RoundPhase = (typeof ROUND_PHASES)[number];
export type StepInputType = (typeof STEP_INPUT_TYPES)[number];
export type CodeLanguage = (typeof CODE_LANGUAGES)[number];
export type LanguageMode = (typeof LANGUAGE_MODES)[number];
export type GamePhase = (typeof GAME_PHASES)[number];
export type StepType = (typeof STEP_TYPES)[number];
export type RoomVisibility = (typeof ROOM_VISIBILITIES)[number];
export type PromptSourceMode = (typeof PROMPT_SOURCE_MODES)[number];
export type ScoringMode = (typeof SCORING_MODES)[number];

export interface RoomExperienceSettings {
  gameMode: RelayGameMode;
  mixedLanguagesAllowed: boolean;
  executionEnabled: boolean;
  liveSpectatorsEnabled: boolean;
  promptSourceMode: PromptSourceMode;
  scoringMode: ScoringMode;
}

export interface PromptRecord {
  id: string;
  text: string;
  category: string;
  difficulty: SkillMode;
  tags: string[];
  languages: CodeLanguage[];
  pack: string;
  packLabel: string;
  packOrder: number;
}

export interface RoomSettings {
  visibility: RoomVisibility;
  playerCap: number;
  roundCount: number;
  skillMode: SkillMode;
  languageMode: LanguageMode;
  languagePool: CodeLanguage[];
  singleLanguage?: CodeLanguage | null;
  profanityFilterEnabled: boolean;
  quickPlayDiscoverable: boolean;
}

export interface Submission {
  id: string;
  chainId: string;
  roundIndex: number;
  stepType: StepType;
  inputType?: StepInputType;
  text: string;
  language: CodeLanguage | null;
  fallback: boolean;
  authorMemberId: string | null;
  createdAt: string;
  stepLabel?: string | null;
  executionResult?: ExecutionResult | null;
}

export type ChainStep = Submission;

export interface SubmissionPayload {
  roomCode: string;
  text: string;
  language?: CodeLanguage | null;
}

export interface ReplayFavorite {
  chainId: string;
  stepId: string;
  profileId: string;
  createdAt: string;
}

export interface PublicRoomSummary {
  id: string;
  code: string;
  visibility: RoomVisibility;
  status: "lobby" | "live" | "reveal";
  hostNickname: string;
  skillMode: SkillMode;
  languageMode: LanguageMode;
  playerCount: number;
  spectatorCount: number;
  seatsOpen: number;
  lastActivityAt: string;
}

export interface SkillModeConfig {
  label: string;
  summary: string;
  timerSeconds: number;
  lineLimit: number;
  charLimit: number;
  defaultLanguages: CodeLanguage[];
}

export interface RoomMemberSnapshot {
  id: string;
  profileId: string;
  nickname: string;
  color?: string;
  avatarGlyph?: string;
  role: "host" | "player" | "spectator";
  seatIndex: number | null;
  ready: boolean;
  connected: boolean;
  queuedForNextGame: boolean;
  joinedAt: string;
  lastSeenAt: string;
  isCurrentUser?: boolean;
}

export interface Chain {
  id: string;
  originMemberId: string;
  originSeatIndex: number;
  promptSourceType: "custom" | "library" | "fallback";
  promptRecordId: string | null;
  steps: ChainStep[];
  revealTitle?: string;
}

export type ChainSnapshot = Chain;

export interface RevealItem {
  chainId: string;
  chainIndex: number;
  stepId: string;
  stepIndex: number;
  step: ChainStep;
  driftScore: number;
}

export interface ScoreEntry {
  memberId: string;
  nickname: string;
  accentColor: string;
  score: number;
  badges: string[];
  details: string[];
}

export type ScoreboardEntry = ScoreEntry;

export interface GameSnapshot {
  id: string;
  phase: GamePhase;
  roundIndex: number;
  totalRounds: number;
  phaseStartedAt: string | null;
  phaseEndsAt: string | null;
  currentCodeLanguage: CodeLanguage | null;
  replaySlug: string | null;
  chains: ChainSnapshot[];
  gameMode?: RelayGameMode;
  roundSequence?: StepType[];
  scoreboard?: ScoreboardEntry[];
}

export interface RoomSnapshot {
  id: string;
  code: string;
  roomName: string;
  status: "lobby" | "live" | "reveal";
  isDemo?: boolean;
  isHost: boolean;
  viewerRole: "host" | "player" | "spectator" | null;
  currentUserMemberId: string | null;
  settings: RoomSettings;
  experience?: RoomExperienceSettings;
  members: RoomMemberSnapshot[];
  game: GameSnapshot | null;
}

export type RuntimeStatus =
  | "idle"
  | "runnable"
  | "running"
  | "success"
  | "runtime_error"
  | "compile_error"
  | "no_runtime";

export type RuntimeState = RuntimeStatus;

export interface RuntimeConsoleEntry {
  id: string;
  level: "log" | "info" | "warn" | "error";
  message: string;
  timestamp: number;
  count: number;
  source?: string | null;
}

export interface RuntimeProblem {
  id: string;
  kind: "compile" | "runtime";
  severity: "warning" | "error";
  message: string;
  line?: number | null;
  column?: number | null;
  source?: string | null;
  stack?: string | null;
  guidance?: string | null;
}

export interface PreviewMetadata {
  sessionKey: string;
  targetFileLabel: string;
  targetLanguage: CodeLanguage | null;
  runtimeLabel: string;
  previewKind: "preview" | "console" | "problems" | "no_runtime";
  resetCount: number;
}

export interface ExecutionResult {
  runtimeStatus: RuntimeStatus;
  targetFileLabel: string;
  targetLanguage: CodeLanguage | null;
  startedAt: number | null;
  finishedAt: number | null;
  runTimestamp: number | null;
  consoleEntries: RuntimeConsoleEntry[];
  diagnostics: RuntimeProblem[];
  runtimeErrors: RuntimeProblem[];
  previewMetadata: PreviewMetadata;
}

export interface ViewerTask {
  chainId: string;
  roundIndex: number;
  expectedStepType: StepType;
  language: CodeLanguage | null;
  previousStep: ChainStep | null;
  currentSubmission: ChainStep | null;
  roundLabel: string;
  taskTitle: string;
  sourceLabel: string;
  sourceHint: string;
  submissionLabel: string;
  submissionPlaceholder: string;
  helperText: string;
  runEnabled: boolean;
  starterTemplate?: string;
}
