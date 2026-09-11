"use client";

import { useEffect, useRef } from "react";

export type GameHUD = {
  score: number;
  lives: number;
  level: number;
  tripleShot: number;
  state: "playing" | "dead" | "gameover";
};

export type SkinId = "classic" | "neon" | "retro";

export interface Skin {
  id: SkinId;
  /** Canvas background */
  bg: string;
  /** Ship stroke */
  ship: string;
  /** Thruster flame */
  flame: string;
  /** Asteroid stroke */
  asteroid: string;
  /** Bullet fill */
  bullet: string;
  /** Particle (explosion) stroke base color (rgb no alpha) */
  particle: string;
  /** Power-up stroke + label */
  powerup: string;
  /** Stars fill */
  star: string;
  /** HUD text / overlay */
  overlay: string;
  /** Glow shadow for ship (CSS color, used as shadowColor) */
  shipGlow: string;
  /** Glow shadow for asteroids */
  asteroidGlow: string;
  /** Whether to render CRT scanlines on canvas */
  scanlines: boolean;
  /** Whether to render a starfield */
  starfield: boolean;
}

export const SKINS: Record<SkinId, Skin> = {
  classic: {
    id: "classic",
    bg: "#000000",
    ship: "#ffffff",
    flame: "rgba(255,130,0,0.85)",
    asteroid: "#ffffff",
    bullet: "#ffffff",
    particle: "255,255,255",
    powerup: "#00ffff",
    star: "rgba(255,255,255,0.5)",
    overlay: "#ffffff",
    shipGlow: "transparent",
    asteroidGlow: "transparent",
    scanlines: false,
    starfield: true,
  },
  neon: {
    id: "neon",
    bg: "#03000f",
    ship: "#00f5ff",
    flame: "rgba(255,0,220,0.9)",
    asteroid: "#ff006e",
    bullet: "#f5ff00",
    particle: "0,245,255",
    powerup: "#f5ff00",
    star: "rgba(0,245,255,0.35)",
    overlay: "#00f5ff",
    shipGlow: "#00f5ff",
    asteroidGlow: "#ff006e",
    scanlines: false,
    starfield: true,
  },
  retro: {
    id: "retro",
    bg: "#0a0800",
    ship: "#ffb300",
    flame: "rgba(255,60,0,0.9)",
    asteroid: "#33ff33",
    bullet: "#ffb300",
    particle: "255,179,0",
    powerup: "#33ff33",
    star: "rgba(255,179,0,0.3)",
    overlay: "#ffb300",
    shipGlow: "transparent",
    asteroidGlow: "transparent",
    scanlines: true,
    starfield: false,
  },
};

type Props = {
  onHUD: (hud: GameHUD) => void;
  skin?: SkinId;
};

export default function AsteroidsGame({ onHUD, skin = "classic" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const skinRef = useRef<SkinId>(skin);

  // Keep skinRef in sync without restarting the game loop
  useEffect(() => {
    skinRef.current = skin;
  }, [skin]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 800;
    const H = 600;

    // ── Input ────────────────────────────────────────────────────────────────
    const keys: Record<string, boolean> = {};
    const justPressed: Record<string, boolean> = {};

    const onKeyDown = (e: KeyboardEvent) => {
      if (!keys[e.code]) justPressed[e.code] = true;
      keys[e.code] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    function pressed(code: string) {
      const val = justPressed[code];
      justPressed[code] = false;
      return val;
    }

    // ── Utils ─────────────────────────────────────────────────────────────────
    const wrap = (v: number, max: number) => ((v % max) + max) % max;
    const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
      Math.hypot(a.x - b.x, a.y - b.y);
    const rand = (min: number, max: number) =>
      min + Math.random() * (max - min);
    const randInt = (min: number, max: number) =>
      Math.floor(rand(min, max + 1));

    // ── Constants ─────────────────────────────────────────────────────────────
    const POWERUP_DROP_CHANCE = 0.15;
    const POWERUP_DURATION = 5;
    const POWERUP_TTL = 12;
    const TRIPLE_SPREAD = 0.18;

    // ── Starfield ─────────────────────────────────────────────────────────────
    interface Star {
      x: number;
      y: number;
      r: number;
    }
    const stars: Star[] = Array.from({ length: 80 }, () => ({
      x: rand(0, W),
      y: rand(0, H),
      r: rand(0.5, 1.8),
    }));

    function drawStarfield(s: Skin) {
      if (!s.starfield) return;
      ctx!.fillStyle = s.star;
      for (const st of stars) {
        ctx!.beginPath();
        ctx!.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    function drawScanlines() {
      ctx!.save();
      ctx!.globalAlpha = 0.12;
      ctx!.fillStyle = "#000";
      for (let y = 0; y < H; y += 3) {
        ctx!.fillRect(0, y, W, 1);
      }
      ctx!.restore();
    }

    // ── Bullet ────────────────────────────────────────────────────────────────
    class Bullet {
      x: number;
      y: number;
      vx: number;
      vy: number;
      ttl: number;
      radius: number;
      dead: boolean;

      constructor(x: number, y: number, angle: number) {
        this.x = x;
        this.y = y;
        const SPEED = 520;
        this.vx = Math.cos(angle) * SPEED;
        this.vy = Math.sin(angle) * SPEED;
        this.ttl = 1.1;
        this.radius = 2;
        this.dead = false;
      }

      update(dt: number) {
        this.x = wrap(this.x + this.vx * dt, W);
        this.y = wrap(this.y + this.vy * dt, H);
        this.ttl -= dt;
        if (this.ttl <= 0) this.dead = true;
      }

      draw(s: Skin) {
        ctx!.fillStyle = s.bullet;
        if (s.shipGlow !== "transparent") {
          ctx!.shadowColor = s.bullet;
          ctx!.shadowBlur = 6;
        }
        ctx!.beginPath();
        ctx!.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.shadowBlur = 0;
      }
    }

    // ── Asteroid ──────────────────────────────────────────────────────────────
    const RADII = [0, 16, 30, 50];
    const SPEEDS = [0, 85, 55, 32];
    const POINTS = [0, 100, 50, 20];

    class Asteroid {
      x: number;
      y: number;
      size: number;
      radius: number;
      dead: boolean;
      vx: number;
      vy: number;
      rotSpeed: number;
      rot: number;
      verts: [number, number][];

      constructor(x: number, y: number, size = 3) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.radius = RADII[size];
        this.dead = false;

        const angle = rand(0, Math.PI * 2);
        const speed = SPEEDS[size] + rand(-15, 15);
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.rotSpeed = rand(-1.2, 1.2);
        this.rot = rand(0, Math.PI * 2);

        const n = randInt(8, 13);
        this.verts = [];
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          const r = this.radius * rand(0.6, 1.0);
          this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
        }
      }

      update(dt: number) {
        this.x = wrap(this.x + this.vx * dt, W);
        this.y = wrap(this.y + this.vy * dt, H);
        this.rot += this.rotSpeed * dt;
      }

      split(): Asteroid[] {
        if (this.size <= 1) return [];
        return [
          new Asteroid(this.x, this.y, this.size - 1),
          new Asteroid(this.x, this.y, this.size - 1),
        ];
      }

      draw(s: Skin) {
        ctx!.save();
        ctx!.translate(this.x, this.y);
        ctx!.rotate(this.rot);
        ctx!.strokeStyle = s.asteroid;
        ctx!.lineWidth = 1.5;
        ctx!.lineJoin = "round";
        if (s.asteroidGlow !== "transparent") {
          ctx!.shadowColor = s.asteroidGlow;
          ctx!.shadowBlur = 8;
        }
        ctx!.beginPath();
        ctx!.moveTo(this.verts[0][0], this.verts[0][1]);
        for (let i = 1; i < this.verts.length; i++)
          ctx!.lineTo(this.verts[i][0], this.verts[i][1]);
        ctx!.closePath();
        ctx!.stroke();
        ctx!.restore();
      }
    }

    // ── PowerUp ───────────────────────────────────────────────────────────────
    class PowerUp {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      ttl: number;
      dead: boolean;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        const angle = rand(0, Math.PI * 2);
        const speed = rand(20, 40);
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.radius = 12;
        this.ttl = POWERUP_TTL;
        this.dead = false;
      }

      update(dt: number) {
        this.x = wrap(this.x + this.vx * dt, W);
        this.y = wrap(this.y + this.vy * dt, H);
        this.ttl -= dt;
        if (this.ttl <= 0) this.dead = true;
      }

      draw(s: Skin) {
        if (this.ttl < 2 && Math.floor(this.ttl * 8) % 2 === 0) return;
        const pulse = 0.85 + Math.sin(performance.now() / 150) * 0.15;
        ctx!.save();
        ctx!.translate(this.x, this.y);
        ctx!.rotate(Math.PI / 4);
        ctx!.strokeStyle = s.powerup;
        ctx!.lineWidth = 2;
        if (s.shipGlow !== "transparent") {
          ctx!.shadowColor = s.powerup;
          ctx!.shadowBlur = 10;
        }
        const r = this.radius * pulse;
        ctx!.strokeRect(-r, -r, r * 2, r * 2);
        ctx!.restore();
        ctx!.fillStyle = s.powerup;
        ctx!.font = "bold 12px monospace";
        ctx!.textAlign = "center";
        ctx!.textBaseline = "middle";
        ctx!.fillText("3x", this.x, this.y);
        ctx!.shadowBlur = 0;
      }
    }

    // ── Ship ──────────────────────────────────────────────────────────────────
    class Ship {
      x: number = 0;
      y: number = 0;
      angle: number = 0;
      vx: number = 0;
      vy: number = 0;
      radius: number = 0;
      thrusting: boolean = false;
      invincible: number = 0;
      shootCooldown: number = 0;
      dead: boolean = false;
      tripleShot: number = 0;

      constructor() {
        this.tripleShot = 0;
        this.reset();
      }

      reset() {
        this.x = W / 2;
        this.y = H / 2;
        this.angle = -Math.PI / 2;
        this.vx = 0;
        this.vy = 0;
        this.radius = 12;
        this.thrusting = false;
        this.invincible = 3;
        this.shootCooldown = 0;
        this.dead = false;
      }

      update(dt: number) {
        if (this.dead) return;
        if (this.invincible > 0) this.invincible -= dt;
        if (this.shootCooldown > 0) this.shootCooldown -= dt;
        if (this.tripleShot > 0) this.tripleShot -= dt;

        const ROT = 3.5;
        const THRUST = 260;
        const DRAG = 0.987;

        if (keys["ArrowLeft"]) this.angle -= ROT * dt;
        if (keys["ArrowRight"]) this.angle += ROT * dt;

        this.thrusting = !!keys["ArrowUp"];
        if (this.thrusting) {
          this.vx += Math.cos(this.angle) * THRUST * dt;
          this.vy += Math.sin(this.angle) * THRUST * dt;
        }

        this.vx *= DRAG;
        this.vy *= DRAG;
        this.x = wrap(this.x + this.vx * dt, W);
        this.y = wrap(this.y + this.vy * dt, H);
      }

      tryShoot(): Bullet[] {
        if (this.shootCooldown > 0 || this.dead) return [];
        this.shootCooldown = 0.2;
        const NOSE = 21;
        const ox = this.x + Math.cos(this.angle) * NOSE;
        const oy = this.y + Math.sin(this.angle) * NOSE;
        if (this.tripleShot > 0) {
          return [
            new Bullet(ox, oy, this.angle - TRIPLE_SPREAD),
            new Bullet(ox, oy, this.angle),
            new Bullet(ox, oy, this.angle + TRIPLE_SPREAD),
          ];
        }
        return [new Bullet(ox, oy, this.angle)];
      }

      draw(s: Skin) {
        if (this.dead) return;
        if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0)
          return;

        ctx!.save();
        ctx!.translate(this.x, this.y);
        ctx!.rotate(this.angle);
        ctx!.strokeStyle = s.ship;
        ctx!.lineWidth = 1.5;
        ctx!.lineJoin = "round";
        if (s.shipGlow !== "transparent") {
          ctx!.shadowColor = s.shipGlow;
          ctx!.shadowBlur = 12;
        }

        ctx!.beginPath();
        ctx!.moveTo(20, 0);
        ctx!.lineTo(-12, -9);
        ctx!.lineTo(-7, 0);
        ctx!.lineTo(-12, 9);
        ctx!.closePath();
        ctx!.stroke();

        if (this.thrusting && Math.random() > 0.35) {
          ctx!.beginPath();
          ctx!.moveTo(-8, -4);
          ctx!.lineTo(-8 - rand(6, 14), 0);
          ctx!.lineTo(-8, 4);
          ctx!.strokeStyle = s.flame;
          ctx!.shadowColor = s.flame;
          ctx!.shadowBlur = 8;
          ctx!.stroke();
        }

        ctx!.restore();
      }
    }

    // ── Particle ──────────────────────────────────────────────────────────────
    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      ttl: number;
      dead: boolean;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        const angle = rand(0, Math.PI * 2);
        const speed = rand(30, 130);
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = rand(0.4, 1.1);
        this.ttl = this.life;
        this.dead = false;
      }

      update(dt: number) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.ttl -= dt;
        if (this.ttl <= 0) this.dead = true;
      }

      draw(s: Skin) {
        const alpha = this.ttl / this.life;
        ctx!.strokeStyle = `rgba(${s.particle},${alpha.toFixed(2)})`;
        ctx!.lineWidth = 1;
        ctx!.beginPath();
        ctx!.moveTo(this.x, this.y);
        ctx!.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
        ctx!.stroke();
      }
    }

    // ── Game state ────────────────────────────────────────────────────────────
    let ship: Ship, bullets: Bullet[], asteroids: Asteroid[];
    let particles: Particle[], powerUps: PowerUp[];
    let score: number, lives: number, level: number;
    let gameState: "playing" | "dead" | "gameover";
    let deadTimer: number;
    let powerUpSpawned: boolean;
    let killsSinceSpawn: number;
    let hudFrame = 0;

    function spawnAsteroids(count: number) {
      const SAFE_DIST = 130;
      for (let i = 0; i < count; i++) {
        let x: number, y: number;
        do {
          x = rand(0, W);
          y = rand(0, H);
        } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
        asteroids.push(new Asteroid(x, y, 3));
      }
    }

    function initGame() {
      ship = new Ship();
      bullets = [];
      asteroids = [];
      particles = [];
      powerUps = [];
      powerUpSpawned = false;
      killsSinceSpawn = 0;
      score = 0;
      lives = 3;
      level = 1;
      gameState = "playing";
      spawnAsteroids(4);
    }

    function nextLevel() {
      level++;
      bullets = [];
      particles = [];
      powerUps = [];
      powerUpSpawned = false;
      killsSinceSpawn = 0;
      ship.reset();
      spawnAsteroids(3 + level);
    }

    function explode(x: number, y: number, count = 8) {
      for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
    }

    function killShip() {
      explode(ship.x, ship.y, 14);
      ship.dead = true;
      lives--;
      if (lives <= 0) {
        gameState = "gameover";
      } else {
        gameState = "dead";
        deadTimer = 2;
      }
    }

    // ── Update ────────────────────────────────────────────────────────────────
    function update(dt: number) {
      if (gameState === "gameover") {
        if (pressed("Space")) initGame();
        particles.forEach((p) => p.update(dt));
        particles = particles.filter((p) => !p.dead);
        return;
      }

      if (gameState === "dead") {
        deadTimer -= dt;
        particles.forEach((p) => p.update(dt));
        particles = particles.filter((p) => !p.dead);
        asteroids.forEach((a) => a.update(dt));
        if (deadTimer <= 0) {
          gameState = "playing";
          ship.reset();
        }
        return;
      }

      if (pressed("Space")) bullets.push(...ship.tryShoot());

      ship.update(dt);
      bullets.forEach((b) => b.update(dt));
      asteroids.forEach((a) => a.update(dt));
      particles.forEach((p) => p.update(dt));
      powerUps.forEach((p) => p.update(dt));

      bullets = bullets.filter((b) => !b.dead);
      particles = particles.filter((p) => !p.dead);
      powerUps = powerUps.filter((p) => !p.dead);

      for (const p of powerUps) {
        if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
          p.dead = true;
          ship.tripleShot = POWERUP_DURATION;
        }
      }

      const newAsteroids: Asteroid[] = [];
      for (const b of bullets) {
        for (const a of asteroids) {
          if (!a.dead && !b.dead && dist(b, a) < a.radius) {
            b.dead = true;
            a.dead = true;
            score += POINTS[a.size];
            explode(a.x, a.y, a.size * 5);
            newAsteroids.push(...a.split());
            if (!powerUpSpawned) {
              killsSinceSpawn++;
              const guaranteed = killsSinceSpawn >= 5;
              if (guaranteed || Math.random() < POWERUP_DROP_CHANCE) {
                powerUps.push(new PowerUp(a.x, a.y));
                powerUpSpawned = true;
              }
            }
          }
        }
      }
      asteroids = asteroids.filter((a) => !a.dead).concat(newAsteroids);
      bullets = bullets.filter((b) => !b.dead);

      if (ship.invincible <= 0) {
        for (const a of asteroids) {
          if (dist(ship, a) < ship.radius + a.radius * 0.82) {
            killShip();
            break;
          }
        }
      }

      if (asteroids.length === 0) nextLevel();
    }

    // ── Draw ──────────────────────────────────────────────────────────────────
    function drawOverlay(title: string, sub: string, s: Skin) {
      ctx!.textAlign = "center";
      ctx!.fillStyle = s.overlay;
      ctx!.font = "bold 46px monospace";
      ctx!.fillText(title, W / 2, H / 2 - 18);
      ctx!.font = "18px monospace";
      ctx!.fillStyle = `rgba(${s.particle},0.65)`;
      ctx!.fillText(sub, W / 2, H / 2 + 22);
    }

    function draw() {
      const s = SKINS[skinRef.current];
      ctx!.fillStyle = s.bg;
      ctx!.fillRect(0, 0, W, H);
      drawStarfield(s);
      particles.forEach((p) => p.draw(s));
      asteroids.forEach((a) => a.draw(s));
      powerUps.forEach((p) => p.draw(s));
      bullets.forEach((b) => b.draw(s));
      ship.draw(s);
      if (s.scanlines) drawScanlines();
      if (gameState === "gameover")
        drawOverlay("GAME OVER", "ESPACIO PARA REINICIAR", s);
    }

    // ── Loop ──────────────────────────────────────────────────────────────────
    let lastTime: number | null = null;
    let rafId: number;

    function loop(ts: number) {
      const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
      lastTime = ts;
      update(dt);
      draw();
      // Emit HUD at ~10 fps to avoid excessive re-renders
      if (++hudFrame % 6 === 0) {
        onHUD({
          score,
          lives,
          level,
          tripleShot: ship?.tripleShot ?? 0,
          state: gameState,
        });
      }
      rafId = requestAnimationFrame(loop);
    }

    initGame();
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
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
