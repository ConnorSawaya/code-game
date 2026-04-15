export const SKILL_MODES = [
  "beginner",
  "intermediate",
  "advanced",
  "chaos",
] as const;

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
  "reveal",
  "summary",
] as const;
export const STEP_TYPES = ["prompt", "code", "description"] as const;
export const ROOM_VISIBILITIES = ["private", "public"] as const;

export type SkillMode = (typeof SKILL_MODES)[number];
export type CodeLanguage = (typeof CODE_LANGUAGES)[number];
export type LanguageMode = (typeof LANGUAGE_MODES)[number];
export type GamePhase = (typeof GAME_PHASES)[number];
export type StepType = (typeof STEP_TYPES)[number];
export type RoomVisibility = (typeof ROOM_VISIBILITIES)[number];

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

export interface ChainStep {
  id: string;
  chainId: string;
  roundIndex: number;
  stepType: StepType;
  text: string;
  language: CodeLanguage | null;
  fallback: boolean;
  authorMemberId: string | null;
  createdAt: string;
}

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
  role: "host" | "player" | "spectator";
  seatIndex: number | null;
  ready: boolean;
  connected: boolean;
  queuedForNextGame: boolean;
  joinedAt: string;
  lastSeenAt: string;
  isCurrentUser?: boolean;
}

export interface ChainSnapshot {
  id: string;
  originMemberId: string;
  originSeatIndex: number;
  promptSourceType: "custom" | "library" | "fallback";
  promptRecordId: string | null;
  steps: ChainStep[];
}

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
}

export interface RoomSnapshot {
  id: string;
  code: string;
  roomName: string;
  status: "lobby" | "live" | "reveal";
  isHost: boolean;
  viewerRole: "host" | "player" | "spectator" | null;
  currentUserMemberId: string | null;
  settings: RoomSettings;
  members: RoomMemberSnapshot[];
  game: GameSnapshot | null;
}

export interface ViewerTask {
  chainId: string;
  roundIndex: number;
  expectedStepType: StepType;
  language: CodeLanguage | null;
  previousStep: ChainStep | null;
  currentSubmission: ChainStep | null;
}
