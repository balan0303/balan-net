import type { ReactNode } from "react";
import { MOOD_COLORS, USE_IMAGES, type Mood } from "./Character";

type Props = {
  speaker?: string;
  mood?: Mood;
  children: ReactNode;
  onClick?: () => void;
};

export default function DialogueBox({
  speaker = "Bengi",
  mood = "neutral",
  children,
  onClick,
}: Props) {
  return (
    <div
      className="vn-box"
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <div className="vn-name">{speaker}</div>
      <div className="vn-portrait" style={{ background: MOOD_COLORS[mood] }}>
        {USE_IMAGES ? (
          <img src={`/characters/bengi-mini-${mood}.png`} alt="" />
        ) : (
          mood
        )}
      </div>
      <div className="vn-text">{children}</div>
    </div>
  );
}