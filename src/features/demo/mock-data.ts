import type {
  ChainSnapshot,
  ChainStep,
  CodeLanguage,
  PublicRoomSummary,
  RoomExperienceSettings,
  RoomMemberSnapshot,
  RoomSettings,
  RoomSnapshot,
  SkillMode,
} from "@/features/game/types";
import {
  assignSeatForRound,
  buildScoreboardEntries,
  getCodeRoundLanguage,
  getPhaseForRound,
  getPlayerAccent,
  getRoundLabel,
  getRoundSequence,
  getStepTypeForRound,
  isCodeLikeStep,
  normalizeRoomExperience,
  normalizeRoomSettings,
} from "@/features/game/logic";
import type { RoomViewData } from "@/features/rooms/queries";
import type { ReplaySnapshot } from "@/features/replays/snapshot";
import { DEMO_REPLAY_SLUGS, DEMO_ROOM_CODES, isDemoReplaySlug, isDemoRoomCode } from "@/features/demo/shared";

type DemoScenario = {
  code: (typeof DEMO_ROOM_CODES)[number];
  roomName: string;
  skillMode: SkillMode;
  visibility: "private" | "public";
  status: RoomSnapshot["status"];
  languageMode: RoomSettings["languageMode"];
  languagePool: RoomSettings["languagePool"];
  singleLanguage?: CodeLanguage | null;
  roundCount: number;
  playerCap: number;
  quickPlayDiscoverable: boolean;
  promptMood: string;
  joinMode: "host" | "spectator";
  demoReplaySlug: (typeof DEMO_REPLAY_SLUGS)[number];
  experience: Partial<RoomExperienceSettings>;
};

type DemoRoomOverrides = {
  roomName?: string;
  status?: RoomSnapshot["status"];
  joinMode?: DemoScenario["joinMode"];
  settings?: RoomSettings;
  experience?: RoomExperienceSettings;
};

const demoScenarios: Record<(typeof DEMO_ROOM_CODES)[number], DemoScenario> = {
  BOSS1: {
    code: "BOSS1",
    roomName: "boss-fight-jam",
    skillMode: "intermediate",
    visibility: "private",
    status: "lobby",
    languageMode: "rotate",
    languagePool: ["typescript", "javascript", "html_css_js"],
    singleLanguage: null,
    roundCount: 4,
    playerCap: 6,
    quickPlayDiscoverable: false,
    promptMood: "boss fight",
    joinMode: "host",
    demoReplaySlug: "demo-boss1",
    experience: {
      gameMode: "prompt_code_guess",
      mixedLanguagesAllowed: true,
      executionEnabled: true,
      liveSpectatorsEnabled: true,
      promptSourceMode: "human",
      scoringMode: "casual",
    },
  },
  SHDR5: {
    code: "SHDR5",
    roomName: "shader-chaos",
    skillMode: "advanced",
    visibility: "public",
    status: "live",
    languageMode: "single",
    languagePool: ["typescript"],
    singleLanguage: "typescript",
    roundCount: 4,
    playerCap: 8,
    quickPlayDiscoverable: true,
    promptMood: "shader jam",
    joinMode: "spectator",
    demoReplaySlug: "demo-boss1",
    experience: {
      gameMode: "ui_challenge_recreate_vote",
      mixedLanguagesAllowed: false,
      executionEnabled: true,
      liveSpectatorsEnabled: true,
      promptSourceMode: "system",
      scoringMode: "competitive",
    },
  },
  LATE2: {
    code: "LATE2",
    roomName: "late-night-refactor",
    skillMode: "beginner",
    visibility: "public",
    status: "lobby",
    languageMode: "single",
    languagePool: ["javascript"],
    singleLanguage: "javascript",
    roundCount: 3,
    playerCap: 5,
    quickPlayDiscoverable: true,
    promptMood: "late night tools",
    joinMode: "host",
    demoReplaySlug: "demo-boss1",
    experience: {
      gameMode: "algorithm_prompt_caption",
      mixedLanguagesAllowed: false,
      executionEnabled: true,
      liveSpectatorsEnabled: false,
      promptSourceMode: "human",
      scoringMode: "casual",
    },
  },
  CURSD: {
    code: "CURSD",
    roomName: "cursed-platformer",
    skillMode: "chaos",
    visibility: "public",
    status: "reveal",
    languageMode: "random",
    languagePool: ["html_css_js", "javascript", "python", "typescript"],
    singleLanguage: null,
    roundCount: 4,
    playerCap: 8,
    quickPlayDiscoverable: true,
    promptMood: "cursed platformer",
    joinMode: "spectator",
    demoReplaySlug: "demo-cursd",
    experience: {
      gameMode: "chaos_relay",
      mixedLanguagesAllowed: true,
      executionEnabled: true,
      liveSpectatorsEnabled: true,
      promptSourceMode: "human",
      scoringMode: "competitive",
    },
  },
};

const playerNames = ["shader-goblin", "byte-scout", "moss-loop", "null-jester"];
const promptSeeds = [
  "A button that gets more dramatic every click.",
  "A tiny shader toy that wobbles when you move the mouse.",
  "A scoreboard that celebrates every tiny win too hard.",
  "A platformer jump that gets nervous if you stop moving.",
];

export function demoNowIso(offsetSeconds = 0) {
  return new Date(Date.now() + offsetSeconds * 1000).toISOString();
}

function buildSettings(scenario: DemoScenario): RoomSettings {
  return normalizeRoomSettings({
    visibility: scenario.visibility,
    playerCap: scenario.playerCap,
    roundCount: scenario.roundCount,
    skillMode: scenario.skillMode,
    languageMode: scenario.languageMode,
    languagePool: scenario.languagePool,
    singleLanguage: scenario.singleLanguage,
    profanityFilterEnabled: true,
    quickPlayDiscoverable: scenario.quickPlayDiscoverable,
  });
}

function buildExperience(scenario: DemoScenario): RoomExperienceSettings {
  return normalizeRoomExperience(scenario.experience, {
    languageMode: scenario.languageMode,
  });
}

function buildMembers(
  scenario: DemoScenario,
  nickname: string,
): RoomMemberSnapshot[] {
  if (scenario.joinMode === "spectator") {
    return [
      {
        id: `demo-member-${scenario.code}-viewer`,
        profileId: `demo-profile-${scenario.code}-viewer`,
        nickname,
        color: getPlayerAccent(4),
        avatarGlyph: "Z",
        role: "spectator",
        seatIndex: null,
        ready: false,
        connected: true,
        queuedForNextGame: false,
        joinedAt: demoNowIso(-120),
        lastSeenAt: demoNowIso(-8),
        isCurrentUser: true,
      },
      ...playerNames.map((playerName, index) => ({
        id: `demo-member-${scenario.code}-${index}`,
        profileId: `demo-profile-${scenario.code}-${index}`,
        nickname: playerName,
        color: getPlayerAccent(index),
        avatarGlyph: playerName[0]?.toUpperCase() ?? "R",
        role: (index === 0 ? "host" : "player") as "host" | "player",
        seatIndex: index,
        ready: true,
        connected: true,
        queuedForNextGame: false,
        joinedAt: demoNowIso(-600 + index * 60),
        lastSeenAt: demoNowIso(-5),
        isCurrentUser: false,
      })),
    ];
  }

  return [
    {
      id: `demo-member-${scenario.code}-viewer`,
      profileId: `demo-profile-${scenario.code}-viewer`,
      nickname,
      color: getPlayerAccent(0),
      avatarGlyph: nickname[0]?.toUpperCase() ?? "R",
      role: "host",
      seatIndex: 0,
      ready: false,
      connected: true,
      queuedForNextGame: false,
      joinedAt: demoNowIso(-90),
      lastSeenAt: demoNowIso(-4),
      isCurrentUser: true,
    },
    ...playerNames.slice(0, 3).map((playerName, index) => ({
      id: `demo-member-${scenario.code}-${index + 1}`,
      profileId: `demo-profile-${scenario.code}-${index + 1}`,
      nickname: playerName,
      color: getPlayerAccent(index + 1),
      avatarGlyph: playerName[0]?.toUpperCase() ?? "R",
      role: "player" as const,
      seatIndex: index + 1,
      ready: true,
      connected: true,
      queuedForNextGame: false,
      joinedAt: demoNowIso(-400 + index * 60),
      lastSeenAt: demoNowIso(-4),
      isCurrentUser: false,
    })),
  ];
}

export function buildDemoPrompt(originSeatIndex: number) {
  return promptSeeds[originSeatIndex % promptSeeds.length];
}

export function buildDemoGuess(originSeatIndex: number, roundIndex: number) {
  const phrases = [
    "It looks like a tiny system that gets louder every time you touch it.",
    "Feels like UI logic that rewards movement and punishes hesitation.",
    "Probably a toy that escalates once the player stops behaving.",
    "Reads like a jam prototype that keeps exaggerating the feedback loop.",
  ];

  return phrases[(originSeatIndex + roundIndex) % phrases.length];
}

export function buildDemoCaption(originSeatIndex: number, roundIndex: number) {
  const phrases = [
    "A very normal feature that definitely should not taunt the player.",
    "Small mechanic, huge overreaction.",
    "Someone turned a tiny interaction into a full event.",
    "This build keeps making the situation worse in the funniest possible way.",
  ];

  return phrases[(originSeatIndex + roundIndex) % phrases.length];
}

export function buildDemoVoteNote(originSeatIndex: number, roundIndex: number) {
  const phrases = [
    "Most cursed: the part where the UI got way too confident.",
    "Vote for the version that escalated the fastest.",
    "Best bit is when the mechanic starts acting offended.",
    "This is where the room fully lost the original plot.",
  ];

  return phrases[(originSeatIndex + roundIndex) % phrases.length];
}

export function buildDemoCode(
  originSeatIndex: number,
  roundIndex: number,
  language: CodeLanguage,
  stepType: "code" | "rebuild" | "fix" = "code",
) {
  const actor = ["boss", "shader", "announcer", "runner"][originSeatIndex % 4];
  const signal = ["panic", "glow", "combo", "wobble"][(originSeatIndex + roundIndex) % 4];
  const action =
    stepType === "fix"
      ? "patch"
      : stepType === "rebuild"
        ? "rebuild"
        : "start";

  switch (language) {
    case "typescript":
      return `type ${actor[0].toUpperCase()}${actor.slice(1)}State = "idle" | "${signal}" | "overdrive";

const nextState: ${actor[0].toUpperCase()}${actor.slice(1)}State =
  pressure > 0.7 ? "overdrive" : pressure > 0.3 ? "${signal}" : "idle";

hud.flash("${action}:" + nextState);
spawnWave(nextState === "overdrive" ? 3 : 1);`;
    case "python":
      return `state = "${signal}" if pressure > 0.35 else "idle"
message = f"${actor} ${action}: {state}"

if state != "idle":
    particles.emit(state)

print(message)`;
    case "html_css_js":
      return `<section class="demo-panel">
  <h1>${actor} ${action}</h1>
  <button id="trigger">Push it</button>
</section>
<style>
  .demo-panel { padding: 24px; border-radius: 16px; background: #101821; color: #f5f7fb; }
  #trigger { background: #007acc; color: white; border: 0; padding: 10px 14px; }
</style>
<script>
  trigger.addEventListener("click", () => {
    document.body.dataset.mode = "${signal}";
  });
</script>`;
    case "javascript":
    default:
      return `const ${actor}Mode = pressure > 0.4 ? "${signal}" : "idle";
const label = ${actor}Mode === "idle" ? "hold" : "${action}";

hud.setLabel(label);
effects.queue(${actor}Mode);`;
  }
}

function buildDemoStepText(
  stepType: ChainStep["stepType"],
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

function buildStep(
  chainId: string,
  originSeatIndex: number,
  roundIndex: number,
  authorMemberId: string,
  roundSequence: ChainStep["stepType"][],
  language: CodeLanguage | null,
): ChainStep {
  const stepType = getStepTypeForRound(roundIndex, roundSequence);
  const text = buildDemoStepText(stepType, originSeatIndex, roundIndex, language);

  return {
    id: `demo-step-${chainId}-${roundIndex}`,
    chainId,
    roundIndex,
    stepType,
    text,
    language,
    fallback: false,
    authorMemberId,
    createdAt: demoNowIso(-(90 - roundIndex * 12)),
    stepLabel: getRoundLabel(roundIndex, roundSequence),
  };
}

export function buildDemoChains(
  roomCode: string,
  settings: Pick<
    RoomSettings,
    "skillMode" | "languageMode" | "languagePool" | "singleLanguage"
  >,
  experience: RoomExperienceSettings,
  members: RoomMemberSnapshot[],
  totalRounds: number,
): ChainSnapshot[] {
  const activeMembers = members.filter((member) => member.role !== "spectator");
  const roundSequence = getRoundSequence(experience.gameMode, totalRounds);

  return activeMembers.map((member) => {
    const chainId = `demo-chain-${roomCode}-${member.seatIndex}`;
    const steps: ChainStep[] = [];

    for (let roundIndex = 0; roundIndex < roundSequence.length; roundIndex += 1) {
      const stepType = getStepTypeForRound(roundIndex, roundSequence);
      const assignedSeat = assignSeatForRound(
        member.seatIndex ?? 0,
        roundIndex,
        activeMembers.length,
      );
      const author =
        activeMembers.find((entry) => entry.seatIndex === assignedSeat) ?? activeMembers[0];
      const language =
        isCodeLikeStep(stepType)
          ? getCodeRoundLanguage(
              settings.languageMode,
              settings.languagePool,
              roundIndex,
              member.seatIndex ?? 0,
              settings.singleLanguage,
              roundSequence,
            )
          : null;

      steps.push(
        buildStep(
          chainId,
          member.seatIndex ?? 0,
          roundIndex,
          author.id,
          roundSequence,
          language,
        ),
      );
    }

    return {
      id: chainId,
      originMemberId: member.id,
      originSeatIndex: member.seatIndex ?? 0,
      promptSourceType: "custom",
      promptRecordId: null,
      steps,
      revealTitle: `Chain ${member.seatIndex! + 1}`,
    };
  });
}

function trimChainsToRound(
  chains: ChainSnapshot[],
  roundIndex: number,
  includeCurrentRound = false,
) {
  return chains.map((chain) => ({
    ...chain,
    steps: chain.steps.filter((step) =>
      includeCurrentRound ? step.roundIndex <= roundIndex : step.roundIndex < roundIndex,
    ),
  }));
}

function buildBaseSnapshot(
  scenario: DemoScenario,
  nickname: string,
  overrides: DemoRoomOverrides = {},
): RoomSnapshot {
  const joinMode = overrides.joinMode ?? scenario.joinMode;
  const members = buildMembers({ ...scenario, joinMode }, nickname);
  const currentUserMember = members.find((member) => member.isCurrentUser);
  const settings = overrides.settings ?? buildSettings(scenario);
  const experience = overrides.experience ?? buildExperience(scenario);

  return {
    id: `demo-room-${scenario.code}`,
    code: scenario.code,
    roomName: overrides.roomName ?? scenario.roomName,
    status: overrides.status ?? scenario.status,
    isDemo: true,
    isHost: currentUserMember?.role === "host",
    viewerRole: currentUserMember?.role ?? null,
    currentUserMemberId: currentUserMember?.id ?? null,
    settings,
    experience,
    members,
    game: null,
  };
}

export function buildDemoRoomViewData(
  code: string,
  nickname: string,
): RoomViewData | null {
  if (!isDemoRoomCode(code)) {
    return null;
  }

  const scenario = demoScenarios[code.toUpperCase() as keyof typeof demoScenarios];
  const snapshot = buildBaseSnapshot(scenario, nickname);
  const experience = snapshot.experience ?? buildExperience(scenario);
  const roundSequence = getRoundSequence(experience.gameMode, snapshot.settings.roundCount);
  const completeChains = buildDemoChains(
    scenario.code,
    snapshot.settings,
    experience,
    snapshot.members,
    snapshot.settings.roundCount,
  );

  if (scenario.status === "lobby") {
    return {
      snapshot,
      reactionsByStep: {},
      favoritesByStep: {},
    };
  }

  if (scenario.status === "live") {
    const liveRoundIndex = Math.min(2, roundSequence.length - 1);
    const liveStepType = getStepTypeForRound(liveRoundIndex, roundSequence);
    snapshot.game = {
      id: `demo-game-${scenario.code}`,
      phase: getPhaseForRound(liveRoundIndex, roundSequence),
      roundIndex: liveRoundIndex,
      totalRounds: roundSequence.length - 1,
      phaseStartedAt: demoNowIso(-18),
      phaseEndsAt: demoNowIso(72),
      currentCodeLanguage: isCodeLikeStep(liveStepType)
        ? getCodeRoundLanguage(
            snapshot.settings.languageMode,
            snapshot.settings.languagePool,
            liveRoundIndex,
            1,
            snapshot.settings.singleLanguage,
            roundSequence,
          )
        : null,
      replaySlug: scenario.demoReplaySlug,
      chains: trimChainsToRound(completeChains, liveRoundIndex, false),
      gameMode: experience.gameMode,
      roundSequence,
    };

    return {
      snapshot,
      reactionsByStep: {},
      favoritesByStep: {},
    };
  }

  snapshot.game = {
    id: `demo-game-${scenario.code}`,
    phase: "reveal",
    roundIndex: roundSequence.length - 1,
    totalRounds: roundSequence.length - 1,
    phaseStartedAt: demoNowIso(-40),
    phaseEndsAt: null,
    currentCodeLanguage: null,
    replaySlug: scenario.demoReplaySlug,
    chains: completeChains,
    gameMode: experience.gameMode,
    roundSequence,
    scoreboard: buildScoreboardEntries(
      {
        ...snapshot,
        game: {
          id: `demo-game-${scenario.code}`,
          phase: "reveal",
          roundIndex: roundSequence.length - 1,
          totalRounds: roundSequence.length - 1,
          phaseStartedAt: demoNowIso(-40),
          phaseEndsAt: null,
          currentCodeLanguage: null,
          replaySlug: scenario.demoReplaySlug,
          chains: completeChains,
          gameMode: experience.gameMode,
          roundSequence,
        },
      },
      {},
      {},
    ),
  };

  return {
    snapshot,
    reactionsByStep: {},
    favoritesByStep: {},
  };
}

export function buildDemoLobbyRoomViewData(
  code: string,
  nickname: string,
  overrides: {
    roomName: string;
    settings: RoomSettings;
    experience?: RoomExperienceSettings;
  },
): RoomViewData | null {
  if (!isDemoRoomCode(code)) {
    return null;
  }

  const scenario = demoScenarios[code.toUpperCase() as keyof typeof demoScenarios];
  const snapshot = buildBaseSnapshot(scenario, nickname, {
    roomName: overrides.roomName,
    status: "lobby",
    joinMode: "host",
    settings: normalizeRoomSettings(overrides.settings),
    experience: overrides.experience,
  });

  return {
    snapshot,
    reactionsByStep: {},
    favoritesByStep: {},
  };
}

export function buildDemoPublicRoomSummaries(): PublicRoomSummary[] {
  return [
    {
      id: "demo-public-boss1",
      code: "LATE2",
      visibility: "public",
      status: "lobby",
      hostNickname: "byte-scout",
      skillMode: "beginner",
      languageMode: "single",
      playerCount: 3,
      spectatorCount: 0,
      seatsOpen: 2,
      lastActivityAt: demoNowIso(-45),
    },
    {
      id: "demo-public-shdr5",
      code: "SHDR5",
      visibility: "public",
      status: "live",
      hostNickname: "shader-goblin",
      skillMode: "advanced",
      languageMode: "single",
      playerCount: 4,
      spectatorCount: 2,
      seatsOpen: 0,
      lastActivityAt: demoNowIso(-18),
    },
    {
      id: "demo-public-cursd",
      code: "CURSD",
      visibility: "public",
      status: "reveal",
      hostNickname: "moss-loop",
      skillMode: "chaos",
      languageMode: "random",
      playerCount: 4,
      spectatorCount: 5,
      seatsOpen: 0,
      lastActivityAt: demoNowIso(-6),
    },
  ];
}

export function buildDemoReplaySnapshot(slug: string): ReplaySnapshot | null {
  if (!isDemoReplaySlug(slug)) {
    return null;
  }

  const roomCode = slug === "demo-cursd" ? "CURSD" : "BOSS1";
  const roomData = buildDemoRoomViewData(roomCode, "late-night-dev");

  if (!roomData?.snapshot?.game) {
    return null;
  }

  const replayChains =
    roomData.snapshot.status === "reveal"
      ? roomData.snapshot.game.chains
      : buildDemoChains(
          roomCode,
          roomData.snapshot.settings,
          roomData.snapshot.experience ?? buildExperience(getDemoScenarioByCode(roomCode)!),
          roomData.snapshot.members,
          roomData.snapshot.settings.roundCount,
        );

  return {
    gameId: `demo-game-${roomCode}`,
    replaySlug: slug,
    roomCode,
    skillMode: roomData.snapshot.settings.skillMode,
    isDemo: true,
    completedAt: demoNowIso(-300),
    members: Object.fromEntries(
      roomData.snapshot.members
        .filter((member) => member.role !== "spectator")
        .map((member) => [
          member.id,
          { nickname: member.nickname, role: member.role },
        ]),
    ),
    chains: replayChains,
    reactionsByStep: roomData.reactionsByStep,
    favoritesByStep: roomData.favoritesByStep,
  };
}

export function buildDemoAccountData(nickname: string) {
  return {
    viewer: {
      id: "demo-viewer",
      nickname,
      isGuest: true,
      email: null,
    },
    replays: [
      {
        gameId: "demo-game-BOSS1",
        replaySlug: "demo-boss1",
        completedAt: demoNowIso(-7200),
        roomCode: "BOSS1",
        skillMode: "intermediate",
        pinned: true,
      },
      {
        gameId: "demo-game-CURSD",
        replaySlug: "demo-cursd",
        completedAt: demoNowIso(-3600),
        roomCode: "CURSD",
        skillMode: "chaos",
        pinned: false,
      },
    ],
  };
}

export function getDemoScenarioByCode(code: string) {
  if (!isDemoRoomCode(code)) {
    return null;
  }

  return demoScenarios[code.toUpperCase() as keyof typeof demoScenarios];
}

export function getDemoReplaySlugForRoom(code: string) {
  return getDemoScenarioByCode(code)?.demoReplaySlug ?? "demo-boss1";
}
