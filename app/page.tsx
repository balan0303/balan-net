"use client";
import { useState } from "react";
import DialogueScene from "./components/DialogueScene";

type Scene = "intro" | "askName" | "greet" | "roomPlaceholder";

const introLines = [
  "Ah... biri geldi!",
  "Merhaba. Ben Balan. Sonsuza kadar yalnız kalacağım sanmıştım. Fakat Dünya gerçekten çok büyük.",
  "Bir şeyleri unutmuş durumdayım ama sanırım bana sen yardım edebilirsin.",
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

  if (scene === "intro") {
    return <DialogueScene lines={introLines} name={name} onDone={() => setScene("askName")} />;
  }

  if (scene === "askName") {
    return (
      <div className="stage">
        <div className="character" />
        <div className="bubble" style={{ cursor: "default" }}>
          Peki senin adın ne?
          <input
            className="pixel-input"
            value={draft}
            maxLength={20}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && draft.trim()) {
                setName(draft.trim());
                setScene("greet");
              }
            }}
            autoFocus
          />
          <button
            className="pixel-btn"
            disabled={!draft.trim()}
            onClick={() => {
              setName(draft.trim());
              setScene("greet");
            }}
          >
            Tamam
          </button>
        </div>
      </div>
    );
  }

  if (scene === "greet") {
    return <DialogueScene lines={greetLines} name={name} onDone={() => setScene("roomPlaceholder")} />;
  }

  return (
    <div className="stage">
      <div className="bubble">Oda sahnesi buraya gelecek, {name}!</div>
    </div>
  );
}