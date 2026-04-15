import promptPacks from "@/features/prompts/data/prompt-packs.json";
import type { PromptRecord } from "@/features/game/types";
import { searchPrompts, type PromptSearchFilters } from "@/features/prompts/search";

const promptLibrary = promptPacks as PromptRecord[];

export function getPromptLibrary() {
  return promptLibrary;
}

export function getPromptCategories() {
  return [...new Set(promptLibrary.map((prompt) => prompt.category))].sort();
}

export function getPromptPacks() {
  const packs = new Map<string, { id: string; label: string }>();

  for (const prompt of promptLibrary) {
    if (!packs.has(prompt.pack)) {
      packs.set(prompt.pack, { id: prompt.pack, label: prompt.packLabel });
    }
  }

  return [...packs.values()];
}

export function queryPromptLibrary(query: string, filters: PromptSearchFilters) {
  return searchPrompts(promptLibrary, query, filters);
}

export function getRandomPrompts(count = 8) {
  const shuffled = [...promptLibrary].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
