"use client";
import { useEffect, useRef, useState } from "react";
import Letter from "./Letter";
import Gallery from "./Gallery";

const W = 1330;
const H = 800;
const PLAYER_SCALE = 1; // pixel art'ı 2x2 çizdiysen hayaleti yarı boyda çiz ve 2 yap
const SPEED = 230; // çizim pikseli / saniye
const REACH = 50; // objeye bu kadar yaklaşınca etkileşim açılır
const FEET_HW = 16; // ayak kutusunun yarı genişliği (çarpışma için)
const FEET_HH = 8; // ayak kutusunun yarı yüksekliği
const START = { x: 665, y: 620 }; // başlangıç noktası (maskede beyaz değilse otomatik düzelir)
const DEBUG = true; // koordinatları ayarlarken true, bitince false yap
const DOOR_NEEDS_LETTER = false; // true yaparsan kapı mektup atılmadan açılmaz

type Spot = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  kind: "info" | "well" | "board" | "door";
  text?: string;
};

// YER TUTUCU KOORDİNATLAR. Salonda fareyi eşyanın üstüne götür, alttaki x, y değerlerini oku,
// sonra buradaki sayıları kendi çizimine göre değiştir. x,y = sol üst köşe, w,h = genişlik, yükseklik.
const SPOTS: Spot[] = [
  { id: "well", x: 560, y: 330, w: 200, h: 140, kind: "well", label: "Sonsuzluğa Giden Doğaüstü Kazan" },
  { id: "board", x: 470, y: 40, w: 390, h: 130, kind: "board", label: "Fotoğraf panosu" },
  { id: "tv", x: 80, y: 180, w: 150, h: 100, kind: "info", label: "Televizyon", text: "Bengi is watching American Horror Story season 8!" },
  { id: "coffee", x: 300, y: 180, w: 80, h: 90, kind: "info", label: "Kahve makinesi", text: "Bengi's fourth coffee of the day." },
  { id: "poster1", x: 940, y: 60, w: 110, h: 150, kind: "info", label: "Poster", text: "A superfan of NewJeans." },
  { id: "poster2", x: 1080, y: 60, w: 90, h: 150, kind: "info", label: "Poster", text: "Another poster. She really likes posters." },
  { id: "door", x: 1170, y: 100, w: 110, h: 200, kind: "door", label: "Bengi'nin odası" },
];

const WELL = SPOTS.find((s) => s.id === "well")!;

// ---- Maske: beyaz = yürünebilir ----
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
  if (!maskData) return true; // maske yoksa serbest
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

  // Klavye
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

  // Oyun döngüsü
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;

    const imgs = {
      before: load("/hall/hall-before.png"),
      after: load("/hall/hall-after.png"),
      player: load("/hall/player.png"),
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

    // Başlangıç beyaz değilse en yakın beyaz noktayı bul
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

      // hareket
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

      // yakındaki obje
      const s =
        SPOTS.find(
          (s) =>
            p.x >= s.x - REACH && p.x <= s.x + s.w + REACH &&
            p.y >= s.y - REACH && p.y <= s.y + s.h + REACH
        ) ?? null;
      if (s?.id !== nearRef.current?.id) {
        nearRef.current = s;
        setNear(s);
        setInfo(null);
      }

      // pırıltılar
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

      // çizim
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
        // yer tutucu hayalet
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

      if (DEBUG) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = "lime";
        for (const b of SPOTS) ctx.strokeRect(b.x, b.y, b.w, b.h);
        ctx.strokeStyle = "yellow";
        for (const b of SPOTS)
          ctx.strokeRect(b.x - REACH, b.y - REACH, b.w + REACH * 2, b.h + REACH * 2);
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

  return (
    <div className="hall-stage">
      <div className="hall-frame">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="hall-canvas"
          onMouseMove={showCoord}
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
            setInfo("Kazan pembe bir ışıkla parladı... mektubun yola çıktı!");
          }}
        />
      )}
      {modal === "board" && <Gallery onClose={() => setModal(null)} />}
    </div>
  );
}