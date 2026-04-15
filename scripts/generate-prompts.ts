import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { CodeLanguage, PromptRecord, SkillMode } from "../src/features/game/types";

interface PackBlueprint {
  pack: string;
  packLabel: string;
  category: string;
  difficulty: SkillMode;
  tags: string[];
  languages: CodeLanguage[];
  template: (subject: string, goal: string, twist: string) => string;
  subjects: string[];
  goals: string[];
  twists: string[];
}

const packs: PackBlueprint[] = [
  {
    pack: "arcade-lab",
    packLabel: "Arcade Lab",
    category: "games",
    difficulty: "intermediate",
    tags: ["games", "score", "playful"],
    languages: ["html_css_js", "javascript", "typescript"],
    template: (subject, goal, twist) =>
      `Build a ${subject} game that ${goal}, and make it ${twist}.`,
    subjects: [
      "single-screen dodge",
      "tiny memory match",
      "one-button fishing",
      "gravity-flip runner",
      "reaction-time duel",
      "maze escape",
    ],
    goals: [
      "tracks score across rounds",
      "gets harder every 10 seconds",
      "rewards risky timing",
      "has a cheerful failure state",
      "teases the player with almost-wins",
      "invites quick replaying",
    ],
    twists: [
      "playable in under 30 seconds",
      "themed around office supplies",
      "designed like a toy shelf find",
      "slightly dramatic in its feedback",
      "easy for a beginner to understand",
      "full of satisfying sound cues",
      "built for keyboard-only input",
      "surprisingly cozy instead of intense",
      "good for a fake retro tournament",
      "delightful on mobile as well",
    ],
  },
  {
    pack: "motion-notes",
    packLabel: "Motion Notes",
    category: "animations",
    difficulty: "beginner",
    tags: ["animations", "motion", "visual"],
    languages: ["html_css_js", "javascript", "typescript"],
    template: (subject, goal, twist) =>
      `Create a ${subject} animation that ${goal}, with a ${twist} finish.`,
    subjects: [
      "loading screen",
      "logo reveal",
      "button hover",
      "landing page hero",
      "progress indicator",
      "card stack",
    ],
    goals: [
      "loops smoothly without feeling robotic",
      "feels tactile and soft",
      "shows a sense of personality",
      "builds anticipation before a reveal",
      "looks expensive but stays simple",
      "teaches one tiny interaction",
    ],
    twists: [
      "paper-cut style",
      "magnetic snap",
      "liquid bounce",
      "accordion-like rhythm",
      "storybook mood",
      "quiet celebratory burst",
      "editorial polish",
      "soft spring settle",
      "glassy parallax accent",
      "stage curtain flourish",
    ],
  },
  {
    pack: "launchpad-sites",
    packLabel: "Launchpad Sites",
    category: "websites",
    difficulty: "beginner",
    tags: ["website", "landing", "ui"],
    languages: ["html_css_js", "javascript", "typescript"],
    template: (subject, goal, twist) =>
      `Make a website for ${subject} that ${goal}, and give it a ${twist} personality.`,
    subjects: [
      "a neighborhood mystery club",
      "a late-night soup delivery startup",
      "a tiny museum of broken gadgets",
      "an indie tea festival",
      "a subscription for surprise postcards",
      "a local astronomy meetup",
    ],
    goals: [
      "feels instantly trustworthy",
      "gets people to sign up quickly",
      "shows off one standout feature",
      "turns a weird premise into something charming",
      "explains the idea in under a minute",
      "mixes utility with delight",
    ],
    twists: [
      "editorial",
      "playful boutique",
      "soft futuristic",
      "slightly theatrical",
      "modern craft",
      "friendly premium",
      "poster-inspired",
      "gallery-like",
      "zine-flavored",
      "calm experimental",
    ],
  },
  {
    pack: "uncanny-utils",
    packLabel: "Uncanny Utils",
    category: "weird tools",
    difficulty: "intermediate",
    tags: ["tool", "weird", "utility"],
    languages: ["javascript", "python", "typescript"],
    template: (subject, goal, twist) =>
      `Write a tool that ${goal} for ${subject}, but make it ${twist}.`,
    subjects: [
      "people who overthink text messages",
      "cats who run small businesses",
      "someone packing for five possible climates",
      "friends choosing a snack by committee",
      "a time traveler with terrible note-taking",
      "a very dramatic study group",
    ],
    goals: [
      "scores options in a silly but clear way",
      "suggests next steps with odd confidence",
      "turns chaotic input into one useful answer",
      "tracks tiny decisions over time",
      "helps resolve a low-stakes argument",
      "produces one memorable final verdict",
    ],
    twists: [
      "unexpectedly elegant",
      "mildly suspicious",
      "deadpan and formal",
      "absurdly specific",
      "surprisingly wholesome",
      "filled with fake professional jargon",
      "driven by random tiny rituals",
      "secretly generous",
      "playfully over-engineered",
      "ready for a screenshot on social media",
    ],
  },
  {
    pack: "faux-products",
    packLabel: "Faux Products",
    category: "fake apps",
    difficulty: "intermediate",
    tags: ["fake app", "consumer", "product"],
    languages: ["html_css_js", "javascript", "typescript"],
    template: (subject, goal, twist) =>
      `Prototype a fake app for ${subject} that ${goal}, with a ${twist} core feature.`,
    subjects: [
      "neighbors sharing spare desserts",
      "musicians swapping unfinished hooks",
      "people renting out dramatic entrances",
      "collectors of niche stickers",
      "roommates negotiating chores",
      "friends planning chaotic road trips",
    ],
    goals: [
      "turns a messy social ritual into a tidy product flow",
      "looks believable at first glance",
      "has one outrageous premium perk",
      "feels like a startup pitch gone slightly wrong",
      "reveals its joke slowly",
      "would be fun to demo live",
    ],
    twists: [
      "subscription-heavy",
      "overly ceremonial onboarding",
      "hyper-personalized mascot",
      "luxury concierge",
      "gamified streak system",
      "very earnest mission statement",
      "oddly heartfelt referral program",
      "suspiciously detailed analytics panel",
      "niche influencer mode",
      "surprisingly calming settings screen",
    ],
  },
  {
    pack: "robot-hall",
    packLabel: "Robot Hall",
    category: "bots",
    difficulty: "advanced",
    tags: ["bot", "automation", "logic"],
    languages: ["javascript", "python", "typescript"],
    template: (subject, goal, twist) =>
      `Design a bot for ${subject} that ${goal}, and make it ${twist}.`,
    subjects: [
      "organizing a tiny online community",
      "managing game night invitations",
      "sorting strange customer requests",
      "curating a playlist for moody weather",
      "triaging kitchen emergencies",
      "running a one-person space station diary",
    ],
    goals: [
      "balances usefulness with personality",
      "chooses between multiple actions clearly",
      "reacts to edge cases without crashing the vibe",
      "leaves a readable audit trail",
      "handles repetitive work gracefully",
      "sounds like a confident assistant",
    ],
    twists: [
      "a little too poetic",
      "obsessed with fairness",
      "powered by silly heuristics",
      "surprisingly empathetic",
      "ready for command aliases",
      "slightly melodramatic in its logs",
      "built around queue priorities",
      "stubborn about formatting",
      "internally over-documented",
      "good at handling one funny exception",
    ],
  },
  {
    pack: "glow-effects",
    packLabel: "Glow Effects",
    category: "visual effects",
    difficulty: "intermediate",
    tags: ["visual", "effect", "rendering"],
    languages: ["html_css_js", "javascript", "typescript"],
    template: (subject, goal, twist) =>
      `Create a visual effect where ${subject} ${goal}, using a ${twist} approach.`,
    subjects: [
      "particles",
      "floating cards",
      "background stars",
      "text fragments",
      "fake windows",
      "layered gradients",
    ],
    goals: [
      "react to cursor movement",
      "breathe in and out slowly",
      "shift based on scroll",
      "assemble into a reveal",
      "explode gently on click",
      "drift like paper in a fan breeze",
    ],
    twists: [
      "clean editorial",
      "toy-like mechanical",
      "storybook",
      "soft sci-fi",
      "deliberately imperfect",
      "gallery installation",
      "music-reactive feeling",
      "analog poster",
      "mini theater stage",
      "polaroid collage",
    ],
  },
  {
    pack: "puzzle-workshop",
    packLabel: "Puzzle Workshop",
    category: "puzzles",
    difficulty: "advanced",
    tags: ["puzzle", "logic", "gameplay"],
    languages: ["javascript", "python", "typescript"],
    template: (subject, goal, twist) =>
      `Build a puzzle around ${subject} that ${goal}, with a ${twist} rule set.`,
    subjects: [
      "matching symbols",
      "shifting tiles",
      "logic clues",
      "pathfinding",
      "number patterns",
      "rotating shapes",
    ],
    goals: [
      "can be solved in a few satisfying moves",
      "teaches itself through play",
      "supports escalating difficulty",
      "rewards pattern recognition",
      "lets the player recover from mistakes",
      "makes the final solution feel clever",
    ],
    twists: [
      "time-bending",
      "color-swapping",
      "one-mistake forgiveness",
      "hidden shortcut",
      "two-step memory",
      "mirror-world",
      "score attack",
      "cozy hint system",
      "light narrative framing",
      "single-button interaction",
    ],
  },
  {
    pack: "starter-lab",
    packLabel: "Starter Lab",
    category: "beginner concepts",
    difficulty: "beginner",
    tags: ["beginner", "practice", "learning"],
    languages: ["html_css_js", "javascript", "python", "typescript"],
    template: (subject, goal, twist) =>
      `Make a beginner-friendly ${subject} example that ${goal}, and keep it ${twist}.`,
    subjects: [
      "counter",
      "tip calculator",
      "theme switcher",
      "guessing game",
      "todo helper",
      "quote rotator",
    ],
    goals: [
      "shows one clear concept at a time",
      "feels immediately rewarding to try",
      "is easy to explain out loud",
      "can be extended later",
      "teaches input and output clearly",
      "makes state changes obvious",
    ],
    twists: [
      "kind to total beginners",
      "visually cheerful",
      "compact enough for a workshop",
      "easy to remix",
      "delightfully themed",
      "well-commented",
      "soft and inviting",
      "free of unnecessary complexity",
      "good for pair programming",
      "short enough for a coding club",
    ],
  },
  {
    pack: "system-mischief",
    packLabel: "System Mischief",
    category: "advanced concepts",
    difficulty: "advanced",
    tags: ["advanced", "systems", "architecture"],
    languages: ["javascript", "python", "typescript"],
    template: (subject, goal, twist) =>
      `Sketch a compact system for ${subject} that ${goal}, with a ${twist} design constraint.`,
    subjects: [
      "task scheduling",
      "event retries",
      "room matchmaking",
      "draft autosave",
      "queue prioritization",
      "permission checks",
    ],
    goals: [
      "explains its decisions clearly",
      "handles awkward timing gracefully",
      "stays readable under pressure",
      "makes tradeoffs visible in code",
      "degrades nicely when something fails",
      "is realistic enough to discuss in a review",
    ],
    twists: [
      "single-file prototype",
      "strict type safety",
      "minimal state footprint",
      "high-observability",
      "fairness-first",
      "retry-aware",
      "human-readable logging",
      "deterministic ordering",
      "small but extensible",
      "teaching-oriented",
    ],
  },
];

function buildPrompts() {
  const prompts: PromptRecord[] = [];

  for (const pack of packs) {
    let packOrder = 0;

    for (const subject of pack.subjects) {
      for (let index = 0; index < pack.twists.length; index += 1) {
        const goal = pack.goals[(packOrder + index) % pack.goals.length];
        const twist = pack.twists[index];
        prompts.push({
          id: `${pack.pack}-${String(packOrder + 1).padStart(3, "0")}`,
          text: pack.template(subject, goal, twist),
          category: pack.category,
          difficulty: pack.difficulty,
          tags: [...pack.tags, subject.split(" ")[0], twist.split(" ")[0]],
          languages: pack.languages,
          pack: pack.pack,
          packLabel: pack.packLabel,
          packOrder,
        });
        packOrder += 1;
      }
    }
  }

  return prompts;
}

async function main() {
  const prompts = buildPrompts();
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const outputDir = path.join(__dirname, "..", "src", "features", "prompts", "data");
  await mkdir(outputDir, { recursive: true });
  await writeFile(
    path.join(outputDir, "prompt-packs.json"),
    `${JSON.stringify(prompts, null, 2)}\n`,
    "utf8",
  );
  console.log(`Generated ${prompts.length} prompts.`);
}

void main();
