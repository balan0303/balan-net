"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DialogueScene, { type Line } from "./components/DialogueScene";
import DialogueBox from "./components/DialogueBox";
import Character from "./components/Character";
import Hall from "./components/Hall";
import Maze from "./components/Maze";
import FallText from "./components/FallText";
import MonsterMouth from "./components/MonsterMouth";
import { setTrack } from "./components/AudioManager";

type Scene = "intro" | "askName" | "greet" | "hall" | "maze" | "fall" | "monster";

const introLines: Line[] = [
  { text: "Ah, biri gelmiş!", mood: "surprised" },
  { text: "Merhaba, ben Bengi.", mood: "happy" },
  { text: "Çok uzun süredir buradayım ama artık gitmem gerekiyor.", mood: "sad" },
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

const fallLines = [
  "Canavarın ağzına doğru yuvarlandın...",
  "Her yer karanlık ve ıslak. Uzaktan bir şeyler parlıyor.",
];

export default function Home() {
  const router = useRouter();
  const [scene, setScene] = useState<Scene>("intro");
  const [name, setName] = useState("");
  const [draft, setDraft] = useState("");
  const [letterSent, setLetterSent] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (scene === "hall") setTrack("hall");
    else if (scene === "maze") setTrack("maze");
    else if (scene === "fall" || scene === "monster") setTrack("monster");
    else setTrack("intro");
  }, [scene]);

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
        onDoor={() => setScene("maze")}
      />
    );
  }

  if (scene === "maze") {
    return (
      <Maze
        key={attempt}
        onWin={() => {
          sessionStorage.setItem("ziyaretci", name);
          router.push("/projeler");
        }}
        onLose={() => setScene("fall")}
      />
    );
  }

  if (scene === "fall") {
    return <FallText lines={fallLines} onDone={() => setScene("monster")} />;
  }

  return (
    <MonsterMouth
      onRetry={() => {
        setAttempt((a) => a + 1);
        setScene("maze");
      }}
      onBack={() => setScene("hall")}
    />
  );
}