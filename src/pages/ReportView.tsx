import { useState } from "react";
import { Link, useParams } from "react-router";
import {
  CalendarDays,
  User,
  Users,
  Pencil,
  Check,
  X,
  HelpCircle,
  ImageOff,
  Sparkles,
  Wrench,
  Lightbulb,
  ClipboardList,
  BellRing,
  MapPin,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { LOGIN_PATH } from "@/const";
import TopBar from "@/components/TopBar";
import ScoreGauge from "@/components/ScoreGauge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import { RATING_LABELS } from "@contracts/inspecta";
import {
  TYPE_STYLES,
  TYPE_LABELS,
  scoreBar,
  formatDate,
} from "@/lib/inspecta-ui";

type Tri = boolean | null;

interface ItemRow {
  id: number;
  name: string;
  clean: Tri;
  undamaged: Tri;
  working: Tri;
  rating: number | null;
  comment: string | null;
}
interface AreaRow {
  id: number;
  name: string;
  items: ItemRow[];
}
interface MediaRow {
  id: number;
  areaId: number | null;
  kind: "image" | "video";
  url: string;
  caption: string | null;
}
interface ActionRow {
  id: number;
  text: string;
  status: "pending" | "approved" | "more_info" | "declined";
  response: string | null;
  respondedAt: Date | null;
}

function TriIcon({ v }: { v: Tri }) {
  if (v === true) return <Check className="h-4 w-4 text-emerald-600" />;
  if (v === false) return <X className="h-4 w-4 text-red-500" />;
  return <span className="inline-block h-4 w-4 text-center text-muted-foreground/40">–</span>;
}

function MetricBar({ label, value }: { label: string; value: number | null }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="font-semibold">
          {value ? `${value}/10` : "–"}
          {value ? <span className="ml-1 text-xs font-normal text-muted-foreground">{RATING_LABELS[value]}</span> : null}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${scoreBar(value ? value * 10 : null)} transition-all`}
          style={{ width: `${(value ?? 0) * 10}%` }}
        />
      </div>
    </div>
  );
}

const ACTION_STATUS: Record<ActionRow["status"], { label: string; cls: string }> = {
  pending: { label: "Awaiting your response", cls: "bg-amber-100 text-amber-800" },
  approved: { label: "Approved", cls: "bg-emerald-100 text-emerald-800" },
  more_info: { label: "More info requested", cls: "bg-sky-100 text-sky-800" },
  declined: { label: "Declined", cls: "bg-red-100 text-red-800" },
};

function ActionPanel({
  actions,
  canRespond,
}: {
  actions: ActionRow[];
  canRespond: boolean;
}) {
  const utils = trpc.useUtils();
  const [notes, setNotes] = useState<Record<number, string>>({});
  const respond = trpc.inspecta.respondActionRequest.useMutation({
    onSuccess: async () => {
      await utils.inspecta.invalidate();
      toast.success("Response sent to your inspector");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <BellRing className="h-4 w-4 text-amber-500" />
          Requests from your inspector
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((a) => (
          <div key={a.id} className="rounded-xl border bg-white p-3">
            <p className="text-sm">{a.text}</p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${ACTION_STATUS[a.status].cls}`}>
                {ACTION_STATUS[a.status].label}
              </span>
              {a.respondedAt && (
                <span className="text-[11px] text-muted-foreground">{formatDate(a.respondedAt)}</span>
              )}
            </div>
            {a.response && (
              <p className="mt-2 rounded-lg bg-muted/60 px-2.5 py-1.5 text-sm text-muted-foreground">
                “{a.response}”
              </p>
            )}
            {a.status === "pending" && canRespond && (
              <div className="mt-3 space-y-2">
                <Textarea
                  placeholder="Optional note to the inspector…"
                  rows={1}
                  className="min-h-[38px] resize-none text-sm"
                  value={notes[a.id] ?? ""}
                  onChange={(e) => setNotes({ ...notes, [a.id]: e.target.value })}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    disabled={respond.isPending}
                    onClick={() => respond.mutate({ id: a.id, status: "approved", response: notes[a.id] || "Approved" })}
                  >
                    <Check className="mr-1 h-4 w-4" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    disabled={respond.isPending}
                    onClick={() => respond.mutate({ id: a.id, status: "more_info", response: notes[a.id] || "More information required" })}
                  >
                    <HelpCircle className="mr-1 h-4 w-4" /> More info
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                    disabled={respond.isPending}
                    onClick={() => respond.mutate({ id: a.id, status: "declined", response: notes[a.id] || "Declined" })}
                  >
                    <X className="mr-1 h-4 w-4" /> Decline
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function ReportView() {
  const { id } = useParams<{ id: string }>();
  const { isLoading: authLoading } = useAuth({
    redirectOnUnauthenticated: true,
    redirectPath: LOGIN_PATH,
  });
  const { data, isLoading, error } = trpc.inspecta.getReport.useQuery(
    { id: Number(id) },
    { enabled: !authLoading && !!id },
  );

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-muted/40">
        <TopBar />
        <div className="mx-auto max-w-3xl space-y-4 p-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="min-h-screen bg-muted/40">
        <TopBar />
        <div className="mx-auto max-w-3xl p-4 pt-16 text-center">
          <p className="text-muted-foreground">{error?.message ?? "Report not found."}</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/">Back to dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { report, property, viewerRole, canRespond } = data;
  const areas = data.areas as AreaRow[];
  const mediaList = data.media as MediaRow[];
  const actions = data.actions as ActionRow[];
  const areaName = new Map(areas.map((a) => [a.id, a.name]));

  const allItems = areas.flatMap((a) => a.items);
  const issueCount = allItems.filter(
    (i) => i.clean === false || i.undamaged === false || i.working === false,
  ).length;
  const areaIssues = (a: AreaRow) =>
    a.items.filter((i) => i.clean === false || i.undamaged === false || i.working === false).length;


  return (
    <div className="min-h-screen bg-muted/40 pb-16">
      <TopBar />
      <main className="mx-auto max-w-3xl space-y-4 p-4">
        {/* header */}
        <div className="pt-2">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <Link to="/" className="hover:underline">
              {property.address}, {property.suburb} {property.state} {property.postcode}
            </Link>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${TYPE_STYLES[report.type]}`}>
              {TYPE_LABELS[report.type]}
            </span>
            <h1 className="text-xl font-bold tracking-tight">{report.title}</h1>
            {report.status === "draft" && (
              <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                Draft — only visible to you
              </span>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" /> {report.inspectionDate}
            </span>
            <span className="inline-flex items-center gap-1">
              <User className="h-3.5 w-3.5" /> {report.inspectorName}
            </span>
            {report.tenantName && (
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> {report.tenantName}
              </span>
            )}
          </div>
          {viewerRole === "inspector" && (
            <Button asChild size="sm" className="mt-3 bg-emerald-600 hover:bg-emerald-700">
              <Link to={`/reports/${report.id}/edit`}>
                <Pencil className="mr-1.5 h-4 w-4" /> Edit report
              </Link>
            </Button>
          )}
        </div>

        {/* ratings dashboard */}
        <Card>
          <CardContent className="flex flex-col items-center gap-5 py-5 sm:flex-row sm:gap-8">
            <ScoreGauge score={report.score} />
            <div className="w-full flex-1 space-y-4">
              <MetricBar label="Cleanliness" value={report.cleanliness} />
              <MetricBar label="Overall condition" value={report.condition} />
              <div className="flex gap-2 pt-1 text-xs">
                <span className="rounded-full bg-muted px-2.5 py-1 font-medium">
                  {allItems.length} items inspected
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 font-medium ${
                    issueCount === 0 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {issueCount === 0 ? "No issues flagged" : `${issueCount} item${issueCount > 1 ? "s" : ""} flagged`}
                </span>
              </div>
            </div>
          </CardContent>
          {/* per-area strip */}
          <div className="border-t px-4 py-3">
            <div className="flex flex-wrap gap-1.5">
              {areas.map((a) => {
                const n = areaIssues(a);
                return (
                  <span
                    key={a.id}
                    className={`rounded-full px-2 py-1 text-[11px] font-medium ${
                      n === 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                    }`}
                  >
                    {a.name}
                    {n > 0 ? ` · ${n}` : ""}
                  </span>
                );
              })}
            </div>
          </div>
        </Card>

        {/* action requests */}
        {actions.length > 0 && <ActionPanel actions={actions} canRespond={canRespond} />}

        {/* media feed */}
        {mediaList.length > 0 && (
          <div className="space-y-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Sparkles className="h-4 w-4 text-emerald-600" /> Photos & video
            </h2>
            <div className="space-y-4">
              {mediaList.map((m) => (
                <figure key={m.id} className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                  {m.kind === "image" ? (
                    <img src={m.url} alt={m.caption ?? ""} className="w-full object-cover" loading="lazy" />
                  ) : (
                    <video src={m.url} controls playsInline className="w-full" preload="metadata" />
                  )}
                  <figcaption className="px-4 py-3">
                    {m.areaId && areaName.get(m.areaId) && (
                      <span className="mb-1 inline-block rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                        {areaName.get(m.areaId)}
                      </span>
                    )}
                    {m.caption && <p className="text-sm">{m.caption}</p>}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        )}
        {mediaList.length === 0 && (
          <Card>
            <CardContent className="flex items-center gap-2 py-5 text-sm text-muted-foreground">
              <ImageOff className="h-4 w-4" /> No photos attached to this report.
            </CardContent>
          </Card>
        )}

        {/* summary */}
        {(report.summary || report.maintenanceRequired || report.suggestedImprovements) && (
          <div className="space-y-3">
            {report.summary && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ClipboardList className="h-4 w-4 text-emerald-600" /> Our summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-relaxed">{report.summary}</CardContent>
              </Card>
            )}
            {report.maintenanceRequired && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Wrench className="h-4 w-4 text-amber-500" /> Maintenance required
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-relaxed">{report.maintenanceRequired}</CardContent>
              </Card>
            )}
            {report.suggestedImprovements && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Lightbulb className="h-4 w-4 text-sky-500" /> Suggested improvements
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-relaxed">{report.suggestedImprovements}</CardContent>
              </Card>
            )}
          </div>
        )}

        {/* checklist */}
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <ClipboardList className="h-4 w-4 text-emerald-600" /> Inspection checklist
          </h2>
          <Card>
            <CardContent className="px-2 py-1">
              <Accordion type="multiple">
                {areas.map((a) => {
                  const n = areaIssues(a);
                  return (
                    <AccordionItem key={a.id} value={`area-${a.id}`}>
                      <AccordionTrigger className="px-2 text-sm font-semibold hover:no-underline">
                        <span className="flex items-center gap-2">
                          {a.name}
                          {n > 0 ? (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                              {n} flagged
                            </span>
                          ) : (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                              all good
                            </span>
                          )}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="px-2">
                        <ul className="divide-y">
                          {a.items.map((i) => (
                            <li key={i.id} className="py-2.5">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-medium">{i.name}</span>
                                <div className="flex items-center gap-2.5">
                                  {i.rating && (
                                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold">
                                      {i.rating}/10
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1.5" title="Clean / Undamaged / Working">
                                    <TriIcon v={i.clean} />
                                    <TriIcon v={i.undamaged} />
                                    <TriIcon v={i.working} />
                                  </span>
                                </div>
                              </div>
                              {i.comment && (
                                <p className="mt-1 text-sm text-muted-foreground">{i.comment}</p>
                              )}
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
          <p className="text-center text-[11px] text-muted-foreground">
            ✓ = clean · undamaged · working &nbsp;|&nbsp; ✗ = issue noted &nbsp;|&nbsp; – = not applicable
          </p>
        </div>
      </main>
    </div>
  );
}
