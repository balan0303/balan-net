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
const FADE_MS = 900; // geçiş süresi

let current: HTMLAudioElement | null = null;
let wanted: Track = null;
let unlocked = false; // ilk tıklamadan sonra true olur
let muted = false;

function fade(a: HTMLAudioElement, to: number, ms: number, then?: () => void) {
  const from = a.volume;
  const start = performance.now();
  function step(now: number) {
    const k = Math.min(1, (now - start) / ms);
    a.volume = from + (to - from) * k;
    if (k < 1) requestAnimationFrame(step);
    else then?.();
  }
  requestAnimationFrame(step);
}

function apply() {
  if (!unlocked) return;
  const file = wanted ? FILES[wanted] : null;
  if (current && current.dataset.src === file) return;

  const old = current;
  current = null;
  if (old) fade(old, 0, FADE_MS, () => old.pause());

  if (file) {
    const a = new Audio(file);
    a.loop = true;
    a.volume = 0;
    a.muted = muted;
    a.dataset.src = file;
    a.play().catch(() => {});
    fade(a, VOLUME, FADE_MS);
    current = a;
  }
}

// Herhangi bir yerden çağır: setTrack("hall")
export function setTrack(t: Track) {
  wanted = t;
  apply();
}

// Ses efekti
export function playSfx(src: string, volume = 0.5) {
  if (muted) return;
  const a = new Audio(src);
  a.volume = volume;
  a.play().catch(() => {});
}

// Sayfaya <Music track="site" /> koyarak da kullanılabilir
export function Music({ track }: { track: Track }) {
  useEffect(() => {
    setTrack(track);
  }, [track]);
  return null;
}

export default function AudioManager() {
  const [off, setOff] = useState(false);

  useEffect(() => {
    function unlock() {
      unlocked = true;
      apply();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    }
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  function toggle() {
    muted = !muted;
    setOff(muted);
    if (current) current.muted = muted;
  }

  return (
    <button className="mute-btn" onClick={toggle}>
      {off ? "♪ kapalı" : "♪ açık"}
    </button>
  );
}