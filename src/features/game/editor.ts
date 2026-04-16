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
      return "enemySpawner.ts";
    case "python":
      return "levelGen.py";
    case "javascript":
      return "playerController.js";
    case "html_css_js":
    default:
      return "index.html";
  }
}

function getEditorSourceFolder(language: CodeLanguage) {
  switch (language) {
    case "python":
      return "game";
    case "html_css_js":
      return "web";
    case "javascript":
    case "typescript":
    default:
      return "src";
  }
}

export function getEditorWorkspacePath(language: CodeLanguage) {
  return `${getEditorSourceFolder(language)}/${getEditorFilename(language)}`;
}

export function registerRelayMonacoTheme(monaco: typeof Monaco) {
  if (relayThemeRegistered) {
    return;
  }

  monaco.editor.defineTheme(RELAY_EDITOR_THEME, {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "6A9955", fontStyle: "italic" },
      { token: "keyword", foreground: "569CD6" },
      { token: "operator", foreground: "D4D4D4" },
      { token: "string", foreground: "CE9178" },
      { token: "number", foreground: "B5CEA8" },
      { token: "regexp", foreground: "D16969" },
      { token: "delimiter", foreground: "D4D4D4" },
      { token: "type.identifier", foreground: "4EC9B0" },
      { token: "identifier", foreground: "D4D4D4" },
      { token: "function", foreground: "DCDCAA" },
      { token: "variable", foreground: "9CDCFE" },
      { token: "tag", foreground: "569CD6" },
      { token: "attribute.name", foreground: "9CDCFE" },
      { token: "attribute.value", foreground: "CE9178" },
    ],
    colors: {
      "editor.background": "#1E1E1E",
      "editor.foreground": "#D4D4D4",
      "editorLineNumber.foreground": "#858585",
      "editorLineNumber.activeForeground": "#C6C6C6",
      "editor.lineHighlightBackground": "#2A2D2E",
      "editorCursor.foreground": "#AEAFAD",
      "editor.selectionBackground": "#264F78",
      "editor.inactiveSelectionBackground": "#3A3D41",
      "editor.selectionHighlightBackground": "#ADD6FF26",
      "editorIndentGuide.background1": "#404040",
      "editorIndentGuide.activeBackground1": "#707070",
      "editorBracketMatch.background": "#0064001A",
      "editorBracketMatch.border": "#888888",
      "editorWhitespace.foreground": "#3B3B3B",
      "editorGutter.background": "#1E1E1E",
      "editorWidget.background": "#252526",
      "editorHoverWidget.background": "#252526",
      "editorSuggestWidget.background": "#252526",
      "editorSuggestWidget.selectedBackground": "#04395E",
      "scrollbarSlider.background": "#79797966",
      "scrollbarSlider.hoverBackground": "#646464B3",
      "scrollbarSlider.activeBackground": "#BFBFBF66",
      "minimap.background": "#1E1E1E",
      "minimap.selectionHighlight": "#264F7880",
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
    minimap: {
      enabled: true,
      side: "right",
      renderCharacters: false,
      maxColumn: 80,
      showSlider: "mouseover",
    },
    fontFamily: "var(--font-code)",
    fontLigatures: true,
    fontSize: 13.5,
    lineHeight: 22,
    padding: {
      top: 12,
      bottom: 12,
    },
    scrollbar: {
      verticalScrollbarSize: 8,
      horizontalScrollbarSize: 8,
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
    fixedOverflowWidgets: true,
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
    cursorStyle: "line",
  };
}

export function getEditorTreeItems(language: CodeLanguage) {
  const filename = getEditorFilename(language);
  const sourceFolder = getEditorSourceFolder(language);

  return [
    { label: "relay-room", depth: 0, kind: "folder" as const },
    { label: sourceFolder, depth: 1, kind: "folder" as const },
    {
      label: filename,
      depth: 2,
      active: true,
      kind: "file" as const,
      documentId: "editor" as const,
    },
    {
      label: "README.md",
      depth: 1,
      kind: "file" as const,
      documentId: "notes" as const,
    },
    {
      label: "room.settings.json",
      depth: 1,
      kind: "file" as const,
      documentId: "settings" as const,
    },
  ];
}

function buildRuntimeBridgeScript() {
  return `
    <script>
      const relayPost = (payload) => {
        try {
          window.parent.postMessage({ source: "relay-preview", ...payload }, "*");
        } catch {}
      };
      const relayFormat = (value) => {
        try {
          return typeof value === "string" ? value : JSON.stringify(value);
        } catch {
          return String(value);
        }
      };

      ["log", "info", "warn", "error"].forEach((level) => {
        const original = console[level].bind(console);
        console[level] = (...args) => {
          relayPost({
            type: "console",
            level,
            message: args.map(relayFormat).join(" "),
          });
          original(...args);
        };
      });

      window.addEventListener("error", (event) => {
        relayPost({
          type: "error",
          level: "error",
          message: event.message || "Runtime error",
          stack: event.error && event.error.stack ? event.error.stack : "",
        });
      });

      window.addEventListener("unhandledrejection", (event) => {
        const reason = event.reason;
        relayPost({
          type: "error",
          level: "error",
          message: reason && reason.message ? reason.message : String(reason),
          stack: reason && reason.stack ? reason.stack : "",
        });
      });

      window.addEventListener("DOMContentLoaded", () => {
        relayPost({
          type: "ready",
          message: "Runtime ready.",
        });
      });
    </script>
  `;
}

function injectBridgeIntoDocument(
  documentHtml: string,
  bridgeScript: string,
  previewStyles = "",
) {
  if (/<\/head>/i.test(documentHtml)) {
    return documentHtml.replace(/<\/head>/i, `${previewStyles}${bridgeScript}</head>`);
  }

  if (/<body[\s>]/i.test(documentHtml)) {
    return documentHtml.replace(/<body([^>]*)>/i, `<body$1>${bridgeScript}`);
  }

  return `${previewStyles}${bridgeScript}${documentHtml}`;
}

export function buildPreviewSrcDoc(
  snippet: string,
  language: CodeLanguage = "html_css_js",
) {
  const trimmed = snippet.trim();
  const csp =
    language === "python"
      ? "default-src 'none'; img-src data: https:; style-src 'unsafe-inline'; script-src 'unsafe-inline' https://cdn.jsdelivr.net; font-src data: https:;"
      : "default-src 'none'; img-src data: https:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; font-src data: https:;";
  const bridgeScript = buildRuntimeBridgeScript();
  const previewMarkup = `
    <main class="relay-preview">
      <h1>Relay Preview</h1>
      <p>${language === "python" ? "Run Python safely in the sandbox." : "Run the current snippet in the sandbox."}</p>
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

  const shellStart = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><meta http-equiv="Content-Security-Policy" content="${csp}" />${previewStyles}${bridgeScript}</head><body>`;
  const shellEnd = "</body></html>";

  if (!trimmed) {
    return `${shellStart}<div style="display:grid;place-items:center;min-height:220px;color:#6b7280;border:1px dashed #d1d5db;border-radius:14px;">Start typing code to preview it here.</div>${shellEnd}`;
  }

  if (language === "python") {
    const escapedPython = JSON.stringify(trimmed);
    return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><meta http-equiv="Content-Security-Policy" content="${csp}" />${previewStyles}${bridgeScript}<script src="https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist/skulpt.min.js"></script><script src="https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist/skulpt-stdlib.js"></script></head><body><main class="relay-preview"><h1>Relay Python Preview</h1><p>stdout and tracebacks appear below.</p><pre id="app" class="preview-card" style="white-space:pre-wrap;margin:0;"></pre></main><script>
      const relayOutput = document.getElementById("app");
      const code = ${escapedPython};
      const pushLine = (value, level = "log") => {
        const text = String(value);
        relayOutput.textContent += text;
        relayPost({ type: "console", level, message: text.replace(/\\n$/, "") || text });
      };
      function builtinRead(filename) {
        if (!Sk.builtinFiles || !Sk.builtinFiles["files"][filename]) {
          throw new Error("File not found: " + filename);
        }
        return Sk.builtinFiles["files"][filename];
      }
      (async () => {
        relayOutput.textContent = "";
        try {
          Sk.configure({
            output: (text) => pushLine(text, "log"),
            read: builtinRead,
            __future__: Sk.python3,
          });
          await Sk.misceval.asyncToPromise(() => Sk.importMainWithBody("<stdin>", false, code, true));
          relayPost({ type: "ready", message: "Python run finished." });
        } catch (error) {
          const message = error && error.toString ? error.toString() : String(error);
          pushLine(message + "\\n", "error");
          relayPost({ type: "error", level: "error", message });
        }
      })();
    </script></body></html>`;
  }

  if (language === "javascript") {
    return `${shellStart}${previewMarkup}<script type="module">${trimmed}</script>${shellEnd}`;
  }

  if (/<html[\s>]/i.test(trimmed)) {
    return injectBridgeIntoDocument(trimmed, bridgeScript, previewStyles);
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
