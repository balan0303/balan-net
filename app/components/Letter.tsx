"use client";
import { useEffect, useState } from "react";

type Props = {
  defaultFrom: string;
  onClose: () => void;
  onSent: () => void;
};

export default function Letter({ defaultFrom, onClose, onSent }: Props) {
  const [from, setFrom] = useState(defaultFrom);
  const [title, setTitle] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [tried, setTried] = useState(false);
  const [sending, setSending] = useState(false);
    const [error, setError] = useState("");

  const missing = !from.trim() || !title.trim() || !contact.trim() || !message.trim();

  useEffect(() => {
    function key(e: KeyboardEvent) {
      if (e.key === "Escape" && !sending) onClose();
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [sending, onClose]);

    async function send() {
    setTried(true);
    setError("");
    if (missing || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/mektup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, title, contact, message }),
      });
      if (!res.ok) throw new Error();
      setTimeout(onSent, 2200); // düşme animasyonu bitince kapanır
    } catch {
      setSending(false);
      setError("Mektup gönderilemedi, biraz sonra tekrar dene.");
    }
  }

  const bad = (v: string) => (tried && !v.trim() ? "bad" : "");

  return (
    <div className="modal-back">
      {sending && <div className="well-hole" />}
      <div className={`letter ${sending ? "letter-drop" : ""}`}>
        <label>
          <span className="lbl">kimden:</span>
          <input className={bad(from)} value={from} maxLength={40} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label>
          <span className="lbl">kime:</span>
          <span>b.alan</span>
        </label>
        <label>
          <span className="lbl">başlık:</span>
          <input className={bad(title)} value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label>
          <span className="lbl">b.alan iade-i ziyaret için sana nasıl ulaşabilir? </span>
          <input
            className={bad(contact)}
            placeholder="e-posta, instagram..."
            value={contact}
            maxLength={80}
            onChange={(e) => setContact(e.target.value)}
          />
        </label>
        <textarea
          className={bad(message)}
          placeholder="sevgili bengi, ..."
          value={message}
          maxLength={1000}
          onChange={(e) => setMessage(e.target.value)}
        />
        {tried && missing && <div className="letter-err">Boş alan kalmasın!</div>}
                {error && <div className="letter-err">{error}</div>}
        <div className="letter-btns">
          <button className="pixel-btn" onClick={onClose} disabled={sending}>Vazgeç</button>
          <button className="pixel-btn" onClick={send} disabled={sending}>Mektubu At ✦</button>
        </div>
      </div>
    </div>
  );
}