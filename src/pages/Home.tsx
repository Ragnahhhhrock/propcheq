import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Building2,
  Plus,
  KeyRound,
  Copy,
  Check,
  ChevronRight,
  FilePlus2,
  BellRing,
  Users,
  CalendarClock,
  DollarSign,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { LOGIN_PATH } from "@/const";
import TopBar from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
import { toast } from "sonner";
import { REPORT_TYPES } from "@contracts/inspecta";
import { TYPE_STYLES, TYPE_LABELS, scoreBadge } from "@/lib/inspecta-ui";

type DashReport = {
  id: number;
  title: string;
  type: string;
  status: string;
  inspectionDate: string;
  score: number | null;
  pendingActions: number;
  answeredActions: number;
};

type DashProperty = {
  id: number;
  address: string;
  suburb: string;
  state: string;
  postcode: string;
  tenantName: string | null;
  leaseExpiry: string | null;
  weeklyRent: string | null;
  ownerCode?: string;
  viewerRole: "inspector" | "owner";
  reports: DashReport[];
};

function ReportRow({ r }: { r: DashReport }) {
  return (
    <Link
      to={`/reports/${r.id}`}
      className="flex items-center gap-3 rounded-lg border bg-white px-3 py-2.5 transition-colors hover:border-emerald-300 hover:bg-emerald-50/40"
    >
      <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${TYPE_STYLES[r.type]}`}>
        {TYPE_LABELS[r.type]}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{r.title}</div>
        <div className="text-xs text-muted-foreground">
          {r.inspectionDate}
          {r.status === "draft" && <span className="ml-2 font-medium text-amber-600">Draft</span>}
        </div>
      </div>
      {r.pendingActions > 0 && (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
          <BellRing className="h-3 w-3" />
          {r.pendingActions}
        </span>
      )}
      {r.score != null && (
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${scoreBadge(r.score)}`}>
          {r.score}
        </span>
      )}
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

function CopyCode({ code }: { code: string }) {
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
      className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-emerald-400 bg-emerald-50 px-2 py-1 text-xs font-semibold tracking-widest text-emerald-800"
      title="Copy owner invite code"
    >
      <KeyRound className="h-3.5 w-3.5" />
      {code}
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function NewReportDialog({ propertyId, tenantName }: { propertyId: number; tenantName: string | null }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string>("routine");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const create = trpc.inspecta.createReport.useMutation({
    onSuccess: async ({ id }) => {
      await utils.inspecta.invalidate();
      navigate(`/reports/${id}/edit`);
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
          <FilePlus2 className="mr-1.5 h-4 w-4" />
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
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Inspection date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <p className="text-xs text-muted-foreground">
            A full checklist template ({tenantName ? "with current tenants" : "all rooms"}) will be
            pre-filled so you can inspect by tapping.
          </p>
          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            disabled={create.isPending}
            onClick={() =>
              create.mutate({
                propertyId,
                type: type as "routine" | "entry" | "exit",
                inspectionDate: new Date(date + "T00:00:00").toLocaleDateString("en-AU", {
                  weekday: "long",
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                }),
                tenantName: tenantName ?? undefined,
              })
            }
          >
            {create.isPending ? "Creating…" : "Create & start inspecting"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddPropertyDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ address: "", suburb: "", state: "WA", postcode: "", tenantName: "", weeklyRent: "", leaseExpiry: "" });
  const utils = trpc.useUtils();
  const create = trpc.inspecta.createProperty.useMutation({
    onSuccess: async () => {
      await utils.inspecta.invalidate();
      setOpen(false);
      toast.success("Property added — share the owner code with the owner");
    },
    onError: (e) => toast.error(e.message),
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="mr-1 h-4 w-4" /> Add property
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add a property</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Street address</Label>
            <Input placeholder="2/10 Hillcrest Road" value={form.address} onChange={set("address")} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1 space-y-1">
              <Label>Suburb</Label>
              <Input placeholder="Kewdale" value={form.suburb} onChange={set("suburb")} />
            </div>
            <div className="space-y-1">
              <Label>State</Label>
              <Input value={form.state} onChange={set("state")} />
            </div>
            <div className="space-y-1">
              <Label>Postcode</Label>
              <Input placeholder="6105" value={form.postcode} onChange={set("postcode")} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Tenants (optional)</Label>
            <Input placeholder="Names, separated by ;" value={form.tenantName} onChange={set("tenantName")} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label>Weekly rent</Label>
              <Input placeholder="$810 per week" value={form.weeklyRent} onChange={set("weeklyRent")} />
            </div>
            <div className="space-y-1">
              <Label>Lease expiry</Label>
              <Input placeholder="13/03/2027" value={form.leaseExpiry} onChange={set("leaseExpiry")} />
            </div>
          </div>
          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            disabled={create.isPending || form.address.length < 3 || form.suburb.length < 2}
            onClick={() =>
              create.mutate({
                address: form.address,
                suburb: form.suburb,
                state: form.state,
                postcode: form.postcode || "0000",
                tenantName: form.tenantName || undefined,
                weeklyRent: form.weeklyRent || undefined,
                leaseExpiry: form.leaseExpiry || undefined,
              })
            }
          >
            {create.isPending ? "Adding…" : "Add property"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PropertyCard({ p, isInspector }: { p: DashProperty; isInspector: boolean }) {
  const reports = isInspector ? p.reports : p.reports.filter((r) => r.status === "published");
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-emerald-600" />
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
          {isInspector && p.ownerCode && <CopyCode code={p.ownerCode} />}
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
            <NewReportDialog propertyId={p.id} tenantName={p.tenantName} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OwnerClaim() {
  const [code, setCode] = useState("");
  const utils = trpc.useUtils();
  const claim = trpc.inspecta.claimOwnerAccess.useMutation({
    onSuccess: async ({ address }) => {
      await utils.inspecta.invalidate();
      toast.success(`Linked to ${address}`);
      setCode("");
    },
    onError: (e) => toast.error(e.message),
  });
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
            className="bg-emerald-600 hover:bg-emerald-700"
            disabled={code.length < 4 || claim.isPending}
            onClick={() => claim.mutate({ code })}
          >
            Link
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Your property manager can give you the 6–8 character code for your property.
        </p>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const { isLoading: authLoading } = useAuth({
    redirectOnUnauthenticated: true,
    redirectPath: LOGIN_PATH,
  });
  const { data, isLoading } = trpc.inspecta.myDashboard.useQuery(undefined, {
    enabled: !authLoading,
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-muted/40">
        <TopBar />
        <div className="mx-auto max-w-3xl space-y-4 p-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  const inspectorProps = (data?.inspectorProperties ?? []) as DashProperty[];
  const ownerProps = (data?.ownerProperties ?? []) as DashProperty[];

  return (
    <div className="min-h-screen bg-muted/40 pb-16">
      <TopBar />
      <main className="mx-auto max-w-3xl space-y-8 p-4">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">My inspections</h2>
            <AddPropertyDialog />
          </div>
          {inspectorProps.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No properties yet — add your first property to start inspecting.
              </CardContent>
            </Card>
          )}
          {inspectorProps.map((p) => (
            <PropertyCard key={p.id} p={p} isInspector />
          ))}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Properties I own</h2>
          {ownerProps.map((p) => (
            <PropertyCard key={p.id} p={p} isInspector={false} />
          ))}
          <OwnerClaim />
        </section>
      </main>
    </div>
  );
}
