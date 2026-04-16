"use client";

import { useMemo } from "react";
import type { RoomSnapshot } from "@/features/game/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { SelectableChip } from "@/components/ui/chip";
import {
  getAllowedLanguagesForSkillMode,
  getLanguageLabel,
  getSkillModeConfig,
  normalizeRoomSettings,
} from "@/features/game/logic";

export function RoomLobby({
  snapshot,
  settingsDraft,
  setSettingsDraft,
  onSaveSettings,
  submitting,
}: {
  snapshot: RoomSnapshot;
  settingsDraft: RoomSnapshot["settings"];
  setSettingsDraft: (next: RoomSnapshot["settings"]) => void;
  onSaveSettings: () => void;
  submitting: string | null;
}) {
  const skillConfig = getSkillModeConfig(settingsDraft.skillMode);
  const availableLanguages = useMemo(
    () => getAllowedLanguagesForSkillMode(settingsDraft.skillMode),
    [settingsDraft.skillMode],
  );

  const applySettingsDraft = (patch: Partial<RoomSnapshot["settings"]>) => {
    setSettingsDraft(
      normalizeRoomSettings({
        ...settingsDraft,
        ...patch,
      }),
    );
  };

  return (
    <section className="grid gap-6 xl:grid-cols-[1fr_0.94fr]">
      <Card className="space-y-5">
        <div>
          <Badge>Host Panel</Badge>
          <CardTitle className="mt-3">Tune the lobby before launch.</CardTitle>
          <CardDescription className="mt-2">
            Hosts can edit the room here. Everyone else sees the settings update live as the match gets ready.
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
          <Badge>Room Limits</Badge>
          <CardTitle className="mt-3">Current round profile</CardTitle>
          <CardDescription className="mt-2">
            Relay enforces these limits on both the client and server so the game stays fast and readable.
          </CardDescription>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="stack-panel px-4 py-4">
            <p className="text-[0.7rem] uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
              Timer
            </p>
            <p className="mt-2 font-display text-3xl tracking-[-0.05em]">{skillConfig.timerSeconds}s</p>
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
        <div className="stack-panel space-y-3 px-5 py-5 text-sm leading-7 text-[color:var(--color-muted)]">
          <p>Every player seeds one chain during the prompt phase.</p>
          <p>Code and description alternate automatically until the reveal.</p>
          <p>The room-wide language applies to every code step in that round.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>{getSkillModeConfig(settingsDraft.skillMode).label}</Badge>
          <Badge>{settingsDraft.quickPlayDiscoverable ? "Quick Play enabled" : "Invite only"}</Badge>
        </div>
      </Card>
    </section>
  );
}
