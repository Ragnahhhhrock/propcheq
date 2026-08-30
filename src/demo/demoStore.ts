// In-memory store for the interactive demo inspection (/demo/inspect).
// Lives for the browser session only — nothing is saved to a server.

import { areasForType, type ReportType } from "@contracts/propcheq";
import { TYPE_LABELS } from "@/lib/propcheq-ui";
import type { DemoAction, DemoArea, DemoMedia } from "./demoData";

export interface DemoSession {
  type: ReportType;
  title: string;
  status: "draft" | "published";
  inspectionDate: string;
  inspectorName: string;
  tenantName: string;
  cleanliness: number | null;
  condition: number | null;
  summary: string;
  maintenanceRequired: string;
  suggestedImprovements: string;
  areas: DemoArea[];
  media: DemoMedia[];
  actions: DemoAction[];
}

let session: DemoSession | null = null;
let nextId = 1000;

export function newId(): number {
  return nextId++;
}

export function getDemoSession(): DemoSession | null {
  return session;
}

export function startDemoSession(
  type: ReportType,
  inspectionDate: string,
  tenantName: string,
): DemoSession {
  const monthYear = new Date().toLocaleDateString("en-AU", {
    month: "long",
    year: "numeric",
  });
  session = {
    type,
    title: `${REPORT_TYPES.find((t) => t.value === type)?.label ?? "Inspection"} — ${monthYear}`,
    status: "draft",
    inspectionDate,
    inspectorName: "You (demo)",
    tenantName,
    cleanliness: null,
    condition: null,
    summary: "",
    maintenanceRequired: "",
    suggestedImprovements: "",
    areas: areasForType(type).map((a) => ({
      id: newId(),
      name: a.name,
      items: a.items.map((name) => ({
        id: newId(),
        name,
        clean: true as const,
        undamaged: true as const,
        working: true as const,
        rating: null,
        comment: null,
      })),
    })),
    media: [],
    actions: [],
  };
  return session;
}

export function endDemoSession() {
  session = null;
}
