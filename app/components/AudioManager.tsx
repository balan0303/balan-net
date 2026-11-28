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

const els: Partial<Record<string, HTMLAudioElement>> = {};
let wanted: Track = null;
let unlocked = false;
let muted = false;

function ensure(name: Exclude<Track, null>) {
  let a = els[name];
  if (!a) {
    a = new Audio(FILES[name]);
    a.loop = true;
    a.preload = "auto";
    a.volume = 0;
    a.muted = muted;
    els[name] = a;
  }
  return a;
}

function fadeTo(a: HTMLAudioElement, to: number, ms: number, then?: () => void) {
  const id = Math.random().toString(36);
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

function tryPlay(a: HTMLAudioElement, name: string) {
  a.play().catch((err) => console.warn("Müzik çalınamadı:", name, err));
}

function apply() {
  if (!unlocked) return;

  // Çalmaması gereken parçaları kıs ve durdur
  for (const [name, a] of Object.entries(els)) {
    if (!a || name === wanted) continue;
    if (!a.paused && a.dataset.mode !== "out") {
      a.dataset.mode = "out";
      fadeTo(a, 0, FADE_MS, () => {
        if (wanted !== name) a.pause();
      });
    }
  }

  // Çalması gereken parçayı başlat ve aç
  if (wanted) {
    const a = ensure(wanted);
    a.muted = muted;
    if (a.paused) tryPlay(a, wanted);
    if (a.dataset.mode !== "in") {
      a.dataset.mode = "in";
      fadeTo(a, VOLUME, FADE_MS);
    }
  }
}

export function setTrack(t: Track) {
  wanted = t;
  if (t) ensure(t); // dosyayı önceden indirmeye başla
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
    // Her tıklama ve tuşta: kilidi aç, durmuş parça varsa tekrar dene
    function interact() {
      unlocked = true;
      apply();
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
    for (const a of Object.values(els)) if (a) a.muted = muted;
  }

  return (
    <button className="mute-btn" onClick={toggle}>
      {off ? "♪ kapalı" : "♪ açık"}
    </button>
  );
}