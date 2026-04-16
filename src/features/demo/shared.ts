export const DEMO_PASSWORD = "12345678";
export const DEMO_COOKIE_NAME = "relay_demo_mode";
export const DEMO_COOKIE_VALUE = "unlocked";
export const DEMO_NICKNAME_COOKIE = "relay_nickname";

export const DEMO_ROOM_CODES = ["BOSS1", "SHDR5", "LATE2", "CURSD"] as const;
export const DEMO_REPLAY_SLUGS = ["demo-boss1", "demo-cursd"] as const;

export function isDemoRoomCode(code: string) {
  return DEMO_ROOM_CODES.includes(code.toUpperCase() as (typeof DEMO_ROOM_CODES)[number]);
}

export function isDemoReplaySlug(slug: string) {
  return DEMO_REPLAY_SLUGS.includes(
    slug.toLowerCase() as (typeof DEMO_REPLAY_SLUGS)[number],
  );
}

export function getDemoRoomCodeForSkillMode(
  skillMode: "beginner" | "intermediate" | "advanced" | "chaos",
) {
  switch (skillMode) {
    case "chaos":
      return "CURSD";
    case "advanced":
      return "SHDR5";
    case "intermediate":
      return "BOSS1";
    case "beginner":
    default:
      return "LATE2";
  }
}
