import { Plus } from "lucide-react";

interface Props {
  snippets: string[];
  onPick: (text: string) => void;
}

// One-tap insertion of oft-used phrases into a description field
export default function SnippetChips({ snippets, onPick }: Props) {
  return (
    <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {snippets.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onPick(s)}
          className="inline-flex shrink-0 items-center gap-1 rounded-full border bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 transition-colors hover:bg-emerald-100 active:bg-emerald-200"
        >
          <Plus className="h-3 w-3" />
          {s.length > 42 ? s.slice(0, 42) + "…" : s}
        </button>
      ))}
    </div>
  );
}
