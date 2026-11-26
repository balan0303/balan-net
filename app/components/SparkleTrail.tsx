"use client";
import { useEffect } from "react";

export default function SparkleTrail() {
  useEffect(() => {
    let last = 0;
    function move(e: MouseEvent) {
      const now = performance.now();
      if (now - last < 45) return;
      last = now;
      const s = document.createElement("span");
      s.className = "trail";
      s.style.left = `${e.clientX}px`;
      s.style.top = `${e.clientY}px`;
      s.style.setProperty("--dx", `${Math.random() * 30 - 15}px`);
      s.style.background = Math.random() < 0.5 ? "#ff9ecb" : "#fff";
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 700);
    }
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);
  return null;
}