import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  onClick?: () => void;
};

export default function Bubble({ children, onClick }: Props) {
  return (
    <div
      className="bubble-wrap"
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <div className="bubble">
        <div className="bubble-inner">{children}</div>
      </div>
    </div>
  );
}