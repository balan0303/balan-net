"use client";
import { useState } from "react";
import DialogueScene from "./components/DialogueScene";
import Bubble from "./components/Bubble";

type Scene = "intro" | "askName" | "greet" | "roomPlaceholder";

const introLines = [
  "Ah... biri geldi!",
  "Merhaba. Ben Mina. Burada uzun zamandır birini bekliyordum.",
  "Sanırım bir şeyleri unutmuş durumdayım ama sen yardım edebilirsin.",
];

const greetLines = [
  "Memnun oldum, {isim}!",
  "Ne güzel bir isim. Hiç unutmayacağım.",
  "Şimdi sana küçük bir görev vereceğim...",
];

export default function Home() {
  const [scene, setScene] = useState<Scene>("intro");
  const [name, setName] = useState("");
  const [draft, setDraft] = useState("");

  function submitName() {
    if (!draft.trim()) return;
    setName(draft.trim());
    setScene("greet");
  }

  if (scene === "intro") {
    return <DialogueScene lines={introLines} name={name} onDone={() => setScene("askName")} />;
  }

  if (scene === "askName") {
    return (
      <div className="stage">
        <div className="character" />
        <Bubble>
          Peki senin adın ne?
          <input
            className="pixel-input"
            value={draft}
            maxLength={20}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitName()}
            autoFocus
          />
          <button className="pixel-btn" disabled={!draft.trim()} onClick={submitName}>
            Tamam
          </button>
        </Bubble>
      </div>
    );
  }

  if (scene === "greet") {
    return <DialogueScene lines={greetLines} name={name} onDone={() => setScene("roomPlaceholder")} />;
  }

  return (
    <div className="stage">
      <Bubble>Oda sahnesi buraya gelecek, {name}!</Bubble>
    </div>
  );
}