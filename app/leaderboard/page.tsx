import { supabase } from "@/lib/supabase";
import { getTopScores } from "@/app/actions/scores";
import TopScores from "@/app/components/TopScores";

type Game = { id: string; slug: string; name: string };

async function getGames(): Promise<Game[]> {
  const { data } = await supabase
    .from("games")
    .select("id, slug, name")
    .order("name");
  return data ?? [];
}

type Props = {
  searchParams: Promise<{ game?: string }>;
};

export default async function LeaderboardPage({ searchParams }: Props) {
  const { game: gameSlug } = await searchParams;
  const games = await getGames();
  const selected = games.find((g) => g.slug === gameSlug) ?? games[0];
  const rows = selected ? await getTopScores(selected.id, 10) : [];

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--bg, #08090f)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "60px 16px 40px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 600 }}>
        <h1
          style={{
            fontFamily: "var(--mono, monospace)",
            fontSize: 28,
            fontWeight: 700,
            color: "var(--cyan, #00f5ff)",
            letterSpacing: "0.14em",
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          LEADERBOARD
        </h1>
        {games.length > 1 && (
          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "center",
              marginBottom: 24,
              flexWrap: "wrap",
            }}
          >
            {games.map((g) => (
              <a
                key={g.id}
                href={`/leaderboard?game=${g.slug}`}
                style={{
                  padding: "5px 16px",
                  borderRadius: 4,
                  border: "1px solid rgba(0,245,255,0.35)",
                  background:
                    selected?.id === g.id
                      ? "rgba(0,245,255,0.15)"
                      : "transparent",
                  color:
                    selected?.id === g.id
                      ? "var(--cyan, #00f5ff)"
                      : "var(--ink-dim, #8a8fb5)",
                  fontFamily: "var(--mono, monospace)",
                  fontSize: 12,
                  letterSpacing: "0.1em",
                  textDecoration: "none",
                }}
              >
                {g.name.toUpperCase()}
              </a>
            ))}
          </div>
        )}
        {selected && (
          <p
            style={{
              textAlign: "center",
              fontFamily: "var(--mono, monospace)",
              fontSize: 12,
              color: "var(--ink-dim, #8a8fb5)",
              marginBottom: 20,
              letterSpacing: "0.1em",
            }}
          >
            {selected.name.toUpperCase()} · TOP 10
          </p>
        )}
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(0,245,255,0.12)",
            borderRadius: 6,
            padding: 16,
          }}
        >
          <TopScores rows={rows} />
        </div>
      </div>
    </main>
  );
}
