import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const playerCount = Number(process.env.LOAD_PLAYER_COUNT ?? 12);
const roundCount = Number(process.env.LOAD_ROUND_COUNT ?? 3);

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY before running the load harness.",
  );
}

const loadSupabaseUrl = supabaseUrl;
const loadSupabaseKey = supabaseKey;

async function createPlayer(index: number) {
  const client = createClient(loadSupabaseUrl, loadSupabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { error } = await client.auth.signInAnonymously({
    options: {
      data: {
        nickname: `LoadBot${index + 1}`,
      },
    },
  });

  if (error) {
    throw error;
  }

  return client;
}

async function main() {
  const players = await Promise.all(
    Array.from({ length: playerCount }, (_, index) => createPlayer(index)),
  );

  const host = players[0];
  const { data: createdRoom, error: createError } = await host.rpc("create_room", {
    p_nickname: "LoadHost",
    p_room_name: "Load Test Room",
    p_visibility: "private",
    p_skill_mode: "intermediate",
    p_language_mode: "single",
    p_language_pool: ["javascript", "python", "typescript"],
    p_single_language: "javascript",
    p_round_count: roundCount,
    p_player_cap: playerCount,
    p_profanity_filter_enabled: true,
    p_quick_play_discoverable: false,
  });

  if (createError) {
    throw createError;
  }

  const roomCode = createdRoom.room_code as string;

  await Promise.all(
    players.slice(1).map((player, index) =>
      player.rpc("join_room", {
        p_room_code: roomCode,
        p_nickname: `LoadBot${index + 2}`,
        p_as_spectator: false,
      }),
    ),
  );

  await Promise.all(
    players.map((player) =>
      player.rpc("toggle_ready", {
        p_room_code: roomCode,
        p_ready: true,
      }),
    ),
  );

  const { error: startError } = await host.rpc("start_game", {
    p_room_code: roomCode,
  });

  if (startError) {
    throw startError;
  }

  for (let roundIndex = 0; roundIndex <= roundCount; roundIndex += 1) {
    await Promise.all(
      players.map((player, playerIndex) =>
        player.rpc("submit_round_entry", {
          p_room_code: roomCode,
          p_text:
            roundIndex === 0
              ? `Load test starter prompt ${playerIndex + 1}`
              : roundIndex % 2 === 1
                ? `// Load test code round ${roundIndex} from player ${playerIndex + 1}`
                : `Description for round ${roundIndex} from player ${playerIndex + 1}`,
          p_prompt_record_id: null,
          p_prompt_source_type: "custom",
        }),
      ),
    );
  }

  const adminProbe = createClient(loadSupabaseUrl, loadSupabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: room } = await adminProbe
    .from("rooms")
    .select("current_game_id")
    .eq("code", roomCode)
    .single();

  if (!room?.current_game_id) {
    throw new Error(`Load harness could not resolve a current game for room ${roomCode}.`);
  }

  const { data: game } = await adminProbe
    .from("games")
    .select("phase, replay_slug")
    .eq("id", room.current_game_id)
    .single();

  if (!game) {
    throw new Error(`Load harness could not resolve the final game record for room ${roomCode}.`);
  }

  console.log(
    JSON.stringify(
      {
        roomCode,
        playerCount,
        roundCount,
        finalPhase: game.phase,
        replaySlug: game.replay_slug,
      },
      null,
      2,
    ),
  );
}

void main();
