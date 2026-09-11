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

// Classic canonical Tetris piece colors (index 1-8)
const CLASSIC_COLORS: (string | null)[] = [
  null,
  "#4dd0e1", // I – cyan
  "#ffd54f", // O – yellow
  "#ba68c8", // T – purple
  "#81c784", // S – green
  "#e57373", // Z – red
  "#90caf9", // J – blue
  "#ffb74d", // L – orange
  "#9e9e9e", // bonus piece
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
const SKIN_LS_KEY = "arcade:skin:tetris";

// ── Skin types ────────────────────────────────────────────────────────────────
type SkinId = "classic" | "neon" | "retro";

interface Skin {
  id: SkinId;
  label: string;
  /** canvas background */
  bg: string;
  /** grid line color */
  grid: string;
  /** piece colors by index 1-8 */
  pieceColors: string[];
  /** highlight sheen on top of block */
  highlight: string;
  /** ghost piece alpha */
  ghostAlpha: number;
  /** HUD accent (score values, overlay title) */
  accent: string;
  /** HUD card border */
  cardBorder: string;
  /** HUD card background */
  cardBg: string;
  /** glow filter for neon – empty string to disable */
  glowFilter: string;
}

const SKINS: Record<SkinId, Skin> = {
  classic: {
    id: "classic",
    label: "CLASSIC",
    bg: "#000000",
    grid: "rgba(255,255,255,0.05)",
    pieceColors: [
      "", // 0 empty
      "#4dd0e1", // I
      "#ffd54f", // O
      "#ba68c8", // T
      "#81c784", // S
      "#e57373", // Z
      "#90caf9", // J
      "#ffb74d", // L
      "#9e9e9e", // bonus
    ],
    highlight: "rgba(255,255,255,0.18)",
    ghostAlpha: 0.2,
    accent: "#00f5ff",
    cardBorder: "rgba(0,245,255,0.18)",
    cardBg: "rgba(255,255,255,0.04)",
    glowFilter: "",
  },
  neon: {
    id: "neon",
    label: "NEON",
    bg: "#05050f",
    grid: "rgba(0,245,255,0.08)",
    pieceColors: [
      "",
      "#00f5ff", // I – cyan
      "#f5ff00", // O – yellow
      "#ff00cc", // T – magenta
      "#00ff88", // S – green
      "#ff3860", // Z – hot red
      "#7b2fff", // J – violet
      "#ff6b00", // L – neon orange
      "#cc00ff", // bonus – purple
    ],
    highlight: "rgba(255,255,255,0.25)",
    ghostAlpha: 0.15,
    accent: "#00f5ff",
    cardBorder: "rgba(0,245,255,0.35)",
    cardBg: "rgba(0,245,255,0.06)",
    glowFilter: "drop-shadow(0 0 4px currentColor)",
  },
  retro: {
    id: "retro",
    label: "RETRO",
    bg: "#0d0a00",
    grid: "rgba(255,176,0,0.08)",
    pieceColors: [
      "",
      "#ffb000", // I – amber
      "#39ff14", // O – phosphor green
      "#ffb000", // T – amber
      "#39ff14", // S – green
      "#ffb000", // Z – amber
      "#39ff14", // J – green
      "#ffb000", // L – amber
      "#c8a000", // bonus – dim amber
    ],
    highlight: "rgba(255,255,200,0.12)",
    ghostAlpha: 0.18,
    accent: "#ffb000",
    cardBorder: "rgba(255,176,0,0.25)",
    cardBg: "rgba(255,176,0,0.05)",
    glowFilter: "",
  },
};

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

  // Skin state
  const [skinId, setSkinId] = useState<SkinId>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(SKIN_LS_KEY) as SkinId | null;
      if (saved && saved in SKINS) return saved;
    }
    return "classic";
  });
  const skinRef = useRef<Skin>(SKINS[skinId]);

  useEffect(() => {
    skinRef.current = SKINS[skinId];
    if (typeof window !== "undefined") {
      localStorage.setItem(SKIN_LS_KEY, skinId);
    }
  }, [skinId]);

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
      const skin = skinRef.current;
      const color = skin.pieceColors[colorIndex];
      if (!color) return;
      context.globalAlpha = alpha ?? 1;
      context.fillStyle = color;
      context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
      // highlight sheen
      context.fillStyle = skin.highlight;
      context.fillRect(x * size + 1, y * size + 1, size - 2, 4);
      // neon glow via shadow
      if (skin.id === "neon") {
        context.shadowColor = color;
        context.shadowBlur = 8;
        context.fillStyle = color;
        context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
        context.shadowBlur = 0;
      }
      context.globalAlpha = 1;
    }

    function drawGrid() {
      const skin = skinRef.current;
      ctx.strokeStyle = skin.grid;
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
      const skin = skinRef.current;
      nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
      nextCtx.fillStyle = skin.bg;
      nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
      const shape = next.shape;
      const offX = Math.floor((4 - shape[0].length) / 2);
      const offY = Math.floor((4 - shape.length) / 2);
      for (let r = 0; r < shape.length; r++)
        for (let c = 0; c < shape[r].length; c++)
          drawBlock(nextCtx, offX + c, offY + r, shape[r][c], NB);
    }

    function draw() {
      const skin = skinRef.current;
      ctx.fillStyle = skin.bg;
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
              skin.ghostAlpha,
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

      // Retro CRT scanline overlay
      if (skin.id === "retro") {
        ctx.fillStyle = "rgba(0,0,0,0.12)";
        for (let y = 0; y < ROWS * BLOCK; y += 4) {
          ctx.fillRect(0, y, COLS * BLOCK, 2);
        }
      }
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

  const skin = SKINS[skinId];
  const showGameOver = gameState === "gameover";
  const showPause = gameState === "paused";

  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
      {/* Canvas + overlays */}
      <div style={{ position: "relative", lineHeight: 0 }}>
        <div
          style={{
            border: `1px solid ${skin.cardBorder}`,
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
            <div style={{ ...overlayTitleStyle, color: skin.accent }}>
              PAUSA
            </div>
            <p style={overlayHintStyle}>P PARA REANUDAR</p>
          </div>
        )}
        {/* Game Over overlay */}
        {showGameOver && (
          <div style={overlayStyle}>
            <div style={{ ...overlayTitleStyle, color: skin.accent }}>
              GAME OVER
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
                    border: `1px solid ${skin.cardBorder}`,
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
                    background: skin.cardBg,
                    border: `1px solid ${skin.cardBorder}`,
                    borderRadius: 4,
                    color: skin.accent,
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
                  background: skin.cardBg,
                  border: `1px solid ${skin.cardBorder}`,
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
        {/* Skin selector */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div style={{ ...hudLabelStyle, color: "var(--ink-faint, #4a4f70)" }}>
            SKIN
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {(Object.keys(SKINS) as SkinId[]).map((id) => {
              const s = SKINS[id];
              const active = id === skinId;
              return (
                <button
                  key={id}
                  onClick={() => setSkinId(id)}
                  style={{
                    flex: 1,
                    padding: "4px 2px",
                    fontSize: 8,
                    fontFamily: "var(--pixel, monospace)",
                    letterSpacing: "0.08em",
                    background: active ? s.cardBg : "transparent",
                    border: `1px solid ${active ? s.accent : "rgba(255,255,255,0.12)"}`,
                    borderRadius: 3,
                    color: active ? s.accent : "var(--ink-faint, #4a4f70)",
                    cursor: "pointer",
                    transition: "all 140ms",
                    boxShadow: active ? `0 0 8px ${s.accent}44` : "none",
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
        {/* Next piece */}
        <div style={makeHudCard(skin)}>
          <div style={hudLabelStyle}>SIGUIENTE</div>
          <canvas
            ref={nextCanvasRef}
            width={120}
            height={120}
            style={{ display: "block" }}
          />
        </div>
        {/* Score */}
        <div style={makeHudCard(skin)}>
          <div style={hudLabelStyle}>PUNTUACIÓN</div>
          <div style={{ ...hudValueStyle, color: skin.accent }}>
            {score.toLocaleString("es-ES")}
          </div>
        </div>
        {/* Lines */}
        <div style={makeHudCard(skin)}>
          <div style={hudLabelStyle}>LÍNEAS</div>
          <div style={{ ...hudValueStyle, color: skin.accent }}>{lines}</div>
        </div>
        {/* Level */}
        <div style={makeHudCard(skin)}>
          <div style={hudLabelStyle}>NIVEL</div>
          <div style={{ ...hudValueStyle, color: skin.accent }}>{level}</div>
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
function makeHudCard(skin: Skin): React.CSSProperties {
  return {
    background: skin.cardBg,
    border: `1px solid ${skin.cardBorder}`,
    borderRadius: 4,
    padding: "8px 12px",
  };
}

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

const hudLabelStyle: React.CSSProperties = {
  color: "var(--ink-dim, #8a8fb5)",
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  marginBottom: 4,
};

const hudValueStyle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 20,
};
