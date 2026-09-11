"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getGameIdBySlug,
  getTopScores,
  submitScore,
  type ScoreRow,
} from "@/app/actions/scores";
import TopScores from "@/app/components/TopScores";

// ── Constants ─────────────────────────────────────────────────────────────────
const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

const COLORS: (string | null)[] = [
  null,
  "#4dd0e1",
  "#ffd54f",
  "#ba68c8",
  "#81c784",
  "#e57373",
  "#90caf9",
  "#ffb74d",
  "#9e9e9e",
];

const PIECES: (number[][] | null)[] = [
  null,
  [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  [
    [2, 2],
    [2, 2],
  ],
  [
    [0, 3, 0],
    [3, 3, 3],
    [0, 0, 0],
  ],
  [
    [0, 4, 4],
    [4, 4, 0],
    [0, 0, 0],
  ],
  [
    [5, 5, 0],
    [0, 5, 5],
    [0, 0, 0],
  ],
  [
    [6, 0, 0],
    [6, 6, 6],
    [0, 0, 0],
  ],
  [
    [0, 0, 7],
    [7, 7, 7],
    [0, 0, 0],
  ],
  [
    [8, 8, 8],
    [8, 0, 8],
    [8, 8, 8],
  ],
];

const LINE_SCORES = [0, 100, 300, 500, 800];

const LS_KEY = "playerName";

type Piece = { type: number; shape: number[][]; x: number; y: number };
type GameState = "playing" | "paused" | "gameover";

// ── Game logic helpers (pure, no DOM) ─────────────────────────────────────────
function createBoard(): number[][] {
  return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
}

function randomPiece(): Piece {
  const type = Math.floor(Math.random() * 8) + 1;
  const shape = (PIECES[type] as number[][]).map((row) => [...row]);
  return {
    type,
    shape,
    x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
    y: 0,
  };
}

function collide(
  board: number[][],
  shape: number[][],
  ox: number,
  oy: number,
): boolean {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nx = ox + c;
      const ny = oy + r;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && board[ny][nx]) return true;
    }
  }
  return false;
}

function rotateCW(shape: number[][]): number[][] {
  const rows = shape.length,
    cols = shape[0].length;
  const result = Array.from({ length: cols }, () => new Array(rows).fill(0));
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) result[c][rows - 1 - r] = shape[r][c];
  return result;
}

