"use client";

import { useEffect, useRef, useState } from "react";
import {
  getGameIdBySlug,
  getTopScores,
  submitScore,
  type ScoreRow,
} from "@/app/actions/scores";
import TopScores from "@/app/components/TopScores";

const CELL = 20;
const COLS = 20;
const ROWS = 20;
const W = COLS * CELL; // 400
const H = ROWS * CELL; // 400

// Sprite atlas coords for apple in fruits.png
const APPLE = { x: 2786, y: 136, w: 110, h: 160 };

const LS_KEY = "playerName";

type Point = { x: number; y: number };
type Dir = "UP" | "DOWN" | "LEFT" | "RIGHT";

function randomFruit(snake: Point[]): Point {
  let pos: Point;
  do {
    pos = {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS),
    };
  } while (snake.some((s) => s.x === pos.x && s.y === pos.y));
  return pos;
}

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // HUD state
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);

  // Game Over overlay state
  const [gameId, setGameId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [top5, setTop5] = useState<ScoreRow[]>([]);

  // Refs to communicate game loop ↔ React state without re-creating effect
  const scoreRef = useRef(0);
  const gameOverRef = useRef(false);
  const restartRef = useRef(false);

  useEffect(() => {
    getGameIdBySlug("snake").then(setGameId);
    setPlayerName(localStorage.getItem(LS_KEY) ?? "");
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    if (!ctx) return;

    // Load sprite
    const img = new Image();
    img.src = "/games/snake/fruits.png";

    let snake: Point[];
    let dir: Dir;
    let nextDir: Dir;
    let fruit: Point;
    let fruitsEaten: number;
    let intervalMs: number;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    function initGame() {
      const cx = Math.floor(COLS / 2);
      const cy = Math.floor(ROWS / 2);
      snake = [
        { x: cx, y: cy },
        { x: cx - 1, y: cy },
        { x: cx - 2, y: cy },
      ];
      dir = "RIGHT";
      nextDir = "RIGHT";
      fruit = randomFruit(snake);
      fruitsEaten = 0;
      intervalMs = 150;
      scoreRef.current = 0;
      gameOverRef.current = false;
      setScore(0);
      setLevel(1);
      setGameOver(false);
    }

    function startInterval() {
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(tick, intervalMs);
    }

    function drawApple(x: number, y: number) {
      const padding = 2;
      ctx.drawImage(
        img,
        APPLE.x,
        APPLE.y,
        APPLE.w,
        APPLE.h,
        x * CELL + padding,
        y * CELL + padding,
        CELL - padding * 2,
        CELL - padding * 2,
      );
    }

    function drawSnake() {
      snake.forEach((seg, i) => {
        const isHead = i === 0;
        ctx.fillStyle = isHead ? "#22c55e" : "#16a34a";
        const r = 4;
        const px = seg.x * CELL + 1;
        const py = seg.y * CELL + 1;
        const size = CELL - 2;
        ctx.beginPath();
        ctx.roundRect(px, py, size, size, r);
        ctx.fill();
      });
    }

    function render() {
      // Background
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, W, H);

      // Subtle grid
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 0.5;
      for (let c = 0; c <= COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * CELL, 0);
        ctx.lineTo(c * CELL, H);
        ctx.stroke();
      }
      for (let r = 0; r <= ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * CELL);
        ctx.lineTo(W, r * CELL);
        ctx.stroke();
      }

      drawApple(fruit.x, fruit.y);
      drawSnake();
    }

    function tick() {
      if (gameOverRef.current) return;

      // Apply queued direction
      dir = nextDir;

      const head = snake[0];
      let nx = head.x;
      let ny = head.y;
      if (dir === "UP") ny--;
      else if (dir === "DOWN") ny++;
      else if (dir === "LEFT") nx--;
      else nx++;

      // Wall collision
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) {
        gameOverRef.current = true;
        setGameOver(true);
        if (intervalId) clearInterval(intervalId);
        return;
      }

      // Self collision (exclude tail tip which will be removed)
      const bodyToCheck = snake.slice(0, snake.length - 1);
      if (bodyToCheck.some((s) => s.x === nx && s.y === ny)) {
        gameOverRef.current = true;
        setGameOver(true);
        if (intervalId) clearInterval(intervalId);
        return;
      }

      const newHead: Point = { x: nx, y: ny };
      const ateF = nx === fruit.x && ny === fruit.y;

      if (ateF) {
        snake = [newHead, ...snake]; // grow: don't remove tail
        fruit = randomFruit(snake);
        fruitsEaten++;
        scoreRef.current = fruitsEaten;
        setScore(fruitsEaten);

        const newLevel = Math.floor(fruitsEaten / 5) + 1;
        setLevel(newLevel);

        // Speed up every 5 fruits
        const newMs = Math.max(60, 150 - Math.floor(fruitsEaten / 5) * 10);
        if (newMs !== intervalMs) {
          intervalMs = newMs;
          startInterval(); // restart interval with new speed
          return; // tick will be called by new interval
        }
      } else {
        snake = [newHead, ...snake.slice(0, snake.length - 1)];
      }

      render();
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        if (gameOverRef.current && !restartRef.current) {
          restartRef.current = true;
          // Defer to avoid state update in event handler
          setTimeout(() => {
            restartRef.current = false;
            initGame();
            render();
            startInterval();
          }, 0);
        }
        e.preventDefault();
        return;
      }

      // Direction controls — no 180° reversal
      if (e.code === "ArrowUp" && dir !== "DOWN") nextDir = "UP";
      else if (e.code === "ArrowDown" && dir !== "UP") nextDir = "DOWN";
      else if (e.code === "ArrowLeft" && dir !== "RIGHT") nextDir = "LEFT";
      else if (e.code === "ArrowRight" && dir !== "LEFT") nextDir = "RIGHT";

      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)
      ) {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    img.onload = () => {
      initGame();
      render();
      startInterval();
    };

    // If image already cached
    if (img.complete) {
      initGame();
      render();
      startInterval();
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!gameId || !playerName.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitScore(gameId, playerName.trim(), scoreRef.current);
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

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div style={{ width: W, position: "relative" }}>
        {/* HUD */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "8px 12px",
            marginBottom: 6,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(0,245,255,0.18)",
            borderRadius: 4,
            fontFamily: "var(--mono, monospace)",
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
              {score}
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
              Nivel
            </span>
            <span
              style={{
                color: "var(--ink, #e6e9ff)",
                fontWeight: 700,
                fontSize: 18,
              }}
            >
              {String(level).padStart(2, "0")}
            </span>
          </div>
        </div>
        {/* Canvas + overlay */}
        <div style={{ position: "relative", lineHeight: 0 }}>
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            style={{
              display: "block",
              border: "1px solid rgba(0,245,255,0.18)",
              borderRadius: 4,
            }}
          />
          {/* Game Over overlay */}
          {gameOver && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.85)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: 24,
                gap: 14,
                borderRadius: 4,
              }}
            >
              <div
                style={{
                  fontFamily: "var(--mono, monospace)",
                  color: "var(--cyan, #00f5ff)",
                  fontSize: 30,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                }}
              >
                GAME OVER
              </div>
              <div
                style={{
                  color: "var(--ink-dim, #8a8fb5)",
                  fontFamily: "var(--mono, monospace)",
                  fontSize: 13,
                }}
              >
                Score final:{" "}
                <strong style={{ color: "var(--ink, #e6e9ff)" }}>
                  {score}
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
                    maxWidth: 280,
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
                      boxSizing: "border-box",
                    }}
                  />
                  <button
                    type="submit"
                    disabled={submitting || !playerName.trim()}
                    style={{
                      padding: "8px 24px",
                      background: "rgba(0,245,255,0.2)",
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
                    maxWidth: 320,
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
                  <TopScores rows={top5} highlightScore={score} />
                </div>
              )}
              <p
                style={{
                  color: "var(--ink-faint, #4a4f70)",
                  fontFamily: "var(--mono, monospace)",
                  fontSize: 11,
                  margin: 0,
                }}
              >
                ESPACIO PARA REINICIAR
              </p>
            </div>
          )}
        </div>
        <p
          style={{
            textAlign: "center",
            marginTop: 8,
            color: "var(--ink-faint, #4a4f70)",
            fontFamily: "var(--mono, monospace)",
            fontSize: 11,
            letterSpacing: "0.1em",
          }}
        >
          ↑ ↓ ← → DIRECCIÓN · ESPACIO REINICIAR
        </p>
      </div>
    </main>
  );
}
