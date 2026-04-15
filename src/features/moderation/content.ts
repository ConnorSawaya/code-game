import profanity from "leo-profanity";

profanity.loadDictionary();
profanity.add(["slur1", "slur2"]);

export function normalizeModerationText(text: string) {
  return text
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();
}

export function containsProfanity(text: string) {
  return profanity.check(normalizeModerationText(text));
}