function ghostY(board: number[][], piece: Piece): number {
  let gy = piece.y;
  while (!collide(board, piece.shape, piece.x, gy + 1)) gy++;
  return gy;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function TetrisGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nextCanvasRef = useRef<HTMLCanvasElement>(null);

  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameState, setGameState] = useState<GameState>("playing");

  // Refs so game loop reads current values without stale closures
  const scoreRef = useRef(0);
  const gameStateRef = useRef<GameState>("playing");

  // Modal state
  const [gameId, setGameId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState(() =>
    typeof window !== "undefined" ? (localStorage.getItem(LS_KEY) ?? "") : "",
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [top5, setTop5] = useState<ScoreRow[]>([]);

  // Expose restart so the overlay button can call it
  const restartRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    getGameIdBySlug("tetris").then(setGameId);
  }, []);

  const handleGameOver = useCallback(() => {
    setSubmitted(false);
    setSubmitError(null);
    setTop5([]);
  }, []);

  const prevStateRef = useRef<GameState>("playing");
  useEffect(() => {
    if (prevStateRef.current !== "gameover" && gameState === "gameover") {
      handleGameOver();
    }
    prevStateRef.current = gameState;
  }, [gameState, handleGameOver]);

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

  useEffect(() => {
    const canvasMaybe = canvasRef.current;
    const nextCanvasMaybe = nextCanvasRef.current;
    if (!canvasMaybe || !nextCanvasMaybe) return;
    const canvas: HTMLCanvasElement = canvasMaybe;
    const nextCanvas: HTMLCanvasElement = nextCanvasMaybe;
    const ctxMaybe = canvas.getContext("2d");
    const nextCtxMaybe = nextCanvas.getContext("2d");
    if (!ctxMaybe || !nextCtxMaybe) return;
    const ctx: CanvasRenderingContext2D = ctxMaybe;
    const nextCtx: CanvasRenderingContext2D = nextCtxMaybe;

    let board: number[][];
    let current: Piece;
    let next: Piece;
    let scoreLocal: number;
    let linesLocal: number;
    let levelLocal: number;
    let paused: boolean;
    let gameOver: boolean;
    let lastTime: number;
    let dropAccum: number;
    let dropInterval: number;
    let animId: number;

    function updateHUD() {
      scoreRef.current = scoreLocal;
      setScore(scoreLocal);
      setLines(linesLocal);
      setLevel(levelLocal);
    }

    function drawBlock(
      context: CanvasRenderingContext2D,
      x: number,
      y: number,
      colorIndex: number,
      size: number,
      alpha?: number,
    ) {
      if (!colorIndex) return;
      const color = COLORS[colorIndex] as string;
      context.globalAlpha = alpha ?? 1;
      context.fillStyle = color;
      context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
      context.fillStyle = "rgba(255,255,255,0.12)";
      context.fillRect(x * size + 1, y * size + 1, size - 2, 4);
      context.globalAlpha = 1;
    }

    function drawGrid() {
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 0.5;
      for (let c = 1; c < COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * BLOCK, 0);
        ctx.lineTo(c * BLOCK, ROWS * BLOCK);
        ctx.stroke();
      }
      for (let r = 1; r < ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * BLOCK);
        ctx.lineTo(COLS * BLOCK, r * BLOCK);
        ctx.stroke();
      }
    }

    function drawNext() {
      const NB = 30;
      nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
      nextCtx.fillStyle = "#000";
      nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
      const shape = next.shape;
      const offX = Math.floor((4 - shape[0].length) / 2);
      const offY = Math.floor((4 - shape.length) / 2);
      for (let r = 0; r < shape.length; r++)
        for (let c = 0; c < shape[r].length; c++)
          drawBlock(nextCtx, offX + c, offY + r, shape[r][c], NB);
    }

    function draw() {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawGrid();

      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++) drawBlock(ctx, c, r, board[r][c], BLOCK);

      const gy = ghostY(board, current);
      for (let r = 0; r < current.shape.length; r++)
        for (let c = 0; c < current.shape[r].length; c++)
          if (current.shape[r][c])
            drawBlock(
              ctx,
              current.x + c,
              gy + r,
              current.shape[r][c],
              BLOCK,
              0.2,
            );

      for (let r = 0; r < current.shape.length; r++)
        for (let c = 0; c < current.shape[r].length; c++)
          drawBlock(
            ctx,
            current.x + c,
            current.y + r,
            current.shape[r][c],
            BLOCK,
          );
    }

    function merge() {
      for (let r = 0; r < current.shape.length; r++)
        for (let c = 0; c < current.shape[r].length; c++)
          if (current.shape[r][c])
            board[current.y + r][current.x + c] = current.shape[r][c];
    }

    function clearLines() {
      let cleared = 0;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (board[r].every((v) => v !== 0)) {
          board.splice(r, 1);
          board.unshift(new Array(COLS).fill(0));
          cleared++;
          r++;
        }
      }
      if (cleared) {
        linesLocal += cleared;
        scoreLocal += (LINE_SCORES[cleared] ?? 0) * levelLocal;
        levelLocal = Math.floor(linesLocal / 10) + 1;
        dropInterval = Math.max(100, 1000 - (levelLocal - 1) * 90);
        updateHUD();
      }
    }

    function spawn() {
      current = next;
      next = randomPiece();
      if (collide(board, current.shape, current.x, current.y)) {
        endGame();
      }
      drawNext();
    }

    function endGame() {
      gameOver = true;
      cancelAnimationFrame(animId);
      gameStateRef.current = "gameover";
      setGameState("gameover");
    }

    function lockPiece() {
      merge();
      clearLines();
      spawn();
    }

    function hardDrop() {
      const gy = ghostY(board, current);
      scoreLocal += (gy - current.y) * 2;
      current.y = gy;
      lockPiece();
      updateHUD();
    }

    function softDrop() {
      if (!collide(board, current.shape, current.x, current.y + 1)) {
        current.y++;
        scoreLocal += 1;
        updateHUD();
      } else {
        lockPiece();
      }
    }

    function tryRotate() {
      const rotated = rotateCW(current.shape);
      const kicks = [0, -1, 1, -2, 2];
      for (const kick of kicks) {
        if (!collide(board, rotated, current.x + kick, current.y)) {
          current.shape = rotated;
          current.x += kick;
          return;
        }
      }
    }

    function togglePause() {
      if (gameOver) return;
      paused = !paused;
      if (!paused) {
        lastTime = performance.now();
        gameStateRef.current = "playing";
        setGameState("playing");
        loop(lastTime);
      } else {
        cancelAnimationFrame(animId);
        gameStateRef.current = "paused";
        setGameState("paused");
      }
    }

    function loop(ts: number) {
      const dt = ts - lastTime;
      lastTime = ts;
      dropAccum += dt;
      if (dropAccum >= dropInterval) {
        dropAccum = 0;
        if (!collide(board, current.shape, current.x, current.y + 1)) {
          current.y++;
        } else {
          lockPiece();
        }
      }
      if (gameOver) return;
      draw();
      animId = requestAnimationFrame(loop);
    }

    function init() {
      board = createBoard();
      scoreLocal = 0;
      linesLocal = 0;
      levelLocal = 1;
      paused = false;
      gameOver = false;
      dropInterval = 1000;
      dropAccum = 0;
      lastTime = performance.now();
      next = randomPiece();
      spawn();
      updateHUD();
      gameStateRef.current = "playing";
      setGameState("playing");
      cancelAnimationFrame(animId);
      animId = requestAnimationFrame(loop);
    }

    restartRef.current = init;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "KeyP") {
        togglePause();
        return;
      }
      if (paused || gameOver) return;
      switch (e.code) {
        case "ArrowLeft":
          if (!collide(board, current.shape, current.x - 1, current.y))
            current.x--;
          break;
        case "ArrowRight":
          if (!collide(board, current.shape, current.x + 1, current.y))
            current.x++;
          break;
        case "ArrowDown":
          softDrop();
          break;
        case "ArrowUp":
        case "KeyX":
          tryRotate();
          break;
        case "Space":
          e.preventDefault();
          hardDrop();
          break;
      }
      updateHUD();
    };

    window.addEventListener("keydown", onKeyDown);
    init();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const showGameOver = gameState === "gameover";
  const showPause = gameState === "paused";

  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
      {/* Canvas + overlays */}
      <div style={{ position: "relative", lineHeight: 0 }}>
        <div
          style={{
            border: "1px solid rgba(0,245,255,0.18)",
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          <canvas
            ref={canvasRef}
            width={300}
            height={600}
            style={{ display: "block" }}
          />
        </div>
        {/* Pause overlay */}
        {showPause && (
          <div style={overlayStyle}>
            <div style={overlayTitleStyle}>PAUSA</div>
            <p style={overlayHintStyle}>P PARA REANUDAR</p>
          </div>
        )}
        {/* Game Over overlay */}
        {showGameOver && (
          <div style={overlayStyle}>
            <div style={overlayTitleStyle}>GAME OVER</div>
            <div
              style={{
                color: "var(--ink-dim, #8a8fb5)",
                fontFamily: "var(--mono, monospace)",
                fontSize: 13,
              }}
            >
              Puntuación final:{" "}
              <strong style={{ color: "var(--ink, #e6e9ff)" }}>
                {score.toLocaleString("es-ES")}
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
                  maxWidth: 260,
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
                  maxWidth: 280,
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
            <button
              onClick={() => restartRef.current?.()}
              style={{
                marginTop: 4,
                padding: "6px 20px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 4,
                color: "var(--ink-dim, #8a8fb5)",
                fontFamily: "var(--mono, monospace)",
                fontSize: 12,
                cursor: "pointer",
                letterSpacing: "0.1em",
              }}
            >
              REINICIAR
            </button>
          </div>
        )}
      </div>
      {/* HUD lateral */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          fontFamily: "var(--mono, monospace)",
          minWidth: 120,
        }}
      >
        {/* Next piece */}
        <div style={hudCardStyle}>
          <div style={hudLabelStyle}>SIGUIENTE</div>
          <canvas
            ref={nextCanvasRef}
            width={120}
            height={120}
            style={{ display: "block" }}
          />
        </div>
        {/* Score */}
        <div style={hudCardStyle}>
          <div style={hudLabelStyle}>PUNTUACIÓN</div>
          <div style={hudValueStyle}>{score.toLocaleString("es-ES")}</div>
        </div>
        {/* Lines */}
        <div style={hudCardStyle}>
          <div style={hudLabelStyle}>LÍNEAS</div>
          <div style={hudValueStyle}>{lines}</div>
        </div>
        {/* Level */}
        <div style={hudCardStyle}>
          <div style={hudLabelStyle}>NIVEL</div>
          <div style={hudValueStyle}>{level}</div>
        </div>
        {/* Controls hint */}
        <div
          style={{
            color: "var(--ink-faint, #4a4f70)",
            fontSize: 10,
            lineHeight: 1.7,
            letterSpacing: "0.06em",
          }}
        >
          <div>← → MOVER</div>
          <div>↑ / X ROTAR</div>
          <div>↓ BAJAR</div>
          <div>ESPACIO CAÍDA</div>
          <div>P PAUSA</div>
        </div>
      </div>
    </div>
  );
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const overlayStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "rgba(0,0,0,0.85)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  gap: 16,
};

const overlayTitleStyle: React.CSSProperties = {
  fontFamily: "var(--mono, monospace)",
  color: "var(--cyan, #00f5ff)",
  fontSize: 32,
  fontWeight: 700,
  letterSpacing: "0.12em",
};

const overlayHintStyle: React.CSSProperties = {
  color: "var(--ink-faint, #4a4f70)",
  fontFamily: "var(--mono, monospace)",
  fontSize: 11,
  marginTop: 4,
};

const hudCardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(0,245,255,0.18)",
  borderRadius: 4,
  padding: "8px 12px",
};

const hudLabelStyle: React.CSSProperties = {
  color: "var(--ink-dim, #8a8fb5)",
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  marginBottom: 4,
};

const hudValueStyle: React.CSSProperties = {
  color: "var(--cyan, #00f5ff)",
  fontWeight: 700,
  fontSize: 20,
};
