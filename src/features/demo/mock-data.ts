import type {
  ChainSnapshot,
  ChainStep,
  CodeLanguage,
  PublicRoomSummary,
  RoomMemberSnapshot,
  RoomSettings,
  RoomSnapshot,
  SkillMode,
} from "@/features/game/types";
import {
  assignSeatForRound,
  getCodeRoundLanguage,
  getStepTypeForRound,
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
  },
};

const playerNames = ["shader-goblin", "byte-scout", "moss-loop", "null-jester"];
const promptSeeds = [
  "Build a boss intro that gets more dramatic every time the player waits too long.",
  "Make a tiny shader toy that turns bad input into pretty noise.",
  "Create a utility that celebrates tiny wins like a game announcer.",
  "Prototype a platformer mechanic that panics when momentum stops.",
];

export function demoNowIso(offsetSeconds = 0) {
  return new Date(Date.now() + offsetSeconds * 1000).toISOString();
}

function buildSettings(scenario: DemoScenario): RoomSettings {
  return {
    visibility: scenario.visibility,
    playerCap: scenario.playerCap,
    roundCount: scenario.roundCount,
    skillMode: scenario.skillMode,
    languageMode: scenario.languageMode,
    languagePool: scenario.languagePool,
    singleLanguage: scenario.singleLanguage,
    profanityFilterEnabled: true,
    quickPlayDiscoverable: scenario.quickPlayDiscoverable,
  };
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

export function buildDemoDescription(originSeatIndex: number, roundIndex: number) {
  const phrases = [
    "It feels like a playful system that escalates way too hard.",
    "Looks like UI logic that rewards chaos and punishes stillness.",
    "Seems to animate the game state and overreact to tiny changes.",
    "Reads like a jam prototype that keeps making the effect weirder.",
  ];

  return phrases[(originSeatIndex + roundIndex) % phrases.length];
}

export function buildDemoCode(
  originSeatIndex: number,
  roundIndex: number,
  language: CodeLanguage,
) {
  const actor = ["boss", "shader", "announcer", "runner"][originSeatIndex % 4];
  const signal = ["panic", "glow", "combo", "wobble"][(originSeatIndex + roundIndex) % 4];

  switch (language) {
    case "typescript":
      return `type ${actor[0].toUpperCase()}${actor.slice(1)}State = "idle" | "${signal}" | "overdrive";

const nextState: ${actor[0].toUpperCase()}${actor.slice(1)}State =
  pressure > 0.7 ? "overdrive" : pressure > 0.3 ? "${signal}" : "idle";

hud.flash(nextState);
spawnWave(nextState === "overdrive" ? 3 : 1);`;
    case "python":
      return `state = "${signal}" if pressure > 0.35 else "idle"
message = f"${actor} mood: {state}"

if state != "idle":
    particles.emit(state)

print(message)`;
    case "html_css_js":
      return `<section class="demo-panel">
  <h1>${actor} status</h1>
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
const label = ${actor}Mode === "idle" ? "hold" : "send it";

hud.setLabel(label);
effects.queue(${actor}Mode);`;
  }
}

function buildStep(
  chainId: string,
  originSeatIndex: number,
  roundIndex: number,
  authorMemberId: string,
  language: CodeLanguage | null,
): ChainStep {
  const stepType = getStepTypeForRound(roundIndex);
  const text =
    stepType === "prompt"
      ? buildDemoPrompt(originSeatIndex)
      : stepType === "description"
        ? buildDemoDescription(originSeatIndex, roundIndex)
        : buildDemoCode(originSeatIndex, roundIndex, language ?? "javascript");

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
  };
}

export function buildDemoChains(
  scenario: DemoScenario,
  members: RoomMemberSnapshot[],
  totalRounds: number,
): ChainSnapshot[] {
  const activeMembers = members.filter((member) => member.role !== "spectator");

  return activeMembers.map((member) => {
    const chainId = `demo-chain-${scenario.code}-${member.seatIndex}`;
    const steps: ChainStep[] = [];

    for (let roundIndex = 0; roundIndex <= totalRounds; roundIndex += 1) {
      const stepType = getStepTypeForRound(roundIndex);
      const assignedSeat = assignSeatForRound(
        member.seatIndex ?? 0,
        roundIndex,
        activeMembers.length,
      );
      const author =
        activeMembers.find((entry) => entry.seatIndex === assignedSeat) ?? activeMembers[0];
      const language =
        stepType === "code"
          ? getCodeRoundLanguage(
              scenario.languageMode,
              scenario.languagePool,
              roundIndex,
              member.seatIndex ?? 0,
              scenario.singleLanguage,
            )
          : null;

      steps.push(buildStep(chainId, member.seatIndex ?? 0, roundIndex, author.id, language));
    }

    return {
      id: chainId,
      originMemberId: member.id,
      originSeatIndex: member.seatIndex ?? 0,
      promptSourceType: "custom",
      promptRecordId: null,
      steps,
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
): RoomSnapshot {
  const members = buildMembers(scenario, nickname);
  const currentUserMember = members.find((member) => member.isCurrentUser);

  return {
    id: `demo-room-${scenario.code}`,
    code: scenario.code,
    roomName: scenario.roomName,
    status: scenario.status,
    isDemo: true,
    isHost: currentUserMember?.role === "host",
    viewerRole: currentUserMember?.role ?? null,
    currentUserMemberId: currentUserMember?.id ?? null,
    settings: buildSettings(scenario),
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
  const completeChains = buildDemoChains(
    scenario,
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
    snapshot.game = {
      id: `demo-game-${scenario.code}`,
      phase: "description",
      roundIndex: 2,
      totalRounds: snapshot.settings.roundCount,
      phaseStartedAt: demoNowIso(-18),
      phaseEndsAt: demoNowIso(72),
      currentCodeLanguage: null,
      replaySlug: scenario.demoReplaySlug,
      chains: trimChainsToRound(completeChains, 2, false),
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
    roundIndex: snapshot.settings.roundCount,
    totalRounds: snapshot.settings.roundCount,
    phaseStartedAt: demoNowIso(-40),
    phaseEndsAt: null,
    currentCodeLanguage: null,
    replaySlug: scenario.demoReplaySlug,
    chains: completeChains,
  };

    return {
      snapshot,
      reactionsByStep: {
        [completeChains[0]?.steps[2]?.id ?? ""]: { "🔥": 3, "🤯": 1 },
      },
      favoritesByStep: {
        [completeChains[0]?.steps[3]?.id ?? ""]: 2,
      [completeChains[1]?.steps[4]?.id ?? ""]: 4,
    },
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
          demoScenarios[roomCode as keyof typeof demoScenarios],
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
