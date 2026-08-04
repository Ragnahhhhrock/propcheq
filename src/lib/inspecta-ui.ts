// UI helpers shared across Inspecta pages

export function scoreTone(score: number | null | undefined): string {
  if (score == null) return "text-muted-foreground";
  if (score >= 85) return "text-emerald-600";
  if (score >= 70) return "text-lime-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-600";
}

export function scoreBar(score: number | null | undefined): string {
  if (score == null) return "bg-muted";
  if (score >= 85) return "bg-emerald-500";
  if (score >= 70) return "bg-lime-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-red-500";
}

export function scoreBadge(score: number | null | undefined): string {
  if (score == null) return "bg-muted text-muted-foreground";
  if (score >= 85) return "bg-emerald-100 text-emerald-800";
  if (score >= 70) return "bg-lime-100 text-lime-800";
  if (score >= 50) return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-800";
}

export const TYPE_STYLES: Record<string, string> = {
  routine: "bg-sky-100 text-sky-800",
  entry: "bg-violet-100 text-violet-800",
  exit: "bg-orange-100 text-orange-800",
};

export const TYPE_LABELS: Record<string, string> = {
  routine: "Routine",
  entry: "Entry",
  exit: "Exit",
};

export function formatDate(iso: string | Date | null | undefined): string {
  if (!iso) return "";
  const d = iso instanceof Date ? iso : new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}
