"use client";

import { useEffect, useRef } from "react";

export type ArkanoidHUD = {
  score: number;
  lives: number;
  level: number;
  gameState: "playing" | "paused" | "gameover" | "win";
};

export type SkinId = "classic" | "neon" | "retro";

export type Skin = {
  id: SkinId;
  bg: string;
  paddleFill: string;
  paddleStroke: string;
  ballFill: string;
  ballGlow: string;
  textPrimary: string;
  textDim: string;
  pauseBg: string;
  brickColors: Record<string, string>;
  brickStroke: string;
  glowEnabled: boolean;
};

export const SKINS: Record<SkinId, Skin> = {
  classic: {
    id: "classic",
    bg: "#000000",
    paddleFill: "#1a6fff",
    paddleStroke: "#5599ff",
    ballFill: "#ffffff",
    ballGlow: "rgba(255,255,255,0.6)",
    textPrimary: "#ffffff",
    textDim: "#aaaaaa",
    pauseBg: "rgba(0,0,0,0.65)",
    brickColors: {
      red: "#e81010",
      yellow: "#e8c010",
      cyan: "#10c8e8",
      magenta: "#c010c8",
      hotpink: "#e8109a",
      green: "#10c840",
      gray: "#888888",
    },
    brickStroke: "rgba(0,0,0,0.4)",
    glowEnabled: false,
  },
  neon: {
    id: "neon",
    bg: "#05050f",
    paddleFill: "#7b2fff",
    paddleStroke: "#00f5ff",
    ballFill: "#00f5ff",
    ballGlow: "rgba(0,245,255,0.9)",
    textPrimary: "#00f5ff",
    textDim: "#7b2fff",
    pauseBg: "rgba(5,5,15,0.75)",
    brickColors: {
      red: "#ff00cc",
      yellow: "#f5ff00",
      cyan: "#00f5ff",
      magenta: "#ff00cc",
      hotpink: "#ff0066",
      green: "#00ff88",
      gray: "#7b2fff",
    },
    brickStroke: "rgba(0,0,0,0.5)",
    glowEnabled: true,
  },
  retro: {
    id: "retro",
    bg: "#0d0a00",
    paddleFill: "#ffb000",
    paddleStroke: "#ffd060",
    ballFill: "#ffb000",
    ballGlow: "rgba(255,176,0,0.8)",
    textPrimary: "#ffb000",
    textDim: "#7a5000",
    pauseBg: "rgba(13,10,0,0.75)",
    brickColors: {
      red: "#ff6000",
      yellow: "#ffb000",
      cyan: "#39ff14",
      magenta: "#ffb000",
      hotpink: "#ff6000",
      green: "#39ff14",
      gray: "#7a5000",
    },
    brickStroke: "rgba(0,0,0,0.5)",
    glowEnabled: true,
  },
};

type Props = {
  onHUD: (hud: ArkanoidHUD) => void;
  skin?: SkinId;
};

// ── Spritesheet data (inlined from assets/spritesheet.js) ────────────────────
type Frame = { sx: number; sy: number; sw: number; sh: number };

const EXPLOSION_FRAMES: Record<string, Frame[]> = {
  red: [
    { sx: 256, sy: 176, sw: 32, sh: 16 },
    { sx: 288, sy: 176, sw: 32, sh: 16 },
    { sx: 320, sy: 176, sw: 32, sh: 16 },
    { sx: 352, sy: 176, sw: 32, sh: 16 },
  ],
  cyan: [
    { sx: 256, sy: 192, sw: 32, sh: 16 },
    { sx: 288, sy: 192, sw: 32, sh: 16 },
    { sx: 320, sy: 192, sw: 32, sh: 16 },
    { sx: 352, sy: 192, sw: 32, sh: 16 },
  ],
  green: [
    { sx: 256, sy: 208, sw: 32, sh: 16 },
    { sx: 288, sy: 208, sw: 32, sh: 16 },
    { sx: 320, sy: 208, sw: 32, sh: 16 },
    { sx: 352, sy: 208, sw: 32, sh: 16 },
  ],
  magenta: [
    { sx: 256, sy: 224, sw: 32, sh: 16 },
    { sx: 288, sy: 224, sw: 32, sh: 16 },
    { sx: 320, sy: 224, sw: 32, sh: 16 },
    { sx: 352, sy: 224, sw: 32, sh: 16 },
  ],
  yellow: [
    { sx: 256, sy: 240, sw: 32, sh: 16 },
    { sx: 288, sy: 240, sw: 32, sh: 16 },
    { sx: 320, sy: 240, sw: 32, sh: 16 },
    { sx: 352, sy: 240, sw: 32, sh: 16 },
  ],
  hotpink: [
    { sx: 256, sy: 256, sw: 32, sh: 16 },
    { sx: 288, sy: 256, sw: 32, sh: 16 },
    { sx: 320, sy: 256, sw: 32, sh: 16 },
    { sx: 352, sy: 256, sw: 32, sh: 16 },
  ],
  gray: [
    { sx: 256, sy: 176, sw: 32, sh: 16 },
    { sx: 288, sy: 176, sw: 32, sh: 16 },
    { sx: 320, sy: 176, sw: 32, sh: 16 },
    { sx: 352, sy: 176, sw: 32, sh: 16 },
  ],
};

const EXPLOSION_DURATION = 150;

const SPRITE_MAP: Record<string, Frame> = {
  paddle: { sx: 32, sy: 112, sw: 162, sh: 14 },
  ball: { sx: 32, sy: 32, sw: 16, sh: 16 },
  block_gray: { sx: 32, sy: 288, sw: 32, sh: 16 },
  block_red: { sx: 32, sy: 176, sw: 32, sh: 16 },
  block_yellow: { sx: 32, sy: 240, sw: 32, sh: 16 },
  block_cyan: { sx: 32, sy: 192, sw: 32, sh: 16 },
  block_magenta: { sx: 32, sy: 224, sw: 32, sh: 16 },
  block_hotpink: { sx: 32, sy: 256, sw: 32, sh: 16 },
  block_green: { sx: 32, sy: 208, sw: 32, sh: 16 },
};

// ── Level definitions (inlined from levels.js) ───────────────────────────────
type BlockDef = { col: number; row: number; color: string };
type LevelDef = { speed: number; blocks: BlockDef[] };

const LEVELS: LevelDef[] = (() => {
  const rowColors1 = ["red", "yellow", "cyan", "magenta", "hotpink", "green"];
  const rowColors2 = ["gray", "cyan", "hotpink", "yellow", "magenta", "green"];
  const rowColors4 = ["cyan", "magenta", "green", "yellow", "hotpink", "red"];

  const l1: BlockDef[] = [];
  for (let row = 0; row < 6; row++)
    for (let col = 0; col < 10; col++)
      l1.push({ col, row, color: rowColors1[row] });

  const l2: BlockDef[] = [];
  const pyStart = [4, 3, 2, 1, 0, 0];
  const pyEnd = [5, 6, 7, 8, 9, 9];
  for (let row = 0; row < 6; row++)
    for (let col = pyStart[row]; col <= pyEnd[row]; col++)
      l2.push({ col, row, color: rowColors2[row] });

  const l3: BlockDef[] = [];
  for (let row = 0; row < 6; row++)
    for (let col = 0; col < 10; col++)
      if ((col + row) % 2 === 0)
        l3.push({ col, row, color: row < 3 ? "yellow" : "magenta" });

  const gaps4 = [
    [2, 5, 8],
    [0, 4, 7, 9],
    [1, 3, 6],
    [2, 5, 8, 9],
    [0, 4, 7],
    [1, 3, 6, 9],
  ];
  const l4: BlockDef[] = [];
  for (let row = 0; row < 6; row++)
    for (let col = 0; col < 10; col++)
      if (!gaps4[row].includes(col))
        l4.push({ col, row, color: rowColors4[row] });

  const l5: BlockDef[] = [];
  for (let row = 0; row < 6; row++)
    for (let col = 0; col < 10; col++) {
      const isFrame = col === 0 || col === 9 || row === 0 || row === 5;
      const isCross = col === 4 || row === 2;
      if (isFrame || isCross)
        l5.push({ col, row, color: isCross && !isFrame ? "hotpink" : "cyan" });
    }

  return [
    { speed: 1.0, blocks: l1 },
    { speed: 1.1, blocks: l2 },
    { speed: 1.21, blocks: l3 },
    { speed: 1.33, blocks: l4 },
    { speed: 1.46, blocks: l5 },
  ];
})();

