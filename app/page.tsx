"use client";
import { useState } from "react";
import DialogueScene, { type Line } from "./components/DialogueScene";
import DialogueBox from "./components/DialogueBox";
import Character from "./components/Character";
import Hall from "./components/Hall";

type Scene = "intro" | "askName" | "greet" | "hall" | "mazePlaceholder";

const introLines: Line[] = [
  { text: "Ah, biri gelmiş!", mood: "surprised" },
  { text: "Merhaba, ben Bengi.", mood: "happy" },
  { text: "Çok uzun süredir buradayım fakat artık gitmem gerekiyor.", mood: "sad" },
  { text: "Çünkü odamı kötücül süpergüçler ele geçirdi!", mood: "angry" },
  { text: "Biliyordum..Lanet olsun, peşimde olduklarını biliyordum!", mood: "angry" },
  { text: "Neyse...", mood: "neutral" },
  { text: "Projelerim, yazılarım, matematiksel çalışmalarım... hepsi orada kaldı.", mood: "sad" },
  { text: "Onları benim için geri getirebilir misin?", mood: "happy" },
];

const greetLines: Line[] = [
  { text: "Memnun oldum, {isim}!", mood: "happy" },
  { text: "Odam koridorun sonunda ama kapısı kilitli.", mood: "neutral" },
  { text: "İçeri girmek için bir labirentten geçmen gerekecek.", mood: "surprised" },
  { text: "Ama önce biraz etrafı karıştırabilirsin.", mood: "happy" },
  { text: "Sonsuzluğa Giden Doğaüstü Kazan'a benim için bir mektup bırakmayı unutma!", mood: "happy" },
];

export default function Home() {
  const [scene, setScene] = useState<Scene>("intro");
  const [name, setName] = useState("");
  const [draft, setDraft] = useState("");
  const [letterSent, setLetterSent] = useState(false);

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
      <div className="vn-stage">
        <Character mood="happy" />
        <DialogueBox mood="happy">
          Önce adını söyler misin?
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
        </DialogueBox>
      </div>
    );
  }

  if (scene === "greet") {
    return <DialogueScene lines={greetLines} name={name} onDone={() => setScene("hall")} />;
  }

  if (scene === "hall") {
    return (
      <Hall
        name={name}
        letterSent={letterSent}
        onLetterSent={() => setLetterSent(true)}
        onDoor={() => setScene("mazePlaceholder")}
      />
    );
  }  
  
  return (
    <div className="vn-stage">
      <Character mood="surprised" />
      <DialogueBox mood="surprised">Her kim bir canavarla çarpışmayı göze alırsa, bir canavar olmayı da göze almalıdır {name}! Boğulursan büyük suda boğul. </DialogueBox>
    </div>
  );
}