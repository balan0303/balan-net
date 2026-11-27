"use client";
import { useState } from "react";

const W = 1330;
const H = 800;
const DEBUG = true; // yerleştirirken true, bitince false

type Glow = { color: string; size: number; period: number; delay?: number };
type Sheet = { src: string; frames: number; fps: number };
type Obj = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  text?: string;
  glow?: Glow; // parlayan ışık
  sheet?: Sheet; // sprite sheet animasyonu
};

// Örnek: canavarın yuttuğu lamba. Kendi çizimine göre x,y,w,h değerlerini değiştir.
const OBJECTS: Obj[] = [
  {
    id: "lamp",
    x: 560,
    y: 180,
    w: 120,
    h: 180,
    text: "Canavar bir lambayı yutmuş. Hâlâ yanıyor, hem de nasıl...",
    glow: { color: "255,214,120", size: 420, period: 6 },
    // sheet: { src: "/monster/lamp-sheet.png", frames: 4, fps: 3 },
  },
];

const pct = (v: number, total: number) => `${(v / total) * 100}%`;

type Props = { onRetry: () => void; onBack: () => void };

export default function MonsterMouth({ onRetry, onBack }: Props) {
  const [info, setInfo] = useState<string | null>(null);
  const [coord, setCoord] = useState("");

  function showCoord(e: React.MouseEvent<HTMLDivElement>) {
    if (!DEBUG) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - r.left) / r.width) * W);
    const y = Math.round(((e.clientY - r.top) / r.height) * H);
    setCoord(`x: ${x}, y: ${y}`);
  }

  return (
    <div className="hall-stage">
      <div className="hall-frame mouth-frame" onMouseMove={showCoord}>
        <img
          className="mouth-bg"
          src="/monster/mouth.png"
          alt=""
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
        {OBJECTS.map((o) => {
          const rect = {
            left: pct(o.x, W),
            top: pct(o.y, H),
            width: pct(o.w, W),
            height: pct(o.h, H),
          };
          return (
            <div key={o.id}>
              {o.sheet && (
                <div
                  className="mouth-sheet"
                  style={{
                    ...rect,
                    backgroundImage: `url(${o.sheet.src})`,
                    backgroundSize: `${o.sheet.frames * 100}% 100%`,
                    animation: `sheet ${o.sheet.frames / o.sheet.fps}s steps(${o.sheet.frames - 1}, jump-none) infinite`,
                  }}
                />
              )}
              {o.glow && (
                <div
                  className="mouth-glow"
                  style={{
                    left: pct(o.x + o.w / 2, W),
                    top: pct(o.y + o.h / 2, H),
                    width: pct(o.glow.size, W),
                    background: `radial-gradient(circle, rgba(${o.glow.color},0.95) 0%, rgba(${o.glow.color},0.4) 30%, rgba(${o.glow.color},0) 70%)`,
                    animationDuration: `${o.glow.period}s`,
                    animationDelay: `${o.glow.delay ?? 0}s`,
                  }}
                />
              )}
              <div
                className={`mouth-hit ${DEBUG ? "debug" : ""}`}
                style={rect}
                onClick={() => setInfo(o.text ?? "")}
              />
            </div>
          );
        })}
        {info && (
          <div className="hall-info" onClick={() => setInfo(null)}>
            {info}
          </div>
        )}
      </div>

      <div className="mouth-btns">
        <button className="pixel-btn" onClick={onRetry}>Tekrar dene</button>
        <button className="pixel-btn" onClick={onBack}>Salona dön</button>
      </div>
      <div className="hall-help">
        Eşyalara tıklayarak incele
        {DEBUG && coord && <span> · fare: {coord}</span>}
      </div>
    </div>
  );
}