"use client";
import { useEffect, useState } from "react";
import Character, { type Mood } from "./Character";
import DialogueBox from "./DialogueBox";

export type Line = { text: string; mood?: Mood };

type Props = {
  lines: Line[];
  name: string;
  onDone: () => void;
};

const SPEED_MS = 35; // harf başına süre, küçüldükçe hızlanır

export default function DialogueScene({ lines, name, onDone }: Props) {
  const [i, setI] = useState(0);
  const [count, setCount] = useState(0);

  const line = lines[i];
  const text = line.text.replace(/\{isim\}/g, name || "yabancı");
  const finished = count >= text.length;

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
    if (!finished) setCount(text.length);
    else if (i < lines.length - 1) setI(i + 1);
    else onDone();
  }

  return (
    <div className="vn-stage">
      <Character mood={line.mood} />
      <DialogueBox mood={line.mood} onClick={handleClick}>
        {text.slice(0, count)}
        <span className="hint" style={{ visibility: finished ? "visible" : "hidden" }}>
          ▶ devam için tıkla
        </span>
      </DialogueBox>
    </div>
  );
}