"use client";
import { useEffect, useRef, useState } from "react";

const MAP = [
  "###################",
  "#........#........#",
  "#o##.###.#.###.##o#",
  "#.................#",
  "#.##.#.#####.#.##.#",
  "#....#...#...#....#",
  "####.###.#.###.####",
  "####.#.......#.####",
  "####.#.##-##.#.####",
  "####.#.#GGG#.#.####",
  "####.#.#####.#.####",
  "####.#.......#.####",
  "####.###.#.###.####",
  "#........#........#",
  "#.##.###.#.###.##.#",
  "#o.#.....P.....#.o#",
  "##.#.#.#####.#.#.##",
  "#....#...#...#....#",
  "#.######.#.######.#",
  "#.................#",
  "###################",
];

const COLS = 19;
const ROWS = 21;
const T = 16;
const W = COLS * T;
const H = ROWS * T;

// Zorluk ayarları (tile/saniye)
const START_LIVES = 3;
const PLAYER_SPEED = 5;
const GHOST_SPEED = 4;
const SCARED_SPEED = 2.4;
const FRIGHT_SECONDS = 6;

type Dir = { dx: number; dy: number };
const DIRS: Dir[] = [
  { dx: 1, dy: 0 },
  { dx: -1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: 0, dy: -1 },
];

// chase: oyuncuyu kovalama olasılığı, ahead: oyuncunun kaç kare önünü hedefler
const GHOSTS = [
  { color: "#ff9ecb", home: { x: 8, y: 9 }, delay: 1, chase: 0.55, ahead: 0 },
  { color: "#6fe3ff", home: { x: 9, y: 9 }, delay: 4, chase: 0.45, ahead: 3 },
  { color: "#ffb347", home: { x: 10, y: 9 }, delay: 7, chase: 0.25, ahead: 0 },
];

const SPRITE = [
  "....######....",
  "..##########..",
  ".############.",
  ".############.",
  "##############",
  "##############",
  "##############",
  "##############",
  "##############",
  "##############",
  "##############",
  "##############",
];
const FEET_A = ["####.####.####", "###..####..###"];
const FEET_B = ["###.##..##.###", "##..##..##..##"];

type Phase = "ready" | "play" | "dying" | "won" | "lost";
type Ent = {
  x: number;
  y: number;
  dx: number;
  dy: number;
  tx: number;
  ty: number;
  moving: boolean;
  speed: number;
};
type Ghost = Ent & {
  i: number;
  state: "house" | "leaving" | "roam";
  release: number;
};

const cell = (x: number, y: number) =>
  x < 0 || y < 0 || x >= COLS || y >= ROWS ? "#" : MAP[y][x];
const isWall = (x: number, y: number) => cell(x, y) === "#";
const blockedFor = (x: number, y: number, passDoor: boolean) => {
  const c = cell(x, y);
  return c === "#" || (c === "-" && !passDoor);
};

function makePellets() {
  return MAP.map((row) =>
    row.split("").map((c) => (c === "." ? 1 : c === "o" ? 2 : 0))
  );
}

function buildBg() {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  g.fillStyle = "#000";
  g.fillRect(0, 0, W, H);
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const px = x * T;
      const py = y * T;
      if (isWall(x, y)) {
        g.fillStyle = "#05052a";
        g.fillRect(px, py, T, T);
        g.fillStyle = "#2f3bff";
        if (!isWall(x, y - 1)) g.fillRect(px, py, T, 2);
        if (!isWall(x, y + 1)) g.fillRect(px, py + T - 2, T, 2);
        if (!isWall(x - 1, y)) g.fillRect(px, py, 2, T);
        if (!isWall(x + 1, y)) g.fillRect(px + T - 2, py, 2, T);
      } else if (cell(x, y) === "-") {
        g.fillStyle = "#ffb8de";
        g.fillRect(px, py + 6, T, 3);
      }
    }
  }
  return c;
}

type Chooser = (e: Ent) => void;
function advance(e: Ent, distance: number, choose: Chooser, arrive?: (e: Ent) => void) {
  let dist = distance;
  let guard = 0;
  while (dist > 1e-9 && guard++ < 8) {
    if (!e.moving) {
      choose(e);
      if (e.dx === 0 && e.dy === 0) return;
      e.tx = e.x + e.dx;
      e.ty = e.y + e.dy;
      e.moving = true;
    }
    const rem = Math.abs(e.tx - e.x) + Math.abs(e.ty - e.y);
    if (dist >= rem) {
      e.x = e.tx;
      e.y = e.ty;
      e.moving = false;
      dist -= rem;
      arrive?.(e);
    } else {
      e.x += e.dx * dist;
      e.y += e.dy * dist;
      dist = 0;
    }
  }
}

function reverse(e: Ent) {
  if (!e.moving) return;
  const ox = e.tx - e.dx;
  const oy = e.ty - e.dy;
  e.tx = ox;
  e.ty = oy;
  e.dx = -e.dx;
  e.dy = -e.dy;
}

export default function Maze({ onWin, onLose }: { onWin: () => void; onLose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cb = useRef({ onWin, onLose });
  useEffect(() => {
    cb.current = { onWin, onLose };
  });

  const [banner, setBanner] = useState<string | null>("READY!");
  const [lives, setLives] = useState(START_LIVES);
  const [left, setLeft] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;

    const bg = buildBg();
    const pel = makePellets();
    const total = pel.flat().filter((v) => v > 0).length;

    const sprite = new Image();
    let spriteOk = false;
    sprite.onload = () => (spriteOk = true);
    sprite.src = "/maze/player.png";

    const mk = (x: number, y: number, speed: number): Ent => ({
      x, y, dx: 0, dy: 0, tx: x, ty: y, moving: false, speed,
    });

    const P = mk(9, 15, PLAYER_SCALE_SPEED());
    let face: Dir = { dx: -1, dy: 0 };
    let want: Dir = { dx: -1, dy: 0 };
    const ghosts: Ghost[] = GHOSTS.map((g, i) => ({
      ...mk(g.home.x, g.home.y, GHOST_SPEED),
      i,
      state: "house" as const,
      release: g.delay,
    }));

    const S = {
      phase: "ready" as Phase,
      pt: 0,
      clock: 0,
      fright: 0,
      lives: START_LIVES,
      t: 0,
      left: total,
      done: false,
    };
    setLeft(total);

    function PLAYER_SCALE_SPEED() {
      return PLAYER_SPEED;
    }

    function resetPositions() {
      P.x = 9; P.y = 15; P.tx = 9; P.ty = 15;
      P.dx = 0; P.dy = 0; P.moving = false;
      face = { dx: -1, dy: 0 };
      want = { dx: -1, dy: 0 };
      ghosts.forEach((g) => {
        const h = GHOSTS[g.i].home;
        g.x = h.x; g.y = h.y; g.tx = h.x; g.ty = h.y;
        g.dx = 0; g.dy = 0; g.moving = false;
        g.state = "house";
        g.release = GHOSTS[g.i].delay;
      });
      S.clock = 0;
      S.fright = 0;
    }

    function sendHome(g: Ghost) {
      const h = GHOSTS[g.i].home;
      g.x = h.x; g.y = h.y; g.tx = h.x; g.ty = h.y;
      g.dx = 0; g.dy = 0; g.moving = false;
      g.state = "house";
      g.release = S.clock + 3;
    }

    function choosePlayer(e: Ent) {
      if ((want.dx || want.dy) && !blockedFor(e.x + want.dx, e.y + want.dy, false)) {
        e.dx = want.dx;
        e.dy = want.dy;
      } else if ((!e.dx && !e.dy) || blockedFor(e.x + e.dx, e.y + e.dy, false)) {
        e.dx = 0;
        e.dy = 0;
      }
      if (e.dx || e.dy) face = { dx: e.dx, dy: e.dy };
    }

    function arrivePlayer(e: Ent) {
      const v = pel[e.y][e.x];
      if (!v) return;
      pel[e.y][e.x] = 0;
      S.left--;
      setLeft(S.left);
      if (v === 2) {
        S.fright = FRIGHT_SECONDS;
        ghosts.forEach((g) => {
          if (g.state === "roam") reverse(g);
        });
      }
      if (S.left === 0) {
        S.phase = "won";
        S.pt = 0;
        setBanner("YOU WON!");
      }
    }

    function chooseGhost(g: Ghost) {
      if (g.state === "leaving") {
        if (g.y <= 7) {
          g.state = "roam";
        } else {
          if (g.x < 9) { g.dx = 1; g.dy = 0; }
          else if (g.x > 9) { g.dx = -1; g.dy = 0; }
          else { g.dx = 0; g.dy = -1; }
          return;
        }
      }
      let opts = DIRS.filter((d) => !blockedFor(g.x + d.dx, g.y + d.dy, false));
      const fwd = opts.filter((d) => !(d.dx === -g.dx && d.dy === -g.dy));
      if (fwd.length) opts = fwd;
      if (!opts.length) {
        g.dx = 0;
        g.dy = 0;
        return;
      }
      let pick = opts[Math.floor(Math.random() * opts.length)];
      const cfg = GHOSTS[g.i];
      if (S.fright === 0 && opts.length > 1 && Math.random() < cfg.chase) {
        const tx = P.x + face.dx * cfg.ahead;
        const ty = P.y + face.dy * cfg.ahead;
        let best = Infinity;
        for (const d of opts) {
          const dist = (g.x + d.dx - tx) ** 2 + (g.y + d.dy - ty) ** 2;
          if (dist < best) {
            best = dist;
            pick = d;
          }
        }
      }
      g.dx = pick.dx;
      g.dy = pick.dy;
    }

    function update(dt: number) {
      if (S.phase === "ready") {
        if (S.pt > 1.8) {
          S.phase = "play";
          S.pt = 0;
          setBanner(null);
        }
        return;
      }
      if (S.phase === "dying") {
        if (S.pt > 1.3) {
          if (S.lives <= 0) {
            S.phase = "lost";
            S.pt = 0;
            setBanner("YOU LOST!");
          } else {
            resetPositions();
            S.phase = "ready";
            S.pt = 0;
            setBanner("READY!");
          }
        }
        return;
      }
      if (S.phase === "won" || S.phase === "lost") {
        if (S.pt > 2.6 && !S.done) {
          S.done = true;
          if (S.phase === "won") cb.current.onWin();
          else cb.current.onLose();
        }
        return;
      }

      // ---- oyun sürüyor ----
      S.clock += dt;
      if (S.fright > 0) S.fright = Math.max(0, S.fright - dt);

      if (
        P.moving &&
        (want.dx || want.dy) &&
        want.dx === -P.dx &&
        want.dy === -P.dy
      ) {
        reverse(P);
        face = { ...want };
      }
      advance(P, P.speed * dt, choosePlayer, arrivePlayer);
      if (S.phase !== "play") return;

      for (const g of ghosts) {
        if (g.state === "house") {
          if (S.clock >= g.release) g.state = "leaving";
          continue;
        }
        const scared = S.fright > 0 && g.state === "roam";
        g.speed = g.state === "leaving" ? 3 : scared ? SCARED_SPEED : GHOST_SPEED;
        advance(g, g.speed * dt, () => chooseGhost(g));
      }

      for (const g of ghosts) {
        if (g.state === "house") continue;
        if (Math.hypot(g.x - P.x, g.y - P.y) < 0.7) {
          if (S.fright > 0 && g.state === "roam") {
            sendHome(g);
          } else {
            S.lives--;
            setLives(S.lives);
            S.phase = "dying";
            S.pt = 0;
            break;
          }
        }
      }
    }

    function drawPac(cx: number, cy: number, base: number, m: number) {
      ctx.fillStyle = "#ffe94a";
      for (let py = -7; py < 7; py++) {
        for (let px = -7; px < 7; px++) {
          const ax = px + 0.5;
          const ay = py + 0.5;
          const r2 = ax * ax + ay * ay;
          if (r2 > 49) continue;
          let d = Math.atan2(ay, ax) - base;
          d = Math.atan2(Math.sin(d), Math.cos(d));
          if (Math.abs(d) < m && r2 > 1) continue;
          ctx.fillRect(cx + px, cy + py, 1, 1);
        }
      }
    }

    function drawPlayer() {
      const cx = Math.round(P.x * T + T / 2);
      const cy = Math.round(P.y * T + T / 2);
      const dying = S.phase === "dying";
      if (spriteOk) {
        ctx.save();
        if (dying) ctx.globalAlpha = Math.max(0, 1 - S.pt / 1.1);
        ctx.translate(cx, cy);
        if (face.dx < 0) ctx.scale(-1, 1);
        ctx.drawImage(sprite, -8, -8, 16, 16);
        ctx.restore();
        return;
      }
      const base = Math.atan2(face.dy, face.dx);
      if (dying) {
        const m = Math.min(1, S.pt / 1.1) * Math.PI;
        if (m < Math.PI) drawPac(cx, cy, -Math.PI / 2, m);
        return;
      }
      const m = P.moving ? 0.05 + Math.abs(Math.sin(S.t * 12)) * 0.7 : 0.3;
      drawPac(cx, cy, base, m);
    }

    function drawGhost(g: Ghost) {
      const ox = Math.round(g.x * T) + 1;
      const oy = Math.round(g.y * T) + 1;
      const f = Math.floor(S.t * 6) % 2;
      const rows = [...SPRITE, ...(f ? FEET_B : FEET_A)];
      const scared = S.fright > 0 && g.state === "roam";
      const flash = scared && S.fright < 2 && Math.floor(S.t * 6) % 2 === 0;
      ctx.fillStyle = scared ? (flash ? "#ffffff" : "#2a2ad8") : GHOSTS[g.i].color;
      rows.forEach((r, j) => {
        for (let i = 0; i < r.length; i++) {
          if (r[i] === "#") ctx.fillRect(ox + i, oy + j, 1, 1);
        }
      });
      if (scared) {
        ctx.fillStyle = flash ? "#e5586a" : "#ffd1c0";
        ctx.fillRect(ox + 3, oy + 5, 2, 2);
        ctx.fillRect(ox + 9, oy + 5, 2, 2);
        for (let i = 2; i < 12; i += 2) ctx.fillRect(ox + i, oy + 9 + (i % 4 === 0 ? 1 : 0), 1, 1);
      } else {
        ctx.fillStyle = "#fff";
        ctx.fillRect(ox + 3, oy + 4, 3, 4);
        ctx.fillRect(ox + 8, oy + 4, 3, 4);
        ctx.fillStyle = "#1b1bd6";
        const px = g.dx > 0 ? 1 : 0;
        const py = g.dy > 0 ? 2 : g.dy < 0 ? 0 : 1;
        ctx.fillRect(ox + 3 + px, oy + 4 + py, 2, 2);
        ctx.fillRect(ox + 8 + px, oy + 4 + py, 2, 2);
      }
    }

    function draw() {
      ctx.drawImage(bg, 0, 0);
      const blink = Math.floor(S.t * 4) % 2 === 0;
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const v = pel[y][x];
          if (v === 1) {
            ctx.fillStyle = "#ffb8ae";
            ctx.fillRect(x * T + 7, y * T + 7, 2, 2);
          } else if (v === 2 && blink) {
            ctx.fillStyle = "#ffb8ae";
            ctx.fillRect(x * T + 5, y * T + 4, 6, 8);
            ctx.fillRect(x * T + 4, y * T + 5, 8, 6);
          }
        }
      }
      drawPlayer();
      if (S.phase !== "won") ghosts.forEach(drawGhost);
    }

    function onKey(e: KeyboardEvent) {
      const map: Record<string, Dir> = {
        a: { dx: -1, dy: 0 }, arrowleft: { dx: -1, dy: 0 },
        d: { dx: 1, dy: 0 }, arrowright: { dx: 1, dy: 0 },
        w: { dx: 0, dy: -1 }, arrowup: { dx: 0, dy: -1 },
        s: { dx: 0, dy: 1 }, arrowdown: { dx: 0, dy: 1 },
      };
      const d = map[e.key.toLowerCase()];
      if (!d) return;
      e.preventDefault();
      want = d;
    }
    window.addEventListener("keydown", onKey);

    let last = performance.now();
    let raf = 0;
    function frame(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      S.t += dt;
      S.pt += dt;
      update(dt);
      draw();
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const bannerClass = banner === "READY!" ? "ready" : banner === "YOU WON!" ? "win" : "lose";

  return (
    <div className="maze-stage">
      <div className="maze-hud">
        <span>YEMLER: {left}</span>
        <span>CAN: {"♥".repeat(Math.max(0, lives))}</span>
      </div>
      <div className="maze-frame">
        <canvas ref={canvasRef} width={W} height={H} className="maze-canvas" />
        {banner && <div className={`maze-banner ${bannerClass}`}>{banner}</div>}
      </div>
      <div className="hall-help">
        WASD / ok tuşları: yön ver · büyük nokta: canavarları kovalama gücü
      </div>
    </div>
  );
}