import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  Camera,
  ImagePlus,
  Trash2,
  Plus,
  Send,
  Eye,
  Globe,
  Undo2,
  Loader2,
  Film,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { LOGIN_PATH } from "@/const";
import TopBar from "@/components/TopBar";
import RatingSlider from "@/components/RatingSlider";
import SnippetChips from "@/components/SnippetChips";
import TriToggle from "@/components/TriToggle";
import ScoreGauge from "@/components/ScoreGauge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  ITEM_SNIPPETS,
  SUMMARY_SNIPPETS,
  MAINTENANCE_SNIPPETS,
  computeScore,
} from "@contracts/propcheq";
import { TYPE_STYLES, TYPE_LABELS } from "@/lib/propcheq-ui";

type Tri = boolean | null;

interface EditItem {
  id?: number;
  name: string;
  clean: Tri;
  undamaged: Tri;
  working: Tri;
  rating: number | null;
  comment: string | null;
  sortOrder: number;
}
interface EditArea {
  id?: number;
  name: string;
  sortOrder: number;
  items: EditItem[];
}

// ---------------------------------------------------------------- checklist
function ChecklistEditor({ reportId, initial }: { reportId: number; initial: EditArea[] }) {
  const [areas, setAreas] = useState<EditArea[]>(initial);
  const [dirty, setDirty] = useState(false);
  const utils = trpc.useUtils();
  const save = trpc.propcheq.updateChecklist.useMutation({
    onSuccess: async () => {
      await utils.propcheq.getReport.invalidate({ id: reportId });
      setDirty(false);
      toast.success("Checklist saved");
    },
    onError: (e) => toast.error(e.message),
  });

  const mutate = (fn: (draft: EditArea[]) => void) => {
    setAreas((prev) => {
      const next = prev.map((a) => ({ ...a, items: a.items.map((i) => ({ ...i })) }));
      fn(next);
      return next;
    });
    setDirty(true);
  };

  const patchItem = (ai: number, ii: number, patch: Partial<EditItem>) =>
    mutate((d) => Object.assign(d[ai].items[ii], patch));

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Checklist</CardTitle>
          <Button
            size="sm"
            disabled={!dirty || save.isPending}
            onClick={() =>
              save.mutate({
                reportId,
                areas: areas.map((a, ai) => ({
                  id: a.id,
                  name: a.name,
                  sortOrder: ai,
                  items: a.items.map((i, ii) => ({ ...i, sortOrder: ii })),
                })),
              })
            }
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {save.isPending ? "Saving…" : dirty ? "Save checklist" : "Saved"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Tap the circles to cycle ✓ / ✗ / – for Clean, Undamaged, Working.
        </p>
      </CardHeader>
      <CardContent className="px-2">
        <Accordion type="multiple" defaultValue={["area-0"]}>
          {areas.map((a, ai) => (
            <AccordionItem key={a.id ?? `new-${ai}`} value={`area-${ai}`}>
              <AccordionTrigger className="px-2 text-sm font-semibold hover:no-underline">
                {a.name}
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {a.items.length} items
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-2">
                <ul className="space-y-3">
                  {a.items.map((i, ii) => (
                    <li key={i.id ?? `new-${ii}`} className="rounded-xl border bg-white p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{i.name}</span>
                        <div className="flex items-center gap-2">
                          <TriToggle
                            clean={i.clean}
                            undamaged={i.undamaged}
                            working={i.working}
                            onChange={(p) => patchItem(ai, ii, p)}
                          />
                          <button
                            type="button"
                            className="text-muted-foreground/50 transition-colors hover:text-red-500"
                            onClick={() => mutate((d) => d[ai].items.splice(ii, 1))}
                            title="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <Textarea
                        rows={1}
                        className="mt-2 min-h-[36px] resize-none text-sm"
                        placeholder="Add a comment…"
                        value={i.comment ?? ""}
                        onChange={(e) => patchItem(ai, ii, { comment: e.target.value || null })}
                      />
                      {(i.clean === false || i.undamaged === false || i.working === false || i.comment) && (
                        <SnippetChips
                          snippets={ITEM_SNIPPETS}
                          onPick={(t) =>
                            patchItem(ai, ii, {
                              comment: i.comment ? `${i.comment} ${t}` : t,
                            })
                          }
                        />
                      )}
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      mutate((d) =>
                        d[ai].items.push({
                          name: "New item",
                          clean: true,
                          undamaged: true,
                          working: true,
                          rating: null,
                          comment: null,
                          sortOrder: d[ai].items.length,
                        }),
                      )
                    }
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" /> Item
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-red-600">
                        <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove area
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove {a.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This removes the area and its {a.items.length} checklist items. Photos tagged to
                          this area are kept but untagged.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => mutate((d) => d.splice(ai, 1))}>
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <Button
          variant="outline"
          size="sm"
          className="m-2"
          onClick={() =>
            mutate((d) =>
              d.push({
                name: `Area ${d.length + 1}`,
                sortOrder: d.length,
                items: [
                  { name: "General", clean: true, undamaged: true, working: true, rating: null, comment: null, sortOrder: 0 },
                ],
              }),
            )
          }
        >
          <Plus className="mr-1 h-3.5 w-3.5" /> Add area
        </Button>
      </CardContent>
    </Card>
  );
}

// ------------------------------------------------------------------- media
interface MediaRow {
  id: number;
  areaId: number | null;
  kind: "image" | "video";
  url: string;
  caption: string | null;
}

function MediaEditor({
  reportId,
  mediaList,
  areaOptions,
}: {
  reportId: number;
  mediaList: MediaRow[];
  areaOptions: { id: number; name: string }[];
}) {
  const utils = trpc.useUtils();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [areaSel, setAreaSel] = useState<number | null>(null);

  const attach = trpc.propcheq.attachMedia.useMutation({
    onError: (e) => toast.error(e.message),
  });
  const update = trpc.propcheq.updateMedia.useMutation({
    onSuccess: () => utils.propcheq.getReport.invalidate({ id: reportId }),
  });
  const del = trpc.propcheq.deleteMedia.useMutation({
    onSuccess: () => utils.propcheq.getReport.invalidate({ id: reportId }),
    onError: (e) => toast.error(e.message),
  });

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(files.length);
    for (const file of Array.from(files)) {
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
        if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error ?? `Upload failed (${res.status})`);
        const { url } = (await res.json()) as { url: string };
        await attach.mutateAsync({
          reportId,
          areaId: areaSel,
          kind: file.type.startsWith("video/") ? "video" : "image",
          url,
        });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Upload failed");
      }
      setUploading((n) => n - 1);
    }
    await utils.propcheq.getReport.invalidate({ id: reportId });
    toast.success("Media added");
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Photos & video</CardTitle>
        <p className="text-xs text-muted-foreground">
          Take photos on-site or pick from your gallery — add a description to each.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <input
          ref={cameraRef}
          type="file"
          accept="image/*,video/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <div className="flex gap-2">
          <Button
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            disabled={uploading > 0}
            onClick={() => cameraRef.current?.click()}
          >
            {uploading > 0 ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Camera className="mr-1.5 h-4 w-4" />}
            Camera
          </Button>
          <Button variant="outline" className="flex-1" disabled={uploading > 0} onClick={() => galleryRef.current?.click()}>
            <ImagePlus className="mr-1.5 h-4 w-4" /> Gallery
          </Button>
        </div>
        {areaOptions.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Label className="shrink-0 text-xs text-muted-foreground">Tag new uploads to</Label>
            <select
              className="h-9 flex-1 rounded-md border bg-white px-2 text-sm"
              value={areaSel ?? ""}
              onChange={(e) => setAreaSel(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">No area</option>
              {areaOptions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {mediaList.map((m) => (
            <div key={m.id} className="overflow-hidden rounded-xl border bg-white">
              {m.kind === "image" ? (
                <img src={m.url} alt={m.caption ?? ""} className="aspect-[4/3] w-full object-cover" loading="lazy" />
              ) : (
                <div className="relative">
                  <video src={m.url} controls playsInline className="aspect-[4/3] w-full object-cover" preload="metadata" />
                  <span className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    <Film className="mr-0.5 inline h-3 w-3" /> VIDEO
                  </span>
                </div>
              )}
              <div className="space-y-2 p-2.5">
                <Textarea
                  rows={1}
                  className="min-h-[34px] resize-none text-sm"
                  placeholder="Describe this photo…"
                  defaultValue={m.caption ?? ""}
                  onBlur={(e) => {
                    if ((e.target.value || null) !== m.caption)
                      update.mutate({ id: m.id, caption: e.target.value || null });
                  }}
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-muted-foreground/60 transition-colors hover:text-red-500"
                    onClick={() => del.mutate({ id: m.id })}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {mediaList.length === 0 && uploading === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">No photos yet.</p>
        )}
      </CardContent>
    </Card>
  );
}

// ----------------------------------------------------------------- actions
interface ActionRow {
  id: number;
  text: string;
  status: "pending" | "approved" | "more_info" | "declined";
  response: string | null;
}

function ActionEditor({ reportId, actions }: { reportId: number; actions: ActionRow[] }) {
  const [text, setText] = useState("");
  const utils = trpc.useUtils();
  const add = trpc.propcheq.addActionRequest.useMutation({
    onSuccess: async () => {
      setText("");
      await utils.propcheq.getReport.invalidate({ id: reportId });
      toast.success("Request sent to the owner");
    },
    onError: (e) => toast.error(e.message),
  });
  const del = trpc.propcheq.deleteActionRequest.useMutation({
    onSuccess: () => utils.propcheq.getReport.invalidate({ id: reportId }),
  });

  const STATUS_CLS: Record<ActionRow["status"], string> = {
    pending: "bg-amber-100 text-amber-800",
    approved: "bg-emerald-100 text-emerald-800",
    more_info: "bg-sky-100 text-sky-800",
    declined: "bg-red-100 text-red-800",
  };
  const STATUS_LABEL: Record<ActionRow["status"], string> = {
    pending: "Pending",
    approved: "Approved",
    more_info: "More info requested",
    declined: "Declined",
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Requests to the owner</CardTitle>
        <p className="text-xs text-muted-foreground">
          Ask the owner to approve work or decisions — they respond with one tap.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((a) => (
          <div key={a.id} className="flex items-start justify-between gap-2 rounded-xl border bg-white p-3">
            <div>
              <p className="text-sm">{a.text}</p>
              <span className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_CLS[a.status]}`}>
                {STATUS_LABEL[a.status]}
              </span>
              {a.response && <p className="mt-1 text-sm text-muted-foreground">“{a.response}”</p>}
            </div>
            <button
              type="button"
              className="mt-0.5 text-muted-foreground/50 hover:text-red-500"
              onClick={() => del.mutate({ id: a.id })}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <div className="flex gap-2">
          <Input
            placeholder="e.g. Approve hedge pruning ahead of next inspection?"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            disabled={text.trim().length < 3 || add.isPending}
            onClick={() => add.mutate({ reportId, text: text.trim() })}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// -------------------------------------------------------------------- page
export default function ReportEdit() {
  const { id } = useParams<{ id: string }>();
  const reportId = Number(id);
  const { isLoading: authLoading } = useAuth({
    redirectOnUnauthenticated: true,
    redirectPath: LOGIN_PATH,
  });
  const { data, isLoading, error } = trpc.propcheq.getReport.useQuery(
    { id: reportId },
    { enabled: !authLoading && !!id },
  );
  const utils = trpc.useUtils();

  const [details, setDetails] = useState({
    inspectionDate: "",
    inspectorName: "",
    tenantName: "",
    summary: "",
    maintenanceRequired: "",
    suggestedImprovements: "",
  });
  useEffect(() => {
    if (data) {
      setDetails({
        inspectionDate: data.report.inspectionDate,
        inspectorName: data.report.inspectorName,
        tenantName: data.report.tenantName ?? "",
        summary: data.report.summary ?? "",
        maintenanceRequired: data.report.maintenanceRequired ?? "",
        suggestedImprovements: data.report.suggestedImprovements ?? "",
      });
    }
  }, [data?.report.id]);

  const updateDetails = trpc.propcheq.updateReportDetails.useMutation({
    onSuccess: () => utils.propcheq.getReport.invalidate({ id: reportId }),
    onError: (e) => toast.error(e.message),
  });
  const setStatus = trpc.propcheq.setReportStatus.useMutation({
    onSuccess: async (_, v) => {
      await utils.propcheq.invalidate();
      toast.success(v.status === "published" ? "Report published — the owner can now see it" : "Report moved back to draft");
    },
    onError: (e) => toast.error(e.message),
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-muted/40">
        <TopBar />
        <div className="mx-auto max-w-3xl space-y-4 p-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-52 w-full" />
          <Skeleton className="h-52 w-full" />
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

  const { report, property, viewerRole } = data;
  if (viewerRole !== "inspector") {
    return (
      <div className="min-h-screen bg-muted/40">
        <TopBar />
        <div className="mx-auto max-w-3xl p-4 pt-16 text-center">
          <p className="text-muted-foreground">Only the inspector can edit this report.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to={`/reports/${reportId}`}>View report</Link>
          </Button>
        </div>
      </div>
    );
  }

  const score = computeScore(report.cleanliness, report.condition);
  const areas = (data.areas as unknown as EditArea[]) ?? [];

  const saveField = (patch: Omit<Parameters<typeof updateDetails.mutate>[0], "id">) =>
    updateDetails.mutate({ ...patch, id: reportId });

  return (
    <div className="min-h-screen bg-muted/40 pb-24">
      <TopBar />
      <main className="mx-auto max-w-3xl space-y-4 p-4">
        {/* header */}
        <div className="flex items-start justify-between gap-2 pt-2">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
            </Link>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${TYPE_STYLES[report.type]}`}>
                {TYPE_LABELS[report.type]}
              </span>
              <h1 className="text-xl font-bold tracking-tight">{report.title}</h1>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {property.address}, {property.suburb} {property.state} {property.postcode}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <Button
              size="sm"
              variant={report.status === "published" ? "outline" : "default"}
              className={report.status === "published" ? "" : "bg-emerald-600 hover:bg-emerald-700"}
              disabled={setStatus.isPending}
              onClick={() =>
                setStatus.mutate({
                  id: reportId,
                  status: report.status === "published" ? "draft" : "published",
                })
              }
            >
              {report.status === "published" ? (
                <>
                  <Undo2 className="mr-1 h-3.5 w-3.5" /> Unpublish
                </>
              ) : (
                <>
                  <Globe className="mr-1 h-3.5 w-3.5" /> Publish
                </>
              )}
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link to={`/reports/${reportId}`}>
                <Eye className="mr-1 h-3.5 w-3.5" /> Preview
              </Link>
            </Button>
          </div>
        </div>

        {/* details */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Report details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Inspection date</Label>
                <Input
                  value={details.inspectionDate}
                  onChange={(e) => setDetails({ ...details, inspectionDate: e.target.value })}
                  onBlur={() => details.inspectionDate !== report.inspectionDate && saveField({ inspectionDate: details.inspectionDate })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Inspector</Label>
                <Input
                  value={details.inspectorName}
                  onChange={(e) => setDetails({ ...details, inspectorName: e.target.value })}
                  onBlur={() => details.inspectorName !== report.inspectorName && saveField({ inspectorName: details.inspectorName })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tenants</Label>
              <Input
                value={details.tenantName}
                onChange={(e) => setDetails({ ...details, tenantName: e.target.value })}
                onBlur={() => details.tenantName !== (report.tenantName ?? "") && saveField({ tenantName: details.tenantName || null })}
              />
            </div>
          </CardContent>
        </Card>

        {/* ratings */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Overall ratings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <ScoreGauge score={score} size={108} />
              <div className="w-full flex-1 space-y-3">
                <RatingSlider
                  label="Cleanliness"
                  value={report.cleanliness}
                  onChange={(v) => saveField({ cleanliness: v })}
                />
                <RatingSlider
                  label="Overall condition"
                  value={report.condition}
                  onChange={(v) => saveField({ condition: v })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Our summary</Label>
              <Textarea
                rows={3}
                value={details.summary}
                onChange={(e) => setDetails({ ...details, summary: e.target.value })}
                onBlur={() => details.summary !== (report.summary ?? "") && saveField({ summary: details.summary || null })}
              />
              <SnippetChips
                snippets={SUMMARY_SNIPPETS}
                onPick={(t) => {
                  const v = details.summary ? `${details.summary} ${t}` : t;
                  setDetails({ ...details, summary: v });
                  saveField({ summary: v });
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Maintenance required</Label>
              <Textarea
                rows={2}
                value={details.maintenanceRequired}
                onChange={(e) => setDetails({ ...details, maintenanceRequired: e.target.value })}
                onBlur={() =>
                  details.maintenanceRequired !== (report.maintenanceRequired ?? "") &&
                  saveField({ maintenanceRequired: details.maintenanceRequired || null })
                }
              />
              <SnippetChips
                snippets={MAINTENANCE_SNIPPETS}
                onPick={(t) => {
                  const v = details.maintenanceRequired ? `${details.maintenanceRequired} ${t}` : t;
                  setDetails({ ...details, maintenanceRequired: v });
                  saveField({ maintenanceRequired: v });
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Suggested improvements</Label>
              <Textarea
                rows={2}
                value={details.suggestedImprovements}
                onChange={(e) => setDetails({ ...details, suggestedImprovements: e.target.value })}
                onBlur={() =>
                  details.suggestedImprovements !== (report.suggestedImprovements ?? "") &&
                  saveField({ suggestedImprovements: details.suggestedImprovements || null })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* checklist */}
        <ChecklistEditor key={`cl-${reportId}-${areas.length}`} reportId={reportId} initial={areas} />

        {/* media */}
        <MediaEditor
          reportId={reportId}
          mediaList={data.media as MediaRow[]}
          areaOptions={areas.filter((a) => a.id).map((a) => ({ id: a.id!, name: a.name }))}
        />

        {/* actions */}
        <ActionEditor reportId={reportId} actions={data.actions as ActionRow[]} />
      </main>
    </div>
  );
}
