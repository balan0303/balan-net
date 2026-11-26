"use client";
import { useEffect, useRef, useState } from "react";
import Letter from "./Letter";
import Gallery from "./Gallery";

const W = 1330;
const H = 800;
const PLAYER_SCALE = 1;
const SPEED = 230;
const REACH = 60;
const FEET_HW = 16;
const FEET_HH = 8;
const START = { x: 665, y: 620 };
const DEBUG = false;
const SHOW_MASK = false;
const DOOR_NEEDS_LETTER = false;

type Spot = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  reach?: number;
  label: string;
  kind: "info" | "well" | "board" | "door";
  text?: string;
};

const SPOTS: Spot[] = [
  { id: "well", x: 1080, y: 285, w: 180, h: 140, reach: 110, kind: "well", label: "Sonsuzluğa Giden Doğaüstü Kazan" },
  { id: "tv", x: 1165, y: 450, w: 140, h: 170, reach: 80, kind: "info", label: "Televizyon", text: "Meşhur American Horror Story dizisinin 8. sezonu televizyonda yaklaşık 56 saattir oynuyor." },
  { id: "board", x: 290, y: 600, w: 180, h: 15, reach: 90, kind: "board", label: "Fotoğraf panosu" },
  { id: "poster1", x: 70, y: 530, w: 74, h: 130, reach: 80, kind: "info", label: "Poster", text: "Bengi bir NewJeans süper-hayranı." },
  { id: "door", x: 160, y: 190, w: 130, h: 200, reach: 90, kind: "door", label: "Bengi'nin odası" },
];

const WELL = SPOTS.find((s) => s.id === "well")!;

let maskData: ImageData | null = null;

function loadMask(src: string) {
  const img = new Image();
  img.onload = () => {
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const cx = c.getContext("2d", { willReadFrequently: true })!;
    cx.drawImage(img, 0, 0, W, H);
    maskData = cx.getImageData(0, 0, W, H);
  };
  img.src = src;
}

function walkable(x: number, y: number) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  if (ix < 0 || iy < 0 || ix >= W || iy >= H) return false;
  if (!maskData) return true;
  const i = (iy * W + ix) * 4;
  return maskData.data[i + 3] > 128 && maskData.data[i] > 128;
}

function blocked(px: number, py: number) {
  return !(
    walkable(px - FEET_HW, py - FEET_HH) &&
    walkable(px + FEET_HW, py - FEET_HH) &&
    walkable(px - FEET_HW, py + FEET_HH) &&
    walkable(px + FEET_HW, py + FEET_HH)
  );
}

function load(src: string) {
  const o = { img: new Image(), ok: false };
  o.img.onload = () => (o.ok = true);
  o.img.src = src;
  return o;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number; c: string };

type Props = {
  name: string;
  letterSent: boolean;
  onLetterSent: () => void;
  onDoor: () => void;
};

export default function Hall({ name, letterSent, onLetterSent, onDoor }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keys = useRef<Set<string>>(new Set());
  const modalRef = useRef<null | "letter" | "board">(null);
  const sentRef = useRef(letterSent);
  const nearRef = useRef<Spot | null>(null);

  const [modal, setModal] = useState<null | "letter" | "board">(null);
  const [info, setInfo] = useState<string | null>(null);
  const [near, setNear] = useState<Spot | null>(null);
  const [coord, setCoord] = useState("");

  useEffect(() => {
    modalRef.current = modal;
    if (modal) keys.current.clear();
  }, [modal]);

  useEffect(() => {
    sentRef.current = letterSent;
  }, [letterSent]);

  useEffect(() => {
    function interact() {
      const s = nearRef.current;
      if (!s) return;
      if (s.kind === "info") setInfo(s.text ?? "");
      else if (s.kind === "well") {
        if (letterSent) setInfo("Kazan pembe pembe parlıyor... mektubun çoktan yolda.");
        else setModal("letter");
      } else if (s.kind === "board") setModal("board");
      else if (s.kind === "door") {
        if (DOOR_NEEDS_LETTER && !letterSent) setInfo("Kapı kilitli. Önce kazana mektubu bırak.");
        else onDoor();
      }
    }
    function down(e: KeyboardEvent) {
      if (modalRef.current) return;
      const k = e.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
      if (k === "e" || k === " " || k === "enter") {
        if (!e.repeat) interact();
        return;
      }
      keys.current.add(k);
    }
    function up(e: KeyboardEvent) {
      keys.current.delete(e.key.toLowerCase());
    }
    function blur() {
      keys.current.clear();
    }
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, [letterSent, onDoor]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;

    const imgs = {
      before: load("/hall/hall-before.png"),
      after: load("/hall/hall-after.png"),
      player: load("/hall/player.png"),
      mask: load("/hall/mask.png"),
    };
    loadMask("/hall/mask.png");

    const P = PLAYER_SCALE;
    const p = { x: START.x, y: START.y };
    let startFixed = false;
    let parts: Particle[] = [];
    let last = performance.now();
    let t = 0;
    let spawn = 0;
    let raf = 0;

    function fixStart() {
      if (!blocked(p.x, p.y)) return;
      for (let r = 6; r < 900; r += 6) {
        for (let a = 0; a < 24; a++) {
          const x = START.x + Math.cos((a / 24) * Math.PI * 2) * r;
          const y = START.y + Math.sin((a / 24) * Math.PI * 2) * r;
          if (!blocked(x, y)) {
            p.x = x;
            p.y = y;
            return;
          }
        }
      }
    }

    function frame(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;

      if (maskData && !startFixed) {
        startFixed = true;
        fixStart();
      }

      let dx = 0;
      let dy = 0;
      const k = keys.current;
      if (!modalRef.current) {
        if (k.has("a") || k.has("arrowleft")) dx -= 1;
        if (k.has("d") || k.has("arrowright")) dx += 1;
        if (k.has("w") || k.has("arrowup")) dy -= 1;
        if (k.has("s") || k.has("arrowdown")) dy += 1;
      }
      const moving = dx !== 0 || dy !== 0;
      if (moving) {
        const len = Math.hypot(dx, dy);
        dx = (dx / len) * SPEED * dt;
        dy = (dy / len) * SPEED * dt;
        if (!blocked(p.x + dx, p.y)) p.x += dx;
        if (!blocked(p.x, p.y + dy)) p.y += dy;
      }

      let s: Spot | null = null;
      let best = Infinity;
      for (const sp of SPOTS) {
        const cx = Math.max(sp.x, Math.min(p.x, sp.x + sp.w));
        const cy = Math.max(sp.y, Math.min(p.y, sp.y + sp.h));
        const d = Math.hypot(p.x - cx, p.y - cy);
        if (d <= (sp.reach ?? REACH) && d < best) {
          best = d;
          s = sp;
        }
      }
      if (s?.id !== nearRef.current?.id) {
        nearRef.current = s;
        setNear(s);
        setInfo(null);
      }

      if (moving) {
        spawn += dt;
        if (spawn > 0.05) {
          spawn = 0;
          parts.push({
            x: p.x + rand(-20, 20), y: p.y - 10,
            vx: rand(-25, 25), vy: rand(-60, -15),
            life: 0.6, max: 0.6,
            c: Math.random() < 0.5 ? "#ff9ecb" : "#fff",
          });
        }
      }
      if (sentRef.current && Math.random() < 0.15) {
        parts.push({
          x: WELL.x + WELL.w / 2 + rand(-WELL.w / 3, WELL.w / 3), y: WELL.y + WELL.h * 0.3,
          vx: rand(-15, 15), vy: rand(-90, -35),
          life: 1.2, max: 1.2, c: "#ffb3dc",
        });
      }
      for (const q of parts) {
        q.x += q.vx * dt;
        q.y += q.vy * dt;
        q.life -= dt;
      }
      parts = parts.filter((q) => q.life > 0);

      const bg = sentRef.current ? imgs.after : imgs.before;
      if (bg.ok) ctx.drawImage(bg.img, 0, 0, W, H);
      else {
        ctx.fillStyle = "#2a2140";
        ctx.fillRect(0, 0, W, H);
      }

      const x = Math.round(p.x);
      const y = Math.round(p.y);
      if (imgs.player.ok) {
        const pw = imgs.player.img.width * P;
        const ph = imgs.player.img.height * P;
        ctx.drawImage(imgs.player.img, Math.round(p.x - pw / 2), Math.round(p.y - ph + FEET_HH), pw, ph);
      } else {
        const bob = Math.round(Math.sin(t * 4)) * 3;
        const gy = y + bob;
        ctx.fillStyle = "#f3ecff";
        ctx.fillRect(x - 24, gy - 62, 48, 50);
        ctx.fillRect(x - 16, gy - 74, 32, 12);
        ctx.fillRect(x - 24, gy - 12, 12, 10);
        ctx.fillRect(x - 6, gy - 12, 12, 10);
        ctx.fillRect(x + 12, gy - 12, 12, 10);
        ctx.fillStyle = "#3a2a5a";
        ctx.fillRect(x - 12, gy - 50, 8, 10);
        ctx.fillRect(x + 4, gy - 50, 8, 10);
      }

      for (const q of parts) {
        ctx.globalAlpha = q.life / q.max;
        ctx.fillStyle = q.c;
        ctx.fillRect(Math.round(q.x), Math.round(q.y), 6, 6);
      }
      ctx.globalAlpha = 1;

      if (SHOW_MASK && imgs.mask.ok) {
        ctx.globalAlpha = 0.35;
        ctx.drawImage(imgs.mask.img, 0, 0, W, H);
        ctx.globalAlpha = 1;
      }

      if (DEBUG) {
        ctx.lineWidth = 2;
        ctx.font = "20px monospace";
        for (const b of SPOTS) {
          ctx.strokeStyle = "lime";
          ctx.strokeRect(b.x, b.y, b.w, b.h);
          ctx.fillStyle = "lime";
          ctx.fillText(b.id, b.x, b.y - 4);
          const r = b.reach ?? REACH;
          ctx.strokeStyle = "yellow";
          ctx.strokeRect(b.x - r, b.y - r, b.w + r * 2, b.h + r * 2);
        }
        ctx.strokeStyle = "cyan";
        ctx.strokeRect(p.x - FEET_HW, p.y - FEET_HH, FEET_HW * 2, FEET_HH * 2);
      }

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  function showCoord(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!DEBUG) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * W);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * H);
    setCoord(`x: ${x}, y: ${y}`);
  }

  function clickCanvas(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    const hit = SPOTS.find((s) => x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h);
    if (hit && nearRef.current?.id === hit.id) {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "e" }));
    }
  }

  return (
    <div className="hall-stage">
      <div className="hall-frame">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="hall-canvas"
          onMouseMove={showCoord}
          onClick={clickCanvas}
        />
        {near && !modal && !info && <div className="hall-prompt">[E] {near.label}</div>}
        {info && (
          <div className="hall-info" onClick={() => setInfo(null)}>
            {info}
          </div>
        )}
      </div>
      <div className="hall-help">
        WASD / ok tuşları: yürü · E veya boşluk: incele
        {DEBUG && coord && <span> · fare: {coord}</span>}
      </div>

      {modal === "letter" && (
        <Letter
          defaultFrom={name}
          onClose={() => setModal(null)}
          onSent={() => {
            setModal(null);
            onLetterSent();
            setInfo("Kazan mektubunu garip sesler çıkararak yuttu. Sana mektubunun yolda olduğunu söyledi. Üzerine ölümcül-kazan-petrolü sıçradı.");
          }}
        />
      )}
      {modal === "board" && <Gallery onClose={() => setModal(null)} />}
    </div>
  );
}