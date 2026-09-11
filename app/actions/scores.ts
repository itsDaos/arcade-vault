import { supabase } from "@/lib/supabase";

export type ScoreRow = {
  rank: number;
  player_name: string;
  score: number;
  created_at: string;
};

export async function submitScore(
  gameId: string,
  playerName: string,
  score: number,
): Promise<void> {
  const { error } = await supabase
    .from("scores")
    .insert({ game_id: gameId, player_name: playerName.trim(), score });
  if (error) throw new Error(error.message);
}

export async function getTopScores(
  gameId: string,
  limit = 10,
): Promise<ScoreRow[]> {
  const { data, error } = await supabase
    .from("scores")
    .select("player_name, score, created_at")
    .eq("game_id", gameId)
    .order("score", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row, i) => ({ rank: i + 1, ...row }));
}

export async function getAsteroidsGameId(): Promise<string | null> {
  const { data } = await supabase
    .from("games")
    .select("id")
    .eq("slug", "asteroids")
    .single();
  return data?.id ?? null;
}
