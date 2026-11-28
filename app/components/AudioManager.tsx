"use client";
import { useEffect, useState } from "react";

export type Track = "intro" | "hall" | "maze" | "site" | "monster" | null;

const FILES: Record<Exclude<Track, null>, string> = {
  intro: "/audio/intro.mp3",
  hall: "/audio/hall.mp3",
  maze: "/audio/maze.mp3",
  site: "/audio/site.mp3",
  monster: "/audio/monster.mp3",
};

const VOLUME = 0.3; // müzik sesi (0 ile 1 arası)
const FADE_MS = 1800; // fade in / fade out süresi
const STEP_MS = 50;

type State = {
  els: Partial<Record<string, HTMLAudioElement>>;
  wanted: Track;
  unlocked: boolean;
  muted: boolean;
  timer: number | null;
  lastTry: Record<string, number>;
};

// Kod yenilense bile aynı durum kullanılsın diye window üzerinde tutulur
const g = globalThis as unknown as { __music?: State };
function S(): State {
  if (!g.__music) {
    g.__music = { els: {}, wanted: null, unlocked: false, muted: false, timer: null, lastTry: {} };
  }
  return g.__music;
}

function ensure(name: Exclude<Track, null>) {
  const s = S();
  let a = s.els[name];
  if (!a) {
    a = new Audio(FILES[name]);
    a.loop = true;
    a.preload = "auto";
    a.volume = 0;
    a.muted = s.muted;
    s.els[name] = a;
  }
  return a;
}

function tick() {
  const s = S();
  const step = (VOLUME * STEP_MS) / FADE_MS;
  for (const [name, a] of Object.entries(s.els)) {
    if (!a) continue;
    const target = s.unlocked && name === s.wanted ? VOLUME : 0;

    // Çalması gereken parça duruyorsa (reddedilmiş ya da iptal olmuş) tekrar dene
    if (target > 0 && a.paused) {
      const now = performance.now();
      if (now - (s.lastTry[name] ?? 0) > 1000) {
        s.lastTry[name] = now;
        a.play().catch((err) => console.warn("Müzik çalınamadı:", name, err));
      }
    }

    // Sesi hedefe doğru yumuşakça yaklaştır
    if (a.volume < target) a.volume = Math.min(target, a.volume + step);
    else if (a.volume > target) a.volume = Math.max(target, a.volume - step);

    // Tamamen kısılan parçayı durdur
    if (target === 0 && a.volume === 0 && !a.paused) a.pause();
  }
}

function startLoop() {
  const s = S();
  if (s.timer === null && typeof window !== "undefined") {
    s.timer = window.setInterval(tick, STEP_MS);
  }
}

export function setTrack(t: Track) {
  const s = S();
  s.wanted = t;
  if (t) ensure(t); // dosyayı önceden indirmeye başla
  startLoop();
}

export function playSfx(src: string, volume = 0.5) {
  if (S().muted) return;
  const a = new Audio(src);
  a.volume = volume;
  a.play().catch(() => {});
}

export function Music({ track }: { track: Track }) {
  useEffect(() => {
    setTrack(track);
  }, [track]);
  return null;
}

export default function AudioManager() {
  const [off, setOff] = useState(false);

  useEffect(() => {
    startLoop();
    function interact() {
      S().unlocked = true; // ilk tıklama ya da tuştan sonra müzik izni açılır
    }
    window.addEventListener("pointerdown", interact);
    window.addEventListener("keydown", interact);
    return () => {
      window.removeEventListener("pointerdown", interact);
      window.removeEventListener("keydown", interact);
    };
  }, []);

  function toggle() {
    const s = S();
    s.muted = !s.muted;
    setOff(s.muted);
    for (const a of Object.values(s.els)) if (a) a.muted = s.muted;
  }

  return (
    <button className="mute-btn" onClick={toggle}>
      {off ? "♪ kapalı" : "♪ açık"}
    </button>
  );
}