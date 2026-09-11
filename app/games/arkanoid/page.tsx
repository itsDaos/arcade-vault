"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ArkanoidGame, { type ArkanoidHUD } from "./ArkanoidGame";
import {
  getGameIdBySlug,
  getTopScores,
  submitScore,
  type ScoreRow,
} from "@/app/actions/scores";
import TopScores from "@/app/components/TopScores";

const INITIAL_HUD: ArkanoidHUD = {
  score: 0,
  lives: 3,
  level: 1,
  gameState: "playing",
};

const LS_KEY = "playerName";

export default function ArkanoidPage() {
  const [hud, setHud] = useState<ArkanoidHUD>(INITIAL_HUD);
  const onHUD = useCallback((next: ArkanoidHUD) => setHud(next), []);

  const [gameId, setGameId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [top5, setTop5] = useState<ScoreRow[]>([]);
  const prevState = useRef<string>("playing");

  useEffect(() => {
    getGameIdBySlug("arkanoid").then(setGameId);
  }, []);

  useEffect(() => {
    setPlayerName(localStorage.getItem(LS_KEY) ?? "");
  }, []);

  useEffect(() => {
    const ended = hud.gameState === "gameover" || hud.gameState === "win";
    const wasEnded =
      prevState.current === "gameover" || prevState.current === "win";
    if (!wasEnded && ended) {
      setSubmitted(false);
      setSubmitError(null);
      setTop5([]);
    }
    prevState.current = hud.gameState;
  }, [hud.gameState]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!gameId || !playerName.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitScore(gameId, playerName.trim(), hud.score);
      localStorage.setItem(LS_KEY, playerName.trim());
      const rows = await getTopScores(gameId, 5);
      setTop5(rows);
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSubmitting(false);
    }
  }

  const isEnded = hud.gameState === "gameover" || hud.gameState === "win";
  const overlayTitle =
    hud.gameState === "win" ? "¡COMPLETASTE EL JUEGO!" : "GAME OVER";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 800, position: "relative" }}>
        {/* HUD externo */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 12px",
            marginBottom: 6,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(0,245,255,0.18)",
            borderRadius: 4,
            fontFamily: "var(--mono, monospace)",
            fontSize: 13,
            letterSpacing: "0.08em",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span
              style={{
                color: "var(--ink-dim, #8a8fb5)",
                fontSize: 10,
                textTransform: "uppercase",
              }}
            >
              Puntuación
            </span>
            <span
              style={{
                color: "var(--cyan, #00f5ff)",
                fontWeight: 700,
                fontSize: 18,
              }}
            >
              {hud.score.toLocaleString("es-ES")}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <span
              style={{
                color: "var(--ink-dim, #8a8fb5)",
                fontSize: 10,
                textTransform: "uppercase",
              }}
            >
              Nivel
            </span>
            <span
              style={{
                color: "var(--ink, #e6e9ff)",
                fontWeight: 700,
                fontSize: 18,
              }}
            >
              {hud.level} / 5
            </span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 2,
            }}
          >
            <span
              style={{
                color: "var(--ink-dim, #8a8fb5)",
                fontSize: 10,
                textTransform: "uppercase",
              }}
            >
              Vidas
            </span>
            <span
              style={{
                color: "var(--ink, #e6e9ff)",
                fontSize: 18,
                letterSpacing: "0.2em",
              }}
            >
              {"●".repeat(Math.max(0, hud.lives))}
            </span>
          </div>
        </div>
        {/* Canvas wrapper */}
        <div style={{ position: "relative" }}>
          <div
            style={{
              border: "1px solid rgba(0,245,255,0.18)",
              borderRadius: 4,
              overflow: "hidden",
              lineHeight: 0,
            }}
          >
            <ArkanoidGame onHUD={onHUD} />
          </div>
          {/* Game Over / Victory overlay */}
          {isEnded && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.82)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: 24,
                gap: 16,
              }}
            >
              <div
                style={{
                  fontFamily: "var(--mono, monospace)",
                  color: "var(--cyan, #00f5ff)",
                  fontSize: 28,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textAlign: "center",
                }}
              >
                {overlayTitle}
              </div>
              <div
                style={{
                  color: "var(--ink-dim, #8a8fb5)",
                  fontFamily: "var(--mono, monospace)",
                  fontSize: 13,
                }}
              >
                Puntuación final:{" "}
                <strong style={{ color: "var(--ink, #e6e9ff)" }}>
                  {hud.score.toLocaleString("es-ES")}
                </strong>
              </div>
              {!submitted ? (
                <form
                  onSubmit={handleSubmit}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    maxWidth: 300,
                  }}
                >
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Tu nombre (máx. 20 caracteres)"
                    maxLength={20}
                    required
                    autoFocus
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(0,245,255,0.35)",
                      borderRadius: 4,
                      color: "var(--ink, #e6e9ff)",
                      fontFamily: "var(--mono, monospace)",
                      fontSize: 14,
                      outline: "none",
                      textAlign: "center",
                    }}
                  />
                  <button
                    type="submit"
                    disabled={submitting || !playerName.trim()}
                    style={{
                      padding: "8px 24px",
                      background: submitting
                        ? "rgba(0,245,255,0.15)"
                        : "rgba(0,245,255,0.2)",
                      border: "1px solid rgba(0,245,255,0.5)",
                      borderRadius: 4,
                      color: "var(--cyan, #00f5ff)",
                      fontFamily: "var(--mono, monospace)",
                      fontSize: 13,
                      cursor: submitting ? "not-allowed" : "pointer",
                      letterSpacing: "0.1em",
                    }}
                  >
                    {submitting ? "GUARDANDO…" : "GUARDAR SCORE"}
                  </button>
                  {submitError && (
                    <p
                      style={{
                        color: "#ff4466",
                        fontFamily: "var(--mono, monospace)",
                        fontSize: 11,
                        textAlign: "center",
                        margin: 0,
                      }}
                    >
                      {submitError}
                    </p>
                  )}
                </form>
              ) : (
                <div
                  style={{
                    width: "100%",
                    maxWidth: 340,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(0,245,255,0.15)",
                    borderRadius: 4,
                    padding: 12,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--mono, monospace)",
                      fontSize: 10,
                      color: "var(--ink-dim, #8a8fb5)",
                      marginBottom: 8,
                      letterSpacing: "0.12em",
                    }}
                  >
                    TOP 5
                  </div>
                  <TopScores rows={top5} highlightScore={hud.score} />
                </div>
              )}
            </div>
          )}
        </div>
        <p
          style={{
            textAlign: "center",
            marginTop: 10,
            color: "var(--ink-faint, #4a4f70)",
            fontFamily: "var(--mono, monospace)",
            fontSize: 11,
            letterSpacing: "0.12em",
          }}
        >
          ← → MOVER · MOUSE PADDLE · P / ESC PAUSA
        </p>
      </div>
    </main>
  );
}
