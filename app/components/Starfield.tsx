"use client";
import { useEffect, useState } from "react";

type Star = { x: number; y: number; s: number; d: number; t: number; c: string };

export default function Starfield() {
  const [stars, setStars] = useState<Star[]>([]);
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const colors = ["#fff", "#fff", "#fff", "#ffd1ea", "#d9c8ff", "#fff3a8"];
    setStars(
      Array.from({ length: 140 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        s: Math.random() < 0.15 ? 4 : 2,
        d: 2 + Math.random() * 4,
        t: Math.random() * 5,
        c: colors[Math.floor(Math.random() * colors.length)],
      }))
    );

    function move(e: MouseEvent) {
      const el = e.target as HTMLElement;
      // Diyalog kutusu, salon çerçevesi, pencereler, input ve butonların dışı = arka plan
      const onBackground = !el.closest(
        ".vn-box, .hall-frame, .modal-back, input, button, textarea"
      );
      setTip(onBackground ? { x: e.clientX, y: e.clientY } : null);
    }

    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  return (
    <>
      <div className="starfield">
        {stars.map((s, i) => (
          <span
            key={i}
            className="star"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.s,
              height: s.s,
              background: s.c,
              animationDuration: `${s.d}s`,
              animationDelay: `${s.t}s`,
            }}
          />
        ))}
        <span className="shooting" style={{ left: "10%", top: "8%", animationDelay: "2s" }} />
        <span className="shooting" style={{ left: "55%", top: "3%", animationDelay: "6s" }} />
        <span className="shooting" style={{ left: "30%", top: "20%", animationDelay: "11s" }} />
      </div>
      {tip && (
        <div className="sky-tip" style={{ left: tip.x, top: tip.y }}>
          Bu uzay gemisi bilinen sonsuzluğun sonuna doğru hareket ediyor... Sıkı tutun!
        </div>
      )}
    </>
  );
}