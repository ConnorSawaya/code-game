"use client";

import type { RoomSnapshot } from "@/features/game/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { SelectableChip } from "@/components/ui/chip";
import { getLanguageLabel, getSkillModeConfig } from "@/features/game/logic";

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

  return (
    <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
      <Card className="space-y-5">
        <CardTitle>Lobby Controls</CardTitle>
        <CardDescription>
          Hosts can fine-tune the room here. Everyone else sees the same settings live.
        </CardDescription>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel>Visibility</FieldLabel>
            <SegmentedControl
              value={settingsDraft.visibility}
              onChange={(value) => setSettingsDraft({ ...settingsDraft, visibility: value })}
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
              onChange={(value) => setSettingsDraft({ ...settingsDraft, skillMode: value })}
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
              onChange={(value) => setSettingsDraft({ ...settingsDraft, languageMode: value })}
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
                  setSettingsDraft({
                    ...settingsDraft,
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
                  setSettingsDraft({
                    ...settingsDraft,
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
            {snapshot.settings.languagePool.map((language) => (
              <SelectableChip
                key={language}
                selected={settingsDraft.languagePool.includes(language)}
                label={getLanguageLabel(language)}
                onClick={() =>
                  setSettingsDraft({
                    ...settingsDraft,
                    languagePool: settingsDraft.languagePool.includes(language)
                      ? settingsDraft.languagePool.filter((entry) => entry !== language)
                      : [...settingsDraft.languagePool, language],
                  })
                }
              />
            ))}
          </div>
        </Field>
        <Button onClick={onSaveSettings} disabled={!snapshot.isHost || submitting === "settings"}>
          {submitting === "settings" ? "Saving..." : "Save room settings"}
        </Button>
      </Card>
      <Card className="space-y-5">
        <CardTitle>Current Limits</CardTitle>
        <CardDescription>
          Relay enforces these on both client and server so rounds stay quick.
        </CardDescription>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-[22px] bg-white/80 p-4">
            <p className="text-sm text-[color:var(--color-muted)]">Timer</p>
            <p className="mt-2 font-display text-3xl tracking-[-0.04em]">{skillConfig.timerSeconds}s</p>
          </div>
          <div className="rounded-[22px] bg-white/80 p-4">
            <p className="text-sm text-[color:var(--color-muted)]">Lines</p>
            <p className="mt-2 font-display text-3xl tracking-[-0.04em]">{skillConfig.lineLimit}</p>
          </div>
          <div className="rounded-[22px] bg-white/80 p-4">
            <p className="text-sm text-[color:var(--color-muted)]">Chars</p>
            <p className="mt-2 font-display text-3xl tracking-[-0.04em]">{skillConfig.charLimit}</p>
          </div>
        </div>
        <div className="rounded-[24px] bg-white/80 p-5 text-sm leading-7 text-[color:var(--color-muted)]">
          <p>Prompt phase seeds one chain per player.</p>
          <p>Code and description alternate automatically until reveal.</p>
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
