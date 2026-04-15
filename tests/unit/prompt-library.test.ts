import { describe, expect, it } from "vitest";
import { getPromptLibrary, queryPromptLibrary } from "@/features/prompts/library";

describe("prompt library", () => {
  it("ships with roughly 600 prompts", () => {
    expect(getPromptLibrary().length).toBeGreaterThanOrEqual(600);
  });

  it("supports searching prompt text and metadata", () => {
    const results = queryPromptLibrary("weather", {});
    expect(results.some((prompt) => prompt.text.toLowerCase().includes("weather"))).toBe(true);
  });
});
