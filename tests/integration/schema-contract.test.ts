import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const schemaSql = readFileSync(
  "supabase/migrations/20260414193000_extensions_and_tables.sql",
  "utf8",
);
const securitySql = readFileSync(
  "supabase/migrations/20260414194000_security_and_views.sql",
  "utf8",
);
const rpcSql = readFileSync(
  "supabase/migrations/20260414200000_rpc_functions.sql",
  "utf8",
);
const moderationSql = readFileSync(
  "supabase/migrations/20260414201000_room_moderation.sql",
  "utf8",
);

describe("schema contract", () => {
  it("defines the required product tables", () => {
    [
      "profiles",
      "rooms",
      "room_members",
      "games",
      "game_rounds",
      "chains",
      "chain_steps",
      "reveal_reactions",
      "replay_favorites",
      "reports",
      "room_bans",
    ].forEach((tableName) => {
      expect(schemaSql).toContain(`create table if not exists public.${tableName}`);
    });
  });

  it("enables row-level security and sanitized public views", () => {
    expect(securitySql).toContain("alter table public.rooms enable row level security");
    expect(securitySql).toContain("create or replace view public.public_room_summaries");
    expect(securitySql).toContain("create or replace view public.public_replay_shares");
  });

  it("exposes the core RPC gameplay surface", () => {
    [
      "create_room",
      "join_room",
      "quick_play",
      "toggle_ready",
      "update_room_settings",
      "start_game",
      "submit_round_entry",
      "advance_if_due",
      "react_reveal_step",
      "favorite_chain_step",
      "report_room",
      "report_replay",
      "pin_replay",
    ].forEach((functionName) => {
      expect(rpcSql).toContain(`function public.${functionName}`);
    });
  });

  it("includes spectator queueing and host moderation helpers", () => {
    expect(moderationSql).toContain("function public.toggle_next_game_queue");
    expect(moderationSql).toContain("function public.moderate_room_member");
  });
});
