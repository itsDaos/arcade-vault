"use client";

import { useCallback, useState } from "react";
import AsteroidsGame, { type GameHUD } from "./AsteroidsGame";

const INITIAL_HUD: GameHUD = {
  score: 0,
  lives: 3,
  level: 1,
  tripleShot: 0,
  state: "playing",
};

export default function AsteroidsPage() {
  const [hud, setHud] = useState<GameHUD>(INITIAL_HUD);
  const onHUD = useCallback((next: GameHUD) => setHud(next), []);

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
      <div style={{ width: "100%", maxWidth: 800 }}>
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
          {/* Score */}
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
          {/* Nivel */}
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
              {String(hud.level).padStart(2, "0")}
            </span>
          </div>
          {/* Triple shot */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              minWidth: 60,
            }}
          >
            {hud.tripleShot > 0 && (
              <>
                <span
                  style={{
                    color: "var(--ink-dim, #8a8fb5)",
                    fontSize: 10,
                    textTransform: "uppercase",
                  }}
                >
                  Power-up
                </span>
                <span style={{ color: "#0ff", fontWeight: 700, fontSize: 18 }}>
                  3× {hud.tripleShot.toFixed(1)}s
                </span>
              </>
            )}
          </div>
          {/* Vidas */}
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
              {"▲".repeat(Math.max(0, hud.lives))}
            </span>
          </div>
        </div>
        {/* Canvas */}
        <div
          style={{
            border: "1px solid rgba(0,245,255,0.18)",
            borderRadius: 4,
            overflow: "hidden",
            lineHeight: 0,
          }}
        >
          <AsteroidsGame onHUD={onHUD} />
        </div>
        {/* Controls hint */}
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
          ↑ IMPULSO · ← → GIRAR · ESPACIO DISPARAR
        </p>
      </div>
    </main>
  );
}
