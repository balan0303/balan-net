"use client";
import { useState } from "react";

type Props = {
  lines: string[];
  name: string;
  onDone: () => void;
};

export default function DialogueScene({ lines, name, onDone }: Props) {
  const [i, setI] = useState(0);
  const text = lines[i].replace(/\{isim\}/g, name || "yabancı");

  function next() {
    if (i < lines.length - 1) setI(i + 1);
    else onDone();
  }

  return (
    <div className="stage">
      <div className="character" />
      <div className="bubble" onClick={next}>
        {text}
        <span className="hint">▶ devam için tıkla</span>
      </div>
    </div>
  );
}