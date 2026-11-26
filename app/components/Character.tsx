export type Mood = "neutral" | "happy" | "sad" | "angry" | "surprised";

// Çizimlerini public/characters/ içine koyunca true yap
export const USE_IMAGES = false;

export const MOOD_COLORS: Record<Mood, string> = {
  neutral: "#f4a261",
  happy: "#ffd166",
  sad: "#6c8ebf",
  angry: "#e5586a",
  surprised: "#b48ead",
};

type Props = {
  mood?: Mood;
  side?: "left" | "center" | "right";
};

export default function Character({ mood = "neutral", side = "center" }: Props) {
  return (
    // key değişince eleman yeniden oluşur ve zıplama animasyonu tekrar oynar
    <div className={`vn-character vn-${side}`} key={mood}>
      {USE_IMAGES ? (
        <img src={`/characters/bengi-${mood}.png`} alt="" />
      ) : (
        <div className="vn-placeholder" style={{ background: MOOD_COLORS[mood] }}>
          {mood}
        </div>
      )}
    </div>
  );
}