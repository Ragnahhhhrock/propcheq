import { Check, X, Minus } from "lucide-react";

type Tri = boolean | null;

interface Props {
  clean: Tri;
  undamaged: Tri;
  working: Tri;
  onChange: (patch: { clean?: Tri; undamaged?: Tri; working?: Tri }) => void;
  disabled?: boolean;
}

function cycle(v: Tri): Tri {
  return v === true ? false : v === false ? null : true;
}

function TriButton({
  label,
  value,
  onClick,
  disabled,
}: {
  label: string;
  value: Tri;
  onClick: () => void;
  disabled?: boolean;
}) {
  const cls =
    value === true
      ? "border-emerald-500 bg-emerald-500 text-white"
      : value === false
        ? "border-red-500 bg-red-500 text-white"
        : "border-muted-foreground/30 bg-white text-muted-foreground";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors active:scale-95 ${cls}`}
      title={`${label}: ${value === true ? "yes" : value === false ? "issue" : "n/a"} — tap to cycle`}
    >
      {value === true ? <Check className="h-4 w-4" /> : value === false ? <X className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
      <span className="sr-only">{label}</span>
    </button>
  );
}

// Quick C / U / W (clean, undamaged, working) tri-state toggles
export default function TriToggle({ clean, undamaged, working, onChange, disabled }: Props) {
  return (
    <div className="flex items-center gap-1.5">
      <TriButton label="Clean" value={clean} disabled={disabled} onClick={() => onChange({ clean: cycle(clean) })} />
      <TriButton label="Undamaged" value={undamaged} disabled={disabled} onClick={() => onChange({ undamaged: cycle(undamaged) })} />
      <TriButton label="Working" value={working} disabled={disabled} onClick={() => onChange({ working: cycle(working) })} />
    </div>
  );
}
