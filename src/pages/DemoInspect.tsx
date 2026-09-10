import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
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
  Film,
} from "lucide-react";
import TopBar from "@/components/TopBar";
import DemoBanner from "@/components/DemoBanner";
import RatingSlider from "@/components/RatingSlider";
import SnippetChips from "@/components/SnippetChips";
import TriToggle from "@/components/TriToggle";
import ScoreGauge from "@/components/ScoreGauge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { demoInspectorProperties } from "@/demo/demoData";
import type { DemoAction, DemoArea, DemoMedia } from "@/demo/demoData";
import {
  getDemoSession,
  startDemoSession,
  newId,
  type DemoSession,
} from "@/demo/demoStore";

const property = demoInspectorProperties[0];

/* --------------------------- checklist editor ---------------------------- */

function ChecklistEditor({
  areas,
  onChange,
}: {
  areas: DemoArea[];
  onChange: (next: DemoArea[]) => void;
}) {
  const [dirty, setDirty] = useState(false);

  const mutate = (fn: (draft: DemoArea[]) => void) => {
    const next = areas.map((a) => ({
      ...a,
      items: a.items.map((i) => ({ ...i })),
    }));
    fn(next);
    onChange(next);
    setDirty(true);
  };

  const patchItem = (
    ai: number,
    ii: number,
    patch: Partial<DemoArea["items"][number]>,
  ) => mutate((d) => Object.assign(d[ai].items[ii], patch));

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Checklist</CardTitle>
          <Button
            size="sm"
            disabled={!dirty}
            onClick={() => {
              setDirty(false);
              toast.success("Checklist saved (demo)");
            }}
            className="bg-brand-blue hover:bg-blue-600"
          >
            {dirty ? "Save checklist" : "Saved"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Tap the circles to cycle ✓ / ✗ / – for Clean, Undamaged, Working.
        </p>
      </CardHeader>
      <CardContent className="px-2">
        <Accordion type="multiple" defaultValue={["area-0"]}>
          {areas.map((a, ai) => (
            <AccordionItem key={a.id} value={`area-${ai}`}>
              <AccordionTrigger className="px-2 text-sm font-semibold hover:no-underline">
                {a.name}
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {a.items.length} items
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-2">
                <ul className="space-y-3">
                  {a.items.map((i, ii) => (
                    <li key={i.id} className="rounded-xl border bg-white p-3">
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
                          id: newId(),
                          name: "New item",
                          clean: true,
                          undamaged: true,
                          working: true,
                          rating: null,
                          comment: null,
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
                id: newId(),
                name: `Area ${d.length + 1}`,
                items: [
                  {
                    id: newId(),
                    name: "General",
                    clean: true,
                    undamaged: true,
                    working: true,
                    rating: null,
                    comment: null,
                  },
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

/* ------------------------------ media editor ----------------------------- */

function MediaEditor({
  mediaList,
  areaOptions,
  onChange,
}: {
  mediaList: DemoMedia[];
  areaOptions: { id: number; name: string }[];
  onChange: (next: DemoMedia[]) => void;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [areaSel, setAreaSel] = useState<number | null>(null);

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const added: DemoMedia[] = Array.from(files).map((file) => ({
      id: newId(),
      areaId: areaSel,
      kind: file.type.startsWith("video/") ? "video" : "image",
      url: URL.createObjectURL(file),
      caption: null,
    }));
    onChange([...mediaList, ...added]);
    toast.success(
      `${added.length} ${added.length > 1 ? "photos" : "photo"} added (demo)`,
    );
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
            className="flex-1 bg-brand-blue hover:bg-blue-600"
            onClick={() => cameraRef.current?.click()}
          >
            <Camera className="mr-1.5 h-4 w-4" />
            Camera
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => galleryRef.current?.click()}
          >
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
                    const caption = e.target.value || null;
                    if (caption !== m.caption)
                      onChange(
                        mediaList.map((x) => (x.id === m.id ? { ...x, caption } : x)),
                      );
                  }}
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-muted-foreground/60 transition-colors hover:text-red-500"
                    onClick={() => onChange(mediaList.filter((x) => x.id !== m.id))}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {mediaList.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">No photos yet.</p>
        )}
      </CardContent>
    </Card>
  );
}

/* ----------------------------- action editor ----------------------------- */

const STATUS_CLS: Record<DemoAction["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  more_info: "bg-sky-100 text-sky-800",
  declined: "bg-red-100 text-red-800",
};
const STATUS_LABEL: Record<DemoAction["status"], string> = {
  pending: "Pending",
  approved: "Approved",
  more_info: "More info requested",
  declined: "Declined",
};

function ActionEditor({
  actions,
  onChange,
}: {
  actions: DemoAction[];
  onChange: (next: DemoAction[]) => void;
}) {
  const [text, setText] = useState("");
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
              onClick={() => onChange(actions.filter((x) => x.id !== a.id))}
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
            className="bg-brand-blue hover:bg-blue-600"
            disabled={text.trim().length < 3}
            onClick={() => {
              onChange([
                ...actions,
                { id: newId(), text: text.trim(), status: "pending", response: null, respondedAt: null },
              ]);
              setText("");
              toast.success("Request added (demo)");
            }}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* --------------------------------- page ---------------------------------- */

export default function DemoInspect() {
  const navigate = useNavigate();
  const existing = getDemoSession();
  // Guard: direct visit with no session → start a routine one so the page is never empty
  const [session, setSession] = useState<DemoSession>(
    () =>
      existing ??
      startDemoSession(
        "routine",
        new Date().toLocaleDateString("en-AU", {
          weekday: "long",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
        property.tenantName ?? "",
      ),
  );

  const patch = (p: Partial<DemoSession>) => {
    const next = { ...session, ...p };
    Object.assign(getDemoSession() ?? session, next);
    setSession(next);
  };

  const score = computeScore(session.cleanliness, session.condition);

  return (
    <div className="min-h-screen bg-muted/40 pb-24">
      <TopBar />
      <DemoBanner />
      <main className="mx-auto max-w-3xl space-y-4 p-4">
        {/* header */}
        <div className="flex items-start justify-between gap-2 pt-2">
          <div>
            <Link
              to="/demo"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
            </Link>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${TYPE_STYLES[session.type]}`}>
                {TYPE_LABELS[session.type]}
              </span>
              <h1 className="text-xl font-bold tracking-tight">{session.title}</h1>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {property.address}, {property.suburb} {property.state} {property.postcode}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <Button
              size="sm"
              variant={session.status === "published" ? "outline" : "default"}
              className={session.status === "published" ? "" : "bg-brand-blue hover:bg-blue-600"}
              onClick={() => {
                const next = session.status === "published" ? "draft" : "published";
                patch({ status: next });
                if (next === "published") {
                  toast.success("Report published — preview it now");
                  navigate("/demo/report");
                } else {
                  toast.success("Report moved back to draft");
                }
              }}
            >
              {session.status === "published" ? (
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
              <Link to="/demo/report">
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
                  value={session.inspectionDate}
                  onChange={(e) => patch({ inspectionDate: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Inspector</Label>
                <Input
                  value={session.inspectorName}
                  onChange={(e) => patch({ inspectorName: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tenants</Label>
              <Input
                value={session.tenantName}
                onChange={(e) => patch({ tenantName: e.target.value })}
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
                  value={session.cleanliness}
                  onChange={(v) => patch({ cleanliness: v })}
                />
                <RatingSlider
                  label="Overall condition"
                  value={session.condition}
                  onChange={(v) => patch({ condition: v })}
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
                value={session.summary}
                onChange={(e) => patch({ summary: e.target.value })}
              />
              <SnippetChips
                snippets={SUMMARY_SNIPPETS}
                onPick={(t) =>
                  patch({ summary: session.summary ? `${session.summary} ${t}` : t })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Maintenance required</Label>
              <Textarea
                rows={2}
                value={session.maintenanceRequired}
                onChange={(e) => patch({ maintenanceRequired: e.target.value })}
              />
              <SnippetChips
                snippets={MAINTENANCE_SNIPPETS}
                onPick={(t) =>
                  patch({
                    maintenanceRequired: session.maintenanceRequired
                      ? `${session.maintenanceRequired} ${t}`
                      : t,
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Suggested improvements</Label>
              <Textarea
                rows={2}
                value={session.suggestedImprovements}
                onChange={(e) => patch({ suggestedImprovements: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* checklist */}
        <ChecklistEditor areas={session.areas} onChange={(areas) => patch({ areas })} />

        {/* media */}
        <MediaEditor
          mediaList={session.media}
          areaOptions={session.areas.map((a) => ({ id: a.id, name: a.name }))}
          onChange={(media) => patch({ media })}
        />

        {/* actions */}
        <ActionEditor actions={session.actions} onChange={(actions) => patch({ actions })} />
      </main>
    </div>
  );
}
