"use client";
import { useEffect, useState } from "react";

// Başlık ve açıklamaları buradan değiştir
const PHOTOS = [
  { src: "/photos/1.png", caption: "Fotoğraf 1", info: "Bu fotoğraf hakkında bir şeyler yaz.", color: "#ffd166" },
  { src: "/photos/2.png", caption: "Fotoğraf 2", info: "Bu fotoğraf hakkında bir şeyler yaz.", color: "#ff9ecb" },
  { src: "/photos/3.png", caption: "Fotoğraf 3", info: "Bu fotoğraf hakkında bir şeyler yaz.", color: "#9ad1ff" },
  { src: "/photos/4.png", caption: "Fotoğraf 4", info: "Bu fotoğraf hakkında bir şeyler yaz.", color: "#b8f2c0" },
  { src: "/photos/5.png", caption: "Fotoğraf 5", info: "Bu fotoğraf hakkında bir şeyler yaz.", color: "#d9c8ff" },
  { src: "/photos/6.png", caption: "Fotoğraf 6", info: "Bu fotoğraf hakkında bir şeyler yaz.", color: "#ffb48a" },
];

const TILT = [-2, 1.5, -1, 2, -1.5, 1];

function Photo({ i, tilt }: { i: number; tilt: number }) {
  const p = PHOTOS[i];
  return (
    <div className="photo" style={{ background: p.color, transform: `rotate(${tilt}deg)` }}>
      {i + 1}
      <img src={p.src} alt={p.caption} onError={(e) => (e.currentTarget.style.display = "none")} />
    </div>
  );
}

export default function Gallery({ onClose }: { onClose: () => void }) {
  const [sel, setSel] = useState<number | null>(null);
  const n = PHOTOS.length;

  useEffect(() => {
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (sel !== null) setSel(null);
        else onClose();
      } else if (sel !== null && e.key === "ArrowLeft") setSel((sel + n - 1) % n);
      else if (sel !== null && e.key === "ArrowRight") setSel((sel + 1) % n);
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [sel, onClose, n]);

  return (
    <div className="modal-back">
      <div className="gal-esc">ESC: {sel === null ? "çık" : "geri"}</div>
      {sel === null ? (
        <div className="gal-grid">
          {PHOTOS.map((_, i) => (
            <div key={i} onClick={() => setSel(i)}>
              <Photo i={i} tilt={TILT[i % TILT.length]} />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="gal-zoom">
            <button className="gal-arrow" onClick={() => setSel((sel + n - 1) % n)}>◀</button>
            <Photo i={sel} tilt={0} />
            <button className="gal-arrow" onClick={() => setSel((sel + 1) % n)}>▶</button>
          </div>
          <div className="gal-cap">{PHOTOS[sel].caption}</div>
          <div className="gal-info">{PHOTOS[sel].info}</div>
        </>
      )}
    </div>
  );
}