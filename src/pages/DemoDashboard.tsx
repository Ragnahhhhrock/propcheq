import { useState } from "react";
import { Link } from "react-router";
import {
  BellRing,
  Building2,
  CalendarClock,
  Check,
  ChevronRight,
  Copy,
  DollarSign,
  FilePlusCorner,
  KeyRound,
  Plus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import TopBar from "@/components/TopBar";
import DemoBanner from "@/components/DemoBanner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TYPE_STYLES, TYPE_LABELS, scoreBadge } from "@/lib/propcheq-ui";
import {
  demoInspectorProperties,
  demoOwnerProperties,
  type DemoProperty,
  type DemoReportSummary,
} from "@/demo/demoData";

const DEMO_TOAST = () =>
  toast.info("Demo mode — sign up free to create your own inspections.");

/* ------------------------------- report row ------------------------------ */

function ReportRow({ r }: { r: DemoReportSummary }) {
  return (
    <Link
      to="/demo/report"
      className="flex items-center gap-3 rounded-lg border bg-white px-3 py-2.5 transition-colors hover:border-teal-300 hover:bg-teal-50/40"
    >
      <span
        className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${TYPE_STYLES[r.type]}`}
      >
        {TYPE_LABELS[r.type]}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{r.title}</div>
        <div className="text-xs text-muted-foreground">
          {r.inspectionDate}
          {r.status === "draft" && (
            <span className="ml-2 font-medium text-amber-600">Draft</span>
          )}
        </div>
      </div>
      {r.pendingActions > 0 && (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
          <BellRing className="h-3 w-3" />
          {r.pendingActions}
        </span>
      )}
      {r.score != null && (
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${scoreBadge(r.score)}`}
        >
          {r.score}
        </span>
      )}
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

/* ----------------------------- owner code chip ---------------------------- */

function OwnerCodeBadge({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
        toast.success("Owner code copied");
      }}
      className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-teal-400 bg-teal-50 px-2 py-1 text-xs font-semibold tracking-widest text-teal-800"
      title="Copy owner invite code"
    >
      <KeyRound className="h-3.5 w-3.5" />
      {code}
      {copied ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

/* ------------------------------ property card ----------------------------- */

function PropertyCard({
  p,
  isInspector,
}: {
  p: DemoProperty;
  isInspector: boolean;
}) {
  const reports = isInspector
    ? p.reports
    : p.reports.filter((r) => r.status === "published");
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-brand-teal" />
              {p.address}, {p.suburb} {p.state} {p.postcode}
            </CardTitle>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {p.tenantName && (
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3 w-3" /> {p.tenantName}
                </span>
              )}
              {p.weeklyRent && (
                <span className="inline-flex items-center gap-1">
                  <DollarSign className="h-3 w-3" /> {p.weeklyRent}
                </span>
              )}
              {p.leaseExpiry && (
                <span className="inline-flex items-center gap-1">
                  <CalendarClock className="h-3 w-3" /> Lease: {p.leaseExpiry}
                </span>
              )}
            </div>
          </div>
          {isInspector && p.ownerCode && <OwnerCodeBadge code={p.ownerCode} />}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {reports.length === 0 && (
          <p className="py-2 text-sm text-muted-foreground">No reports yet.</p>
        )}
        {reports.map((r) => (
          <ReportRow key={r.id} r={r} />
        ))}
        {isInspector && (
          <div className="pt-1">
            <Button
              size="sm"
              className="bg-brand-blue hover:bg-blue-600"
              onClick={DEMO_TOAST}
            >
              <FilePlusCorner className="mr-1.5 h-4 w-4" />
              New report
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------ owner link card --------------------------- */

function OwnerLinkCard() {
  const [code, setCode] = useState("");
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Link your property</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Input
            placeholder="Owner code e.g. HILL10"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="tracking-widest"
          />
          <Button
            className="bg-brand-blue hover:bg-blue-600"
            disabled={code.length < 4}
            onClick={DEMO_TOAST}
          >
            Link
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Your property manager can give you the 6–8 character code for your
          property.
        </p>
      </CardContent>
    </Card>
  );
}

/* --------------------------------- page ---------------------------------- */

export default function DemoDashboard() {
  return (
    <div className="min-h-screen bg-muted/40 pb-16">
      <TopBar />
      <DemoBanner />
      <main className="mx-auto max-w-3xl space-y-8 p-4">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">My inspections</h2>
            <Button variant="outline" size="sm" onClick={DEMO_TOAST}>
              <Plus className="mr-1 h-4 w-4" /> Add property
            </Button>
          </div>
          {demoInspectorProperties.map((p) => (
            <PropertyCard key={p.id} p={p} isInspector={true} />
          ))}
        </section>
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Properties I own</h2>
          {demoOwnerProperties.map((p) => (
            <PropertyCard key={p.id} p={p} isInspector={false} />
          ))}
          <OwnerLinkCard />
        </section>
      </main>
    </div>
  );
}
