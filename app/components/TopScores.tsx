import type { ScoreRow } from "@/app/actions/scores";

type Props = {
  rows: ScoreRow[];
  highlightScore?: number;
};

export default function TopScores({ rows, highlightScore }: Props) {
  if (rows.length === 0)
    return (
      <p
        style={{
          color: "var(--ink-dim, #8a8fb5)",
          fontFamily: "var(--mono, monospace)",
          fontSize: 12,
          textAlign: "center",
          margin: "8px 0",
        }}
      >
        Sin puntuaciones aún
      </p>
    );

  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        fontFamily: "var(--mono, monospace)",
        fontSize: 13,
      }}
    >
      <thead>
        <tr style={{ color: "var(--ink-dim, #8a8fb5)", fontSize: 10 }}>
          <th style={{ textAlign: "left", padding: "2px 6px" }}>#</th>
          <th style={{ textAlign: "left", padding: "2px 6px" }}>JUGADOR</th>
          <th style={{ textAlign: "right", padding: "2px 6px" }}>SCORE</th>
          <th style={{ textAlign: "right", padding: "2px 6px" }}>FECHA</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const isHighlight =
            highlightScore !== undefined && row.score === highlightScore;
          return (
            <tr
              key={`${row.rank}-${row.player_name}-${row.score}`}
              style={{
                color: isHighlight
                  ? "var(--cyan, #00f5ff)"
                  : "var(--ink, #e6e9ff)",
                background: isHighlight
                  ? "rgba(0,245,255,0.06)"
                  : "transparent",
              }}
            >
              <td style={{ padding: "3px 6px", opacity: 0.6 }}>{row.rank}</td>
              <td style={{ padding: "3px 6px" }}>{row.player_name}</td>
              <td
                style={{
                  padding: "3px 6px",
                  textAlign: "right",
                  fontWeight: 700,
                }}
              >
                {row.score.toLocaleString("es-ES")}
              </td>
              <td
                style={{
                  padding: "3px 6px",
                  textAlign: "right",
                  fontSize: 11,
                  opacity: 0.55,
                }}
              >
                {new Date(row.created_at).toLocaleDateString("es-ES")}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
