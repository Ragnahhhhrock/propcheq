import { Slider } from "@/components/ui/slider";
import { RATING_LABELS } from "@contracts/inspecta";

interface Props {
  label: string;
  value: number | null;
  onChange: (v: number) => void;
  disabled?: boolean;
}

// Big, thumb-friendly 1-10 rating slider with verbal label
export default function RatingSlider({ label, value, onChange, disabled }: Props) {
  const v = value ?? 5;
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-semibold text-emerald-700">
          {value ? `${value}/10 — ${RATING_LABELS[value]}` : "Not rated"}
        </span>
      </div>
      <Slider
        min={1}
        max={10}
        step={1}
        value={[v]}
        onValueChange={([nv]) => onChange(nv)}
        disabled={disabled}
        className="py-3"
      />
      <div className="flex justify-between text-[10px] font-medium uppercase text-muted-foreground">
        <span>1 Poor</span>
        <span>10 Excellent</span>
      </div>
    </div>
  );
}
