import Fuse, { type IFuseOptions } from "fuse.js";
import type { PromptRecord, SkillMode } from "@/features/game/types";

export interface PromptSearchFilters {
  category?: string;
  difficulty?: SkillMode;
  language?: string;
  tag?: string;
  pack?: string;
}

const promptSearchOptions: IFuseOptions<PromptRecord> = {
  includeScore: true,
  ignoreLocation: true,
  threshold: 0.32,
  keys: [
    { name: "text", weight: 0.6 },
    { name: "tags", weight: 0.2 },
    { name: "category", weight: 0.1 },
    { name: "packLabel", weight: 0.1 },
  ],
};

export function createPromptFuseIndex(prompts: PromptRecord[]) {
  return new Fuse(prompts, promptSearchOptions);
}

export function filterPrompts(
  prompts: PromptRecord[],
  filters: PromptSearchFilters,
) {
  return prompts.filter((prompt) => {
    if (filters.category && prompt.category !== filters.category) {
      return false;
    }

    if (filters.difficulty && prompt.difficulty !== filters.difficulty) {
      return false;
    }

    if (filters.language && !prompt.languages.includes(filters.language as never)) {
      return false;
    }

    if (filters.tag && !prompt.tags.includes(filters.tag)) {
      return false;
    }

    if (filters.pack && prompt.pack !== filters.pack) {
      return false;
    }

    return true;
  });
}

export function searchPrompts(
  prompts: PromptRecord[],
  query: string,
  filters: PromptSearchFilters = {},
) {
  const filtered = filterPrompts(prompts, filters);

  if (!query.trim()) {
    return filtered;
  }

  return createPromptFuseIndex(filtered)
    .search(query)
    .map((result) => result.item);
}
