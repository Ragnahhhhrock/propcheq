import { FileText, Star, Images, Building2 } from "lucide-react";
import type { ComponentType } from "react";
import { trpc } from "@/providers/trpc";
import { useCountUp } from "@/hooks/useCountUp";

type Stat = {
  key: "reports" | "ratings" | "media" | "properties";
  label: string;
  Icon: ComponentType<{ className?: string }>;
};

// Hide the whole strip until enough reports exist for it to read as social proof.
const MIN_REPORTS = 20;

const STATS: Stat[] = [
  { key: "reports", label: "Reports generated", Icon: FileText },
  { key: "ratings", label: "Ratings given", Icon: Star },
  { key: "media", label: "Photos & videos captured", Icon: Images },
  { key: "properties", label: "Properties inspected", Icon: Building2 },
];

function StatItem({ stat, value }: { stat: Stat; value: number | undefined }) {
  const animated = useCountUp(value);
  const { Icon, label } = stat;
  return (
    <div className="flex flex-col items-center text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-gradient text-white shadow-soft">
        <Icon className="h-5 w-5" />
      </span>
      <div
        className="mt-3 text-4xl font-extrabold tabular-nums tracking-tight text-[#0F172A] sm:text-5xl"
        aria-label={value === undefined ? undefined : `${value.toLocaleString()} ${label}`}
      >
        {value === undefined ? (
          <span className="inline-block h-10 w-20 animate-pulse rounded bg-slate-200 align-middle" />
        ) : (
          <>
            {animated.toLocaleString()}
            {value >= 100 && animated >= value ? "+" : ""}
          </>
        )}
      </div>
      <div className="mt-1 text-sm font-medium text-[#64748B]">{label}</div>
    </div>
  );
}

export default function StatsCounter() {
  // Fetched on page load; counters animate as soon as the numbers arrive.
  const { data } = trpc.propcheq.publicStats.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  if (!data || data.reports < MIN_REPORTS) return null;

  return (
    <section aria-label="Propcheq in numbers" className="border-y border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-10 lg:grid-cols-4">
        {STATS.map((stat) => (
          <StatItem key={stat.key} stat={stat} value={data[stat.key]} />
        ))}
      </div>
    </section>
  );
}
