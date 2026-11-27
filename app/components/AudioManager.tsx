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

const VOLUME = 0.3;
const FADE_MS = 900;

let current: HTMLAudioElement | null = null;
let wanted: Track = null;
let unlocked = false;
let muted = false;

function fade(a: HTMLAudioElement, to: number, ms: number, then?: () => void) {
  const id = String(Math.random());
  a.dataset.fade = id; // yeni bir geçiş başlarsa eskisi durur
  const from = a.volume;
  const start = performance.now();
  function step(now: number) {
    if (a.dataset.fade !== id) return;
    const k = Math.min(1, (now - start) / ms);
    a.volume = from + (to - from) * k;
    if (k < 1) requestAnimationFrame(step);
    else then?.();
  }
  requestAnimationFrame(step);
}

function tryPlay(a: HTMLAudioElement) {
  a.play().catch((err) => console.warn("Müzik çalınamadı:", a.dataset.src, err));
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
    current = a;
    tryPlay(a);
    fade(a, VOLUME, FADE_MS);
  }
}

export function setTrack(t: Track) {
  wanted = t;
  apply();
}

export function playSfx(src: string, volume = 0.5) {
  if (muted) return;
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
    // Her tıklama ve tuşta: kilidi aç, çalması gereken parça durmuşsa tekrar dene
    function interact() {
      unlocked = true;
      apply();
      if (current && current.paused) tryPlay(current);
    }
    window.addEventListener("pointerdown", interact);
    window.addEventListener("keydown", interact);
    return () => {
      window.removeEventListener("pointerdown", interact);
      window.removeEventListener("keydown", interact);
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