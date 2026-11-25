"use client";
import { useEffect, useState } from "react";
import Bubble from "./Bubble";

type Props = {
  lines: string[];
  name: string;
  onDone: () => void;
};

const SPEED_MS = 35; // harf başına süre, küçüldükçe hızlanır

export default function DialogueScene({ lines, name, onDone }: Props) {
  const [i, setI] = useState(0);
  const [count, setCount] = useState(0);

  const text = lines[i].replace(/\{isim\}/g, name || "yabancı");
  const finished = count >= text.length;

  // Satır değişince harf harf yazmaya başla
  useEffect(() => {
    setCount(0);
    const id = setInterval(() => {
      setCount((c) => {
        if (c >= text.length) {
          clearInterval(id);
          return c;
        }
        return c + 1;
      });
    }, SPEED_MS);
    return () => clearInterval(id);
  }, [text]);

  function handleClick() {
    if (!finished) {
      setCount(text.length); // yazı bitmeden tıklanırsa hepsini göster
    } else if (i < lines.length - 1) {
      setI(i + 1);
    } else {
      onDone();
    }
  }

  return (
    <div className="stage">
      <div className="character" />
      <Bubble onClick={handleClick}>
        {text.slice(0, count)}
        <span className="hint" style={{ visibility: finished ? "visible" : "hidden" }}>
          ▶ devam için tıkla
        </span>
      </Bubble>
    </div>
  );
}