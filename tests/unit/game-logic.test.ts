import { describe, expect, it } from "vitest";
import {
  buildRoomCode,
  deriveViewerTask,
  getAllowedLanguagesForSkillMode,
  getCodeFallback,
  getCodeRoundLanguage,
  getRoundSequence,
  getStepTypeForRound,
  normalizeLanguageSettings,
} from "@/features/game/logic";
import type { RoomSnapshot } from "@/features/game/types";

describe("game logic", () => {
  it("alternates step types correctly", () => {
    expect(getStepTypeForRound(0)).toBe("prompt");
    expect(getStepTypeForRound(1)).toBe("code");
    expect(getStepTypeForRound(2)).toBe("description");
    expect(getStepTypeForRound(3)).toBe("code");
  });

  it("builds round sequences from the selected relay mode", () => {
    expect(getRoundSequence("prompt_code_guess", 4)).toEqual([
      "prompt",
      "code",
      "guess",
      "code",
      "guess",
    ]);

    expect(getRoundSequence("code_guess_rebuild", 2)).toEqual([
      "prompt",
      "code",
      "guess",
      "rebuild",
    ]);

    expect(getRoundSequence("chaos_relay", 4)).toEqual([
      "prompt",
      "code",
      "guess",
      "rebuild",
      "caption",
    ]);
  });

  it("assigns languages for each supported mode", () => {
    const pool = ["javascript", "python", "typescript"] as const;
    expect(getCodeRoundLanguage("single", [...pool], 1, 0, "python")).toBe("python");
    expect(getCodeRoundLanguage("rotate", [...pool], 1, 0, null)).toBe("javascript");
    expect(getCodeRoundLanguage("rotate", [...pool], 3, 0, null)).toBe("python");
    expect(getCodeRoundLanguage("random", [...pool], 1, 5, null)).toBe("typescript");
  });

  it("normalizes language settings against the selected skill mode", () => {
    const normalized = normalizeLanguageSettings({
      skillMode: "beginner",
      languageMode: "single" as const,
      languagePool: ["typescript", "javascript", "javascript"],
      singleLanguage: "typescript" as const,
    });

    expect(getAllowedLanguagesForSkillMode("beginner")).toEqual([
      "html_css_js",
      "javascript",
      "python",
    ]);
    expect(normalized.languagePool).toEqual(["javascript"]);
    expect(normalized.singleLanguage).toBe("javascript");
  });

  it("returns language-appropriate fallback comments", () => {
    expect(getCodeFallback("javascript")).toBe("// No code submitted");
    expect(getCodeFallback("typescript")).toBe("// No code submitted");
    expect(getCodeFallback("python")).toBe("# No code submitted");
    expect(getCodeFallback("html_css_js")).toBe("<!-- No code submitted -->");
  });

  it("creates 5-character uppercase room codes", () => {
    const roomCode = buildRoomCode();
    expect(roomCode).toHaveLength(5);
    expect(roomCode).toMatch(/^[A-Z0-9]+$/);
  });

  it("derives the current viewer task from the room snapshot", () => {
    const snapshot: RoomSnapshot = {
      id: "room-1",
      code: "ABCDE",
      roomName: "Relay Room",
      status: "live",
      isHost: false,
      viewerRole: "player",
      currentUserMemberId: "member-2",
      settings: {
        visibility: "private",
        playerCap: 4,
        roundCount: 2,
        skillMode: "beginner",
        languageMode: "single",
        languagePool: ["javascript"],
        singleLanguage: "javascript",
        profanityFilterEnabled: true,
        quickPlayDiscoverable: false,
      },
      members: [
        {
          id: "member-1",
          profileId: "profile-1",
          nickname: "Ada",
          role: "host",
          seatIndex: 0,
          ready: true,
          connected: true,
          queuedForNextGame: false,
          joinedAt: "2026-01-01T00:00:00.000Z",
          lastSeenAt: "2026-01-01T00:00:00.000Z",
        },
        {
          id: "member-2",
          profileId: "profile-2",
          nickname: "Lin",
          role: "player",
          seatIndex: 1,
          ready: true,
          connected: true,
          queuedForNextGame: false,
          joinedAt: "2026-01-01T00:00:00.000Z",
          lastSeenAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      game: {
        id: "game-1",
        phase: "code",
        roundIndex: 1,
        totalRounds: 2,
        phaseStartedAt: "2026-01-01T00:00:00.000Z",
        phaseEndsAt: "2026-01-01T00:01:00.000Z",
        currentCodeLanguage: "javascript",
        replaySlug: null,
        chains: [
          {
            id: "chain-1",
            originMemberId: "member-1",
            originSeatIndex: 0,
            promptSourceType: "custom",
            promptRecordId: null,
            steps: [
              {
                id: "step-1",
                chainId: "chain-1",
                roundIndex: 0,
                stepType: "prompt",
                text: "Build a tiny timer app.",
                language: null,
                fallback: false,
                authorMemberId: "member-1",
                createdAt: "2026-01-01T00:00:00.000Z",
              },
            ],
          },
          {
            id: "chain-2",
            originMemberId: "member-2",
            originSeatIndex: 1,
            promptSourceType: "custom",
            promptRecordId: null,
            steps: [
              {
                id: "step-2",
                chainId: "chain-2",
                roundIndex: 0,
                stepType: "prompt",
                text: "Make a dramatic weather banner.",
                language: null,
                fallback: false,
                authorMemberId: "member-2",
                createdAt: "2026-01-01T00:00:00.000Z",
              },
            ],
          },
        ],
      },
    };

    const task = deriveViewerTask(snapshot);
    expect(task?.chainId).toBe("chain-1");
    expect(task?.expectedStepType).toBe("code");
    expect(task?.previousStep?.text).toBe("Build a tiny timer app.");
  });
});