export default function ArkanoidGame({
  onHUD,
  skin: skinProp = "classic",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const skinRef = useRef<Skin>(SKINS[skinProp]);

  // Update skinRef whenever prop changes (picked up on next draw call)
  useEffect(() => {
    skinRef.current = SKINS[skinProp];
  }, [skinProp]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const W = 800;
    const H = 600;

    // ── Spritesheet loader ───────────────────────────────────────────────────
    let ssImg: HTMLCanvasElement | null = null;
    let ssLoaded = false;
    const ssCallbacks: (() => void)[] = [];

    function loadSpritesheet(cb: () => void) {
      if (ssLoaded) {
        cb();
        return;
      }
      ssCallbacks.push(cb);
      if (ssImg) return;
      const rawImg = new Image();
      rawImg.onload = () => {
        const oc = document.createElement("canvas");
        oc.width = rawImg.width;
        oc.height = rawImg.height;
        const octx = oc.getContext("2d")!;
        octx.drawImage(rawImg, 0, 0);
        ssImg = oc;
        ssLoaded = true;
        ssCallbacks.forEach((f) => f());
      };
      rawImg.src = "/games/arkanoid/spritesheet-breakout.png";
    }

    function drawFrame(
      frame: Frame,
      x: number,
      y: number,
      w: number,
      h: number,
    ) {
      if (!ssLoaded || !ssImg) return;
      ctx.drawImage(ssImg, frame.sx, frame.sy, frame.sw, frame.sh, x, y, w, h);
    }

    function drawSprite(
      name: string,
      x: number,
      y: number,
      w: number,
      h: number,
    ) {
      if (!ssLoaded || !ssImg) return;
      const sp: Frame | undefined = SPRITE_MAP[name];
      if (!sp) return;
      ctx.drawImage(ssImg, sp.sx, sp.sy, sp.sw, sp.sh, x, y, w, h);
    }

    // ── Constants ─────────────────────────────────────────────────────────────
    const PADDLE_SPEED = 400;
    const BLOCK_COLS = 10;
    const BLOCK_W = 64;
    const BLOCK_H = 24;
    const BLOCKS_ORIGIN_X = (W - BLOCK_COLS * BLOCK_W) / 2;
    const BLOCKS_ORIGIN_Y = 80;
    const BASE_BALL_VX = 200;
    const BASE_BALL_VY = -300;

    // ── Game state ─────────────────────────────────────────────────────────────
    const paddle = { x: 0, y: 560, w: 81, h: 14 };
    const ball = { x: 0, y: 0, w: 16, h: 16, vx: 200, vy: -300 };
    const keys: Record<string, boolean> = {};

    type Block = {
      x: number;
      y: number;
      w: number;
      h: number;
      color: string;
      alive: boolean;
    };
    type Explosion = {
      x: number;
      y: number;
      w: number;
      h: number;
      color: string;
      elapsed: number;
    };

    let blocks: Block[] = [];
    let explosions: Explosion[] = [];
    let lives = 3;
    let score = 0;
    let gameState: "playing" | "paused" | "gameover" | "win" = "playing";
    let currentLevel = 1;
    let isPaused = false;
    let hudFrame = 0;

    // ── Pause overlay constants ────────────────────────────────────────────────
    const PAUSE_BTN_W = 60;
    const PAUSE_BTN_H = 40;
    const PAUSE_BTN_GAP = 12;
    const PAUSE_BTN_Y = 340;
    const PAUSE_BTN_ROW_X = (W - (5 * PAUSE_BTN_W + 4 * PAUSE_BTN_GAP)) / 2;

    // ── Init helpers ──────────────────────────────────────────────────────────
    function initPaddle() {
      paddle.x = (W - paddle.w) / 2;
    }

    function loadLevel(n: number) {
      currentLevel = n;
      const level = LEVELS[n - 1];
      blocks = level.blocks.map((b) => ({
        x: BLOCKS_ORIGIN_X + b.col * BLOCK_W,
        y: BLOCKS_ORIGIN_Y + b.row * BLOCK_H,
        w: BLOCK_W,
        h: BLOCK_H,
        color: b.color,
        alive: true,
      }));
      explosions = [];
      ball.x = paddle.x + (paddle.w - ball.w) / 2;
      ball.y = paddle.y - ball.h;
      ball.vx = BASE_BALL_VX * level.speed;
      ball.vy = BASE_BALL_VY * level.speed;
    }

    // ── Collision ─────────────────────────────────────────────────────────────
    function collideAABB(block: Block) {
      return (
        ball.x < block.x + block.w &&
        ball.x + ball.w > block.x &&
        ball.y < block.y + block.h &&
        ball.y + ball.h > block.y
      );
    }

    // ── Event listeners ───────────────────────────────────────────────────────
    const onKeyDown = (e: KeyboardEvent) => {
      keys[e.key] = true;
      if (
        (e.key === "p" || e.key === "P" || e.key === "Escape") &&
        gameState === "playing"
      ) {
        isPaused = !isPaused;
        gameState = isPaused ? "paused" : "playing";
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.key] = false;
    };
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      const mouseX = (e.clientX - rect.left) * scaleX;
      paddle.x = Math.max(0, Math.min(W - paddle.w, mouseX - paddle.w / 2));
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("mousemove", onMouseMove);

    // ── Update ────────────────────────────────────────────────────────────────
    function update(dt: number) {
      if (gameState !== "playing") return;

      if (keys["ArrowLeft"])
        paddle.x = Math.max(0, paddle.x - PADDLE_SPEED * dt);
      if (keys["ArrowRight"])
        paddle.x = Math.min(W - paddle.w, paddle.x + PADDLE_SPEED * dt);

      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;

      // Wall bounces
      if (ball.x <= 0) {
        ball.x = 0;
        ball.vx = Math.abs(ball.vx);
      }
      if (ball.x + ball.w >= W) {
        ball.x = W - ball.w;
        ball.vx = -Math.abs(ball.vx);
      }
      if (ball.y <= 0) {
        ball.y = 0;
        ball.vy = Math.abs(ball.vy);
      }

      // Paddle bounce
      if (
        ball.vy > 0 &&
        ball.x + ball.w > paddle.x &&
        ball.x < paddle.x + paddle.w &&
        ball.y + ball.h >= paddle.y &&
        ball.y + ball.h <= paddle.y + paddle.h + 8
      ) {
        ball.y = paddle.y - ball.h;
        ball.vy = -Math.abs(ball.vy);
      }

      // Block collisions
      for (const block of blocks) {
        if (!block.alive) continue;
        if (collideAABB(block)) {
          block.alive = false;
          explosions.push({
            x: block.x,
            y: block.y,
            w: block.w,
            h: block.h,
            color: block.color,
            elapsed: 0,
          });
          score += 10;
          ball.vy = -ball.vy;
          if (blocks.every((b) => !b.alive)) {
            if (currentLevel < 5) loadLevel(currentLevel + 1);
            else gameState = "win";
          }
          break;
        }
      }

      // Explosions
      for (const exp of explosions) exp.elapsed += dt * 1000;
      explosions = explosions.filter((exp) => exp.elapsed < EXPLOSION_DURATION);

      // Ball lost
      if (ball.y > H) {
        lives--;
        if (lives <= 0) {
          lives = 0;
          gameState = "gameover";
        } else {
          ball.x = paddle.x + (paddle.w - ball.w) / 2;
          ball.y = paddle.y - ball.h;
          const speed = LEVELS[currentLevel - 1].speed;
          ball.vx = BASE_BALL_VX * speed;
          ball.vy = BASE_BALL_VY * speed;
        }
      }
    }

    // ── Draw helpers ──────────────────────────────────────────────────────────
    function drawBrickSkinned(block: Block) {
      const s = skinRef.current;
      const color = s.brickColors[block.color] ?? "#888888";

      if (s.glowEnabled) {
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
      }

      ctx.fillStyle = color;
      ctx.fillRect(block.x + 1, block.y + 1, block.w - 2, block.h - 2);
      ctx.strokeStyle = s.brickStroke;
      ctx.lineWidth = 1;
      ctx.strokeRect(block.x + 1, block.y + 1, block.w - 2, block.h - 2);

      // Inner highlight
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.fillRect(block.x + 2, block.y + 2, block.w - 4, 4);

      if (s.glowEnabled) ctx.restore();
    }

    function drawExplosionSkinned(exp: Explosion, progress: number) {
      const s = skinRef.current;
      const color = s.brickColors[exp.color] ?? "#ffffff";
      const alpha = 1 - progress;
      const scale = 1 + progress * 0.5;
      const cx = exp.x + exp.w / 2;
      const cy = exp.y + exp.h / 2;
      const hw = (exp.w / 2) * scale;
      const hh = (exp.h / 2) * scale;

      ctx.save();
      ctx.globalAlpha = alpha;
      if (s.glowEnabled) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(cx - hw, cy - hh, hw * 2, hh * 2);
      // particles
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const dist = progress * 20;
        ctx.fillStyle = color;
        ctx.fillRect(
          cx + Math.cos(angle) * dist - 2,
          cy + Math.sin(angle) * dist - 2,
          4,
          4,
        );
      }
      ctx.restore();
    }

    function drawPaddleSkinned() {
      const s = skinRef.current;
      if (s.id === "classic") {
        drawSprite("paddle", paddle.x, paddle.y, paddle.w, paddle.h);
        return;
      }
      ctx.save();
      if (s.glowEnabled) {
        ctx.shadowColor = s.paddleStroke;
        ctx.shadowBlur = 12;
      }
      ctx.fillStyle = s.paddleFill;
      ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
      ctx.strokeStyle = s.paddleStroke;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(paddle.x, paddle.y, paddle.w, paddle.h);
      // top shine
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.fillRect(paddle.x + 2, paddle.y + 1, paddle.w - 4, 3);
      ctx.restore();
    }

    function drawBallSkinned() {
      const s = skinRef.current;
      if (s.id === "classic") {
        drawSprite("ball", ball.x, ball.y, ball.w, ball.h);
        return;
      }
      ctx.save();
      if (s.glowEnabled) {
        ctx.shadowColor = s.ballGlow;
        ctx.shadowBlur = 14;
      }
      ctx.fillStyle = s.ballFill;
      ctx.beginPath();
      ctx.arc(
        ball.x + ball.w / 2,
        ball.y + ball.h / 2,
        ball.w / 2,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.restore();
    }

    // ── Draw ──────────────────────────────────────────────────────────────────
    function drawPauseOverlay() {
      const s = skinRef.current;
      ctx.fillStyle = s.pauseBg;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = s.textPrimary;
      ctx.font = "bold 56px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (s.glowEnabled) {
        ctx.shadowColor = s.textPrimary;
        ctx.shadowBlur = 16;
      }
      ctx.fillText("PAUSA", W / 2, 260);
      ctx.shadowBlur = 0;
      ctx.font = "bold 16px monospace";
      ctx.fillStyle = s.textDim;
      ctx.fillText("P / Escape para continuar", W / 2, 310);
    }

    function draw() {
      const s = skinRef.current;

      ctx.fillStyle = s.bg;
      ctx.fillRect(0, 0, W, H);

      // Retro: draw scanline effect
      if (s.id === "retro") {
        ctx.save();
        ctx.globalAlpha = 0.06;
        ctx.fillStyle = "#000";
        for (let y = 0; y < H; y += 4) {
          ctx.fillRect(0, y, W, 2);
        }
        ctx.restore();
      }

      // Neon: subtle grid background
      if (s.id === "neon") {
        ctx.save();
        ctx.globalAlpha = 0.07;
        ctx.strokeStyle = "#00f5ff";
        ctx.lineWidth = 0.5;
        for (let x = 0; x < W; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, H);
          ctx.stroke();
        }
        for (let y = 0; y < H; y += 40) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(W, y);
          ctx.stroke();
        }
        ctx.restore();
      }

      for (const block of blocks) {
        if (!block.alive) continue;
        if (s.id === "classic") {
          drawSprite(
            "block_" + block.color,
            block.x,
            block.y,
            block.w,
            block.h,
          );
        } else {
          drawBrickSkinned(block);
        }
      }

      for (const exp of explosions) {
        const progress = exp.elapsed / EXPLOSION_DURATION;
        if (s.id === "classic") {
          const frameIndex = Math.min(Math.floor(progress * 4), 3);
          drawFrame(
            EXPLOSION_FRAMES[exp.color][frameIndex],
            exp.x,
            exp.y,
            exp.w,
            exp.h,
          );
        } else {
          drawExplosionSkinned(exp, progress);
        }
      }

      drawPaddleSkinned();
      drawBallSkinned();

      if (isPaused) drawPauseOverlay();
    }

    // ── Loop ──────────────────────────────────────────────────────────────────
    let lastTime: number | null = null;
    let rafId: number;

    function loop(ts: number) {
      const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
      lastTime = ts;
      update(dt);
      draw();

      if (++hudFrame % 6 === 0) {
        onHUD({ score, lives, level: currentLevel, gameState });
      }

      rafId = requestAnimationFrame(loop);
    }

    loadSpritesheet(() => {
      initPaddle();
      loadLevel(1);
      rafId = requestAnimationFrame(loop);
    });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("mousemove", onMouseMove);
    };
  }, [onHUD]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      style={{ display: "block", width: "100%", height: "auto" }}
    />
  );
}
