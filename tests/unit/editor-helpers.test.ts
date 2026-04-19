import { describe, expect, it } from "vitest";
import {
  buildPreviewSrcDoc,
  getEditorFilename,
  normalizeCodeFilename,
} from "@/features/game/editor";

describe("editor helpers", () => {
  it("uses language-appropriate default file names", () => {
    expect(getEditorFilename("typescript")).toBe("main.ts");
    expect(getEditorFilename("javascript")).toBe("main.js");
    expect(getEditorFilename("python")).toBe("main.py");
    expect(getEditorFilename("html_css_js")).toBe("index.html");
  });

  it("normalizes new file names to the active language extension", () => {
    expect(normalizeCodeFilename("enemy spawner", "typescript")).toBe(
      "enemy-spawner.ts",
    );
    expect(normalizeCodeFilename("boss_phase", "python")).toBe("boss_phase.py");
    expect(normalizeCodeFilename("index", "html_css_js")).toBe("index.html");
  });

  it("allows python preview runtime eval support", () => {
    const srcDoc = buildPreviewSrcDoc("print('hello world')", "python");

    expect(srcDoc).toContain("'unsafe-eval'");
    expect(srcDoc).toContain("Relay Python Preview");
  });
});
