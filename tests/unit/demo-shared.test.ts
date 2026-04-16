import { describe, expect, it } from "vitest";
import { getDemoRoomCodeForSkillMode } from "@/features/demo/shared";

describe("demo room mapping", () => {
  it("maps each skill mode to the matching demo room", () => {
    expect(getDemoRoomCodeForSkillMode("beginner")).toBe("LATE2");
    expect(getDemoRoomCodeForSkillMode("intermediate")).toBe("BOSS1");
    expect(getDemoRoomCodeForSkillMode("advanced")).toBe("SHDR5");
    expect(getDemoRoomCodeForSkillMode("chaos")).toBe("CURSD");
  });
});
