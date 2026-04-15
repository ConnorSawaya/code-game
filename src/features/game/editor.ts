import type * as Monaco from "monaco-editor";
import type { CodeLanguage } from "@/features/game/types";

const RELAY_EDITOR_THEME = "relay-night";

let relayThemeRegistered = false;

export function getMonacoLanguage(language: CodeLanguage) {
  switch (language) {
    case "typescript":
      return "typescript";
    case "python":
      return "python";
    case "javascript":
      return "javascript";
    case "html_css_js":
    default:
      return "html";
  }
}

export function getEditorFilename(language: CodeLanguage) {
  switch (language) {
    case "typescript":
      return "relay-step.ts";
    case "python":
      return "relay-step.py";
    case "javascript":
      return "relay-step.js";
    case "html_css_js":
    default:
      return "relay-step.html";
  }
}

export function registerRelayMonacoTheme(monaco: typeof Monaco) {
  if (relayThemeRegistered) {
    return;
  }

  monaco.editor.defineTheme(RELAY_EDITOR_THEME, {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "6B7488", fontStyle: "italic" },
      { token: "keyword", foreground: "6C8EFF" },
      { token: "operator", foreground: "B2BEFF" },
      { token: "string", foreground: "F6B45E" },
      { token: "number", foreground: "7DD6C7" },
      { token: "regexp", foreground: "F7A76F" },
      { token: "delimiter", foreground: "8E98B0" },
      { token: "type.identifier", foreground: "68C5FF" },
      { token: "identifier", foreground: "DFE7F7" },
      { token: "function", foreground: "58C0FF" },
      { token: "tag", foreground: "FF8A65" },
      { token: "attribute.name", foreground: "7FD6FF" },
      { token: "attribute.value", foreground: "F4D06F" },
    ],
    colors: {
      "editor.background": "#111723",
      "editor.foreground": "#DFE7F7",
      "editorLineNumber.foreground": "#5F6980",
      "editorLineNumber.activeForeground": "#F4F7FF",
      "editor.lineHighlightBackground": "#1B2435",
      "editorCursor.foreground": "#7FD6FF",
      "editor.selectionBackground": "#25446F",
      "editor.inactiveSelectionBackground": "#203650",
      "editor.selectionHighlightBackground": "#20365080",
      "editorIndentGuide.background1": "#1F2B40",
      "editorIndentGuide.activeBackground1": "#32476B",
      "editorBracketMatch.background": "#24314B",
      "editorBracketMatch.border": "#4C6BFF",
      "editorWhitespace.foreground": "#39445D",
      "editorGutter.background": "#0C111A",
      "editorWidget.background": "#151D2C",
      "editorHoverWidget.background": "#161F30",
      "editorSuggestWidget.background": "#161F30",
      "editorSuggestWidget.selectedBackground": "#20314C",
      "scrollbarSlider.background": "#2B385199",
      "scrollbarSlider.hoverBackground": "#3A4E7199",
      "scrollbarSlider.activeBackground": "#5472A199",
      "minimap.background": "#111723",
    },
  });

  relayThemeRegistered = true;
}

export function getMonacoEditorOptions(readOnly = false): Monaco.editor.IStandaloneEditorConstructionOptions {
  return {
    theme: RELAY_EDITOR_THEME,
    language: "plaintext",
    readOnly,
    domReadOnly: readOnly,
    automaticLayout: true,
    minimap: { enabled: false },
    fontFamily: "var(--font-code)",
    fontLigatures: true,
    fontSize: 14,
    lineHeight: 22,
    padding: {
      top: 16,
      bottom: 16,
    },
    scrollbar: {
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10,
      alwaysConsumeMouseWheel: false,
      useShadows: false,
    },
    scrollBeyondLastLine: false,
    lineNumbers: "on",
    lineNumbersMinChars: 3,
    glyphMargin: false,
    folding: false,
    guides: {
      indentation: true,
      bracketPairs: true,
      highlightActiveBracketPair: true,
    },
    bracketPairColorization: {
      enabled: true,
    },
    renderLineHighlight: readOnly ? "none" : "line",
    roundedSelection: false,
    cursorBlinking: "smooth",
    cursorSmoothCaretAnimation: "on",
    smoothScrolling: true,
    overviewRulerBorder: false,
    contextmenu: true,
    tabSize: 2,
    insertSpaces: true,
    formatOnPaste: false,
    formatOnType: false,
    wordWrap: "off",
    wrappingIndent: "same",
    matchBrackets: "always",
    quickSuggestions: !readOnly,
    suggestOnTriggerCharacters: !readOnly,
    parameterHints: {
      enabled: !readOnly,
    },
    occurrencesHighlight: readOnly ? "off" : "singleFile",
    selectionHighlight: !readOnly,
    renderValidationDecorations: "off",
    hideCursorInOverviewRuler: true,
    codeLens: false,
    stickyScroll: {
      enabled: false,
    },
  };
}

export function buildPreviewSrcDoc(snippet: string) {
  const trimmed = snippet.trim();
  const csp =
    "default-src 'none'; img-src data: https:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; font-src data: https:;";
  const previewMarkup = `
    <main class="relay-preview">
      <h1>Relay Preview</h1>
      <p>This sandbox only runs HTML/CSS/JS snippets.</p>
      <button id="preview-button">Press me</button>
      <div id="app" class="preview-card">Live output target</div>
    </main>
  `;
  const previewStyles = `
    <style>
      html,body{margin:0;padding:0;min-height:100%;font-family:system-ui,sans-serif;background:#fff;color:#111827;}
      body{padding:18px;}
      button,input,textarea,select{font:inherit;}
      *{box-sizing:border-box;}
      .relay-preview{display:grid;gap:12px;align-content:start;}
      .preview-card{padding:18px;border-radius:16px;border:1px solid #d1d5db;background:#f8fafc;min-height:80px;}
      #preview-button{justify-self:start;border:none;border-radius:999px;padding:10px 16px;background:#355ad8;color:#fff;font-weight:600;}
    </style>
  `;

  const shellStart = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><meta http-equiv="Content-Security-Policy" content="${csp}" />${previewStyles}</head><body>`;
  const shellEnd = "</body></html>";

  if (!trimmed) {
    return `${shellStart}<div style="display:grid;place-items:center;min-height:220px;color:#6b7280;border:1px dashed #d1d5db;border-radius:14px;">Start typing HTML, CSS, and JS to preview it here.</div>${shellEnd}`;
  }

  if (/<html[\s>]/i.test(trimmed)) {
    return trimmed;
  }

  if (/<body[\s>]/i.test(trimmed) || /<(div|section|main|article|header|footer|nav|button|canvas|svg|form|input|label|ul|ol|li|p|h1|h2|h3|style|script)\b/i.test(trimmed)) {
    return `${shellStart}${trimmed}${shellEnd}`;
  }

  const looksLikeJavaScript =
    /\b(const|let|var|function|document\.|window\.|addEventListener|querySelector|setTimeout|setInterval|console\.|=>)\b/.test(
      trimmed,
    );
  const looksLikeCss =
    /(^|[}\s])[.#a-zA-Z][^{]+\{[^}]+\}/m.test(trimmed) ||
    /:\s*[^;]+;/m.test(trimmed);

  if (looksLikeCss && !looksLikeJavaScript) {
    return `${shellStart}${previewMarkup}<style>${trimmed}</style>${shellEnd}`;
  }

  return `${shellStart}${previewMarkup}<script type="module">${trimmed}</script>${shellEnd}`;
}
