"use client";
import { useEffect, useRef, useState } from "react";

export function playSfx(src: string, volume = 0.5) {
  const a = new Audio(src);
  a.volume = volume;
  a.play().catch(() => {});
}

export default function AudioManager() {
  const music = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const a = new Audio("/audio/music.mp3");
    a.loop = true;
    a.volume = 0.3;
    music.current = a;

    function start() {
      a.play().catch(() => {});
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
    }
    window.addEventListener("pointerdown", start);
    window.addEventListener("keydown", start);
    return () => {
      a.pause();
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
    };
  }, []);

  useEffect(() => {
    if (music.current) music.current.muted = muted;
  }, [muted]);

  return (
    <button className="mute-btn" onClick={() => setMuted(!muted)}>
      {muted ? "♪ kapalı" : "♪ açık"}
    </button>
  );
}