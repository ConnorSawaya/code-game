import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { syntaxHighlighting, HighlightStyle } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import type { CodeLanguage } from "@/features/game/types";

const relayCodeTheme = EditorView.theme({
  "&": {
    backgroundColor: "#fff9f2",
    borderRadius: "24px",
    border: "1px solid rgba(44,52,65,0.12)",
    fontFamily: "var(--font-code)",
    fontSize: "14px",
  },
  ".cm-scroller": {
    padding: "18px 0",
    lineHeight: "1.75",
  },
  ".cm-content": {
    padding: "0 18px",
  },
  ".cm-gutters": {
    backgroundColor: "transparent",
    color: "rgba(31,36,48,0.45)",
    border: "none",
    paddingLeft: "10px",
  },
  ".cm-activeLine": {
    backgroundColor: "rgba(76,104,200,0.06)",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "transparent",
  },
  ".cm-cursor, .cm-dropCursor": {
    borderLeftColor: "#4c68c8",
  },
  "&.cm-focused": {
    outline: "2px solid rgba(76,104,200,0.35)",
    outlineOffset: "4px",
  },
});

const relayHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: "#8e4ec6" },
  { tag: [tags.string, tags.special(tags.string)], color: "#be5d43" },
  { tag: [tags.number, tags.bool], color: "#3268b8" },
  { tag: [tags.comment], color: "#7a7a84", fontStyle: "italic" },
  { tag: [tags.variableName, tags.propertyName], color: "#1f2430" },
  { tag: [tags.function(tags.variableName)], color: "#24756f" },
  { tag: [tags.typeName, tags.className], color: "#c05f25" },
]);

export function getCodeMirrorExtensions(language: CodeLanguage) {
  const mode =
    language === "javascript"
      ? javascript()
      : language === "typescript"
        ? javascript({ typescript: true })
        : language === "python"
          ? python()
          : html();

  return [mode, relayCodeTheme, syntaxHighlighting(relayHighlightStyle)];
}
