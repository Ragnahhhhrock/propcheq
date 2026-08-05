import { scoreTone } from "@/lib/propcheq-ui";

// Circular gauge for the 0-100 property score
export default function ScoreGauge({ score, size = 132 }: { score: number | null; size?: number }) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = score == null ? 0 : Math.max(0, Math.min(100, score)) / 100;
  const color =
    score == null
      ? "#d4d4d8"
      : score >= 80
        ? "#10b981"
        : score >= 50
          ? "#f59e0b"
          : "#ef4444";
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#e4e4e7" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-bold leading-none ${scoreTone(score)}`} style={{ fontSize: size * 0.28 }}>
          {score ?? "–"}
        </span>
        <span className="mt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          / 100
        </span>
      </div>
    </div>
  );
}
