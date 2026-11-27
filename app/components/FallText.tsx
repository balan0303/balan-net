"use client";
import { useEffect, useState } from "react";

export default function FallText({ lines, onDone }: { lines: string[]; onDone: () => void }) {
  const [i, setI] = useState(0);
  const [count, setCount] = useState(0);

  const text = lines[i];
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
    }, 45);
    return () => clearInterval(id);
  }, [text]);

  function click() {
    if (!finished) setCount(text.length);
    else if (i < lines.length - 1) setI(i + 1);
    else onDone();
  }

  return (
    <div className="fall-stage" onClick={click}>
      <div className="fall-text">{text.slice(0, count)}</div>
      <div className="hint" style={{ visibility: finished ? "visible" : "hidden" }}>
        ▶ devam için tıkla
      </div>
    </div>
  );
}