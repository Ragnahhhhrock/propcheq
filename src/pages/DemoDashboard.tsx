import { useState } from "react";
import { Link, useNavigate } from "react-router";
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
  Pencil,
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
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { REPORT_TYPES, type ReportType } from "@contracts/propcheq";
import { TYPE_STYLES, TYPE_LABELS, scoreBadge } from "@/lib/propcheq-ui";
import {
  demoInspectorProperties,
  demoOwnerProperties,
  type DemoProperty,
  type DemoReportSummary,
} from "@/demo/demoData";
import { getDemoSession, startDemoSession } from "@/demo/demoStore";

const DEMO_TOAST = () =>
  toast.info("Demo mode — sign up free to create your own properties.");

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

/* ---------------------------- new report dialog --------------------------- */

function NewReportDialog({ tenantName }: { tenantName: string | null }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ReportType>("routine");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-brand-blue hover:bg-blue-600">
          <FilePlusCorner className="mr-1.5 h-4 w-4" />
          New report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Start a new inspection report</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Report type</Label>
            <Select value={type} onValueChange={(v) => setType(v as ReportType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Inspection date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            A full checklist template (
            {tenantName ? "with current tenants" : "all rooms"}) will be
            pre-filled so you can inspect by tapping.
          </p>
          <Button
            className="w-full bg-brand-blue hover:bg-blue-600"
            onClick={() => {
              startDemoSession(
                type,
                new Date(date + "T00:00:00").toLocaleDateString("en-AU", {
                  weekday: "long",
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                }),
                tenantName ?? "",
              );
              toast.success("Demo inspection started — your changes stay in this browser tab");
              navigate("/demo/inspect");
            }}
          >
            Create & start inspecting
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* --------------------------- active session row --------------------------- */

function DemoSessionRow() {
  const session = getDemoSession();
  if (!session) return null;
  return (
    <div className="flex items-center gap-3 rounded-lg border-2 border-dashed border-teal-300 bg-teal-50/60 px-3 py-2.5">
      <span className="rounded-md bg-teal-600 px-2 py-0.5 text-[11px] font-semibold text-white">
        Yours
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{session.title}</div>
        <div className="text-xs text-muted-foreground">
          {session.inspectionDate}
          {session.status === "draft" && (
            <span className="ml-2 font-medium text-amber-600">Draft</span>
          )}
        </div>
      </div>
      <Button asChild size="sm" variant="outline" className="shrink-0">
        <Link to="/demo/inspect">
          <Pencil className="mr-1 h-3.5 w-3.5" /> Continue
        </Link>
      </Button>
      <Button asChild size="sm" className="shrink-0 bg-brand-blue hover:bg-blue-600">
        <Link to="/demo/report">View</Link>
      </Button>
    </div>
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
            <NewReportDialog tenantName={p.tenantName} />
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
          <DemoSessionRow />
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
