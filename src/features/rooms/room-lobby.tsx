"use client";

import { useMemo } from "react";
import type { RoomExperienceSettings, RoomSnapshot } from "@/features/game/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { SelectableChip } from "@/components/ui/chip";
import {
  getAllowedLanguagesForSkillMode,
  getGameModeLabel,
  getLanguageLabel,
  getRoundSequence,
  getSkillModeConfig,
  getStepLabel,
  normalizeRoomSettings,
} from "@/features/game/logic";
import { RELAY_MODE_DEFINITIONS } from "@/features/game/modes";

export function RoomLobby({
  snapshot,
  settingsDraft,
  setSettingsDraft,
  experienceDraft,
  setExperienceDraft,
  onSaveSettings,
  onSaveExperience,
  submitting,
}: {
  snapshot: RoomSnapshot;
  settingsDraft: RoomSnapshot["settings"];
  setSettingsDraft: (next: RoomSnapshot["settings"]) => void;
  experienceDraft: RoomExperienceSettings;
  setExperienceDraft: (next: RoomExperienceSettings) => void;
  onSaveSettings: () => void;
  onSaveExperience: () => void;
  submitting: string | null;
}) {
  const skillConfig = getSkillModeConfig(settingsDraft.skillMode);
  const availableLanguages = useMemo(
    () => getAllowedLanguagesForSkillMode(settingsDraft.skillMode),
    [settingsDraft.skillMode],
  );
  const roundSequence = useMemo(
    () => getRoundSequence(experienceDraft.gameMode, settingsDraft.roundCount),
    [experienceDraft.gameMode, settingsDraft.roundCount],
  );
  const activeMode = RELAY_MODE_DEFINITIONS[experienceDraft.gameMode];

  const applySettingsDraft = (patch: Partial<RoomSnapshot["settings"]>) => {
    setSettingsDraft(
      normalizeRoomSettings({
        ...settingsDraft,
        ...patch,
      }),
    );
  };

  const applyExperienceDraft = (patch: Partial<RoomExperienceSettings>) => {
    setExperienceDraft({
      ...experienceDraft,
      ...patch,
    });
  };

  return (
    <section className="grid gap-6 xl:grid-cols-[1fr_0.94fr]">
      <Card className="space-y-5">
        <div>
          <Badge>Host Panel</Badge>
          <CardTitle className="mt-3">Room settings</CardTitle>
          <CardDescription className="mt-2">
            Set the room up once, then start when the roster is ready.
          </CardDescription>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel>Visibility</FieldLabel>
            <SegmentedControl
              value={settingsDraft.visibility}
              onChange={(value) => applySettingsDraft({ visibility: value })}
              options={[
                { value: "private", label: "Private" },
                { value: "public", label: "Public" },
              ]}
            />
          </Field>
          <Field>
            <FieldLabel>Skill Mode</FieldLabel>
            <SegmentedControl
              value={settingsDraft.skillMode}
              onChange={(value) =>
                applySettingsDraft({
                  skillMode: value,
                  languageMode:
                    value === "chaos" && settingsDraft.languageMode === "single"
                      ? "random"
                      : settingsDraft.languageMode,
                })
              }
              options={[
                { value: "beginner", label: "Beginner" },
                { value: "intermediate", label: "Intermediate" },
                { value: "advanced", label: "Advanced" },
                { value: "chaos", label: "Chaos" },
              ]}
            />
          </Field>
          <Field>
            <FieldLabel>Language Mode</FieldLabel>
            <SegmentedControl
              value={settingsDraft.languageMode}
              onChange={(value) => applySettingsDraft({ languageMode: value })}
              options={[
                { value: "single", label: "Single" },
                { value: "rotate", label: "Rotate" },
                { value: "random", label: "Random" },
              ]}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel>Rounds</FieldLabel>
              <Input
                type="number"
                min={2}
                max={11}
                value={settingsDraft.roundCount}
                onChange={(event) =>
                  applySettingsDraft({
                    roundCount: Number(event.target.value),
                  })
                }
              />
            </Field>
            <Field>
              <FieldLabel>Player Cap</FieldLabel>
              <Input
                type="number"
                min={3}
                max={12}
                value={settingsDraft.playerCap}
                onChange={(event) =>
                  applySettingsDraft({
                    playerCap: Number(event.target.value),
                  })
                }
              />
            </Field>
          </div>
        </div>
        <Field>
          <FieldLabel>Language Pool</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {availableLanguages.map((language) => (
              <SelectableChip
                key={language}
                selected={settingsDraft.languagePool.includes(language)}
                label={getLanguageLabel(language)}
                onClick={() =>
                  applySettingsDraft({
                    languagePool: settingsDraft.languagePool.includes(language)
                      ? settingsDraft.languagePool.filter((entry) => entry !== language)
                      : [...settingsDraft.languagePool, language],
                  })
                }
              />
            ))}
          </div>
        </Field>
        {settingsDraft.languageMode === "single" ? (
          <Field>
            <FieldLabel>Single Language</FieldLabel>
            <SegmentedControl
              value={settingsDraft.singleLanguage ?? settingsDraft.languagePool[0]}
              onChange={(value) => applySettingsDraft({ singleLanguage: value })}
              options={settingsDraft.languagePool.map((language) => ({
                value: language,
                label: getLanguageLabel(language),
              }))}
            />
          </Field>
        ) : null}
        <Button onClick={onSaveSettings} disabled={!snapshot.isHost || submitting === "settings"}>
          {submitting === "settings" ? "Saving..." : "Save room settings"}
        </Button>
      </Card>

      <Card className="space-y-5">
        <div>
          <Badge>Pregame</Badge>
          <CardTitle className="mt-3">Relay mode</CardTitle>
          <CardDescription className="mt-2">
            Pick the handoff structure, then decide how wild the room should be.
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.values(RELAY_MODE_DEFINITIONS).map((mode) => (
            <SelectableChip
              key={mode.id}
              selected={experienceDraft.gameMode === mode.id}
              label={mode.shortLabel}
              onClick={() => applyExperienceDraft({ gameMode: mode.id })}
            />
          ))}
        </div>
        <div className="rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-bg-main)] px-4 py-4">
          <p className="font-medium text-[color:var(--color-text-strong)]">
            {getGameModeLabel(experienceDraft.gameMode)}
          </p>
          <p className="mt-2 text-sm leading-7 text-[color:var(--color-text-muted)]">
            {activeMode.lobbyHint}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {roundSequence.map((step, index) => (
              <Badge key={`${step}-${index}`}>
                {index === 0 ? "Start" : `${index}. ${getStepLabel(step)}`}
              </Badge>
            ))}
          </div>
          <p className="mt-4 text-sm leading-7 text-[color:var(--color-text-soft)]">
            {activeMode.revealHeading}
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel>Prompt source</FieldLabel>
            <SegmentedControl
              value={experienceDraft.promptSourceMode}
              onChange={(value) => applyExperienceDraft({ promptSourceMode: value })}
              options={[
                { value: "human", label: "Players" },
                { value: "system", label: "System" },
              ]}
            />
          </Field>
          <Field>
            <FieldLabel>Scoring</FieldLabel>
            <SegmentedControl
              value={experienceDraft.scoringMode}
              onChange={(value) => applyExperienceDraft({ scoringMode: value })}
              options={[
                { value: "casual", label: "Casual" },
                { value: "competitive", label: "Scored" },
              ]}
            />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <SelectableChip
            selected={experienceDraft.executionEnabled}
            label={experienceDraft.executionEnabled ? "Execution on" : "Execution off"}
            onClick={() =>
              applyExperienceDraft({ executionEnabled: !experienceDraft.executionEnabled })
            }
          />
          <SelectableChip
            selected={experienceDraft.liveSpectatorsEnabled}
            label={experienceDraft.liveSpectatorsEnabled ? "Live spectate" : "Reveal only"}
            onClick={() =>
              applyExperienceDraft({
                liveSpectatorsEnabled: !experienceDraft.liveSpectatorsEnabled,
              })
            }
          />
          <SelectableChip
            selected={experienceDraft.mixedLanguagesAllowed}
            label={experienceDraft.mixedLanguagesAllowed ? "Mixed languages" : "Locked language"}
            onClick={() =>
              applyExperienceDraft({
                mixedLanguagesAllowed: !experienceDraft.mixedLanguagesAllowed,
              })
            }
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="stack-panel px-4 py-4">
            <p className="text-[0.7rem] uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
              Timer
            </p>
            <p className="mt-2 font-display text-3xl tracking-[-0.05em]">
              {skillConfig.timerSeconds}s
            </p>
          </div>
          <div className="stack-panel px-4 py-4">
            <p className="text-[0.7rem] uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
              Lines
            </p>
            <p className="mt-2 font-display text-3xl tracking-[-0.05em]">{skillConfig.lineLimit}</p>
          </div>
          <div className="stack-panel px-4 py-4">
            <p className="text-[0.7rem] uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
              Chars
            </p>
            <p className="mt-2 font-display text-3xl tracking-[-0.05em]">{skillConfig.charLimit}</p>
          </div>
        </div>
        <div className="grid gap-2 rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-bg-main)] px-4 py-4 text-sm text-[color:var(--color-text-muted)]">
          <p>One chain per player. One visible step at a time.</p>
          <p>Mode, runtime, and spectator rules shape the room before launch.</p>
          <p>Scoring looks for: {activeMode.scoringRules.join(", ")}.</p>
          {!snapshot.isDemo ? (
            <p>Advanced relay mode rules save on demo/local rooms first. Live backend rooms still run classic relay.</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge>{getSkillModeConfig(settingsDraft.skillMode).label}</Badge>
          <Badge>{settingsDraft.quickPlayDiscoverable ? "Quick Play enabled" : "Invite only"}</Badge>
          <Badge>{experienceDraft.executionEnabled ? "Runtime enabled" : "Runtime locked"}</Badge>
        </div>
        <Button
          variant="secondary"
          onClick={onSaveExperience}
          disabled={!snapshot.isHost || submitting === "experience"}
        >
          {submitting === "experience" ? "Saving..." : "Save relay mode"}
        </Button>
      </Card>
    </section>
  );
}
