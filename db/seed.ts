import { readFileSync } from "node:fs";
import { eq } from "drizzle-orm";
import { getDb } from "../api/queries/connection";
import {
  users,
  properties,
  reports,
  areas,
  items,
  media,
  actionRequests,
} from "./schema";

interface SeedItem {
  name: string;
  clean: boolean | null;
  undamaged: boolean | null;
  working: boolean | null;
  comment: string;
}
interface SeedArea {
  name: string;
  items: SeedItem[];
}
interface SeedMedia {
  url: string;
  kind: "image" | "video";
  caption: string;
  area: string | null;
}
interface SeedAction {
  text: string;
  status: "pending" | "approved" | "more_info" | "declined";
  response: string | null;
  respondedAt: string | null;
}
interface SeedReport {
  key: string;
  type: "routine" | "entry" | "exit";
  title: string;
  inspectionDate: string;
  inspectorName: string;
  status: "draft" | "published";
  publishedAt: string | null;
  summary: string;
  maintenanceRequired: string;
  suggestedImprovements: string;
  cleanliness: number | null;
  condition: number | null;
  score: number | null;
  tenantName: string;
  areas: SeedArea[];
  media: SeedMedia[];
  actions: SeedAction[];
}
interface SeedData {
  inspector: { unionId: string; name: string; email: string };
  property: {
    address: string;
    suburb: string;
    state: string;
    postcode: string;
    ownerCode: string;
    tenantName: string;
    leaseExpiry: string;
    weeklyRent: string;
  };
  reports: SeedReport[];
}

async function seed() {
  const db = getDb();
  console.log("Seeding database...");

  const existing = await db.select().from(properties).limit(1);
  if (existing.length > 0) {
    console.log("Database already seeded — skipping.");
    process.exit(0);
  }

  const data = JSON.parse(
    readFileSync(new URL("./seed-data.json", import.meta.url), "utf8"),
  ) as SeedData;

  // 1. Inspector user
  await db
    .insert(users)
    .values({
      unionId: data.inspector.unionId,
      name: data.inspector.name,
      email: data.inspector.email,
      role: "user",
    })
    .onDuplicateKeyUpdate({ set: { name: data.inspector.name } });
  const inspector = await db.query.users.findFirst({
    where: eq(users.unionId, data.inspector.unionId),
  });
  if (!inspector) throw new Error("Failed to create inspector user");

  // 2. Property
  const [{ id: propertyId }] = await db
    .insert(properties)
    .values({
      address: data.property.address,
      suburb: data.property.suburb,
      state: data.property.state,
      postcode: data.property.postcode,
      inspectorId: inspector.id,
      ownerCode: data.property.ownerCode,
      tenantName: data.property.tenantName,
      leaseExpiry: data.property.leaseExpiry,
      weeklyRent: data.property.weeklyRent,
    })
    .$returningId();
  console.log(`Property created: id=${propertyId}`);

  // 3. Reports with areas, items, media, action requests
  for (const r of data.reports) {
    const [{ id: reportId }] = await db
      .insert(reports)
      .values({
        propertyId,
        type: r.type,
        title: r.title,
        inspectionDate: r.inspectionDate,
        inspectorName: r.inspectorName,
        status: r.status,
        summary: r.summary || null,
        maintenanceRequired: r.maintenanceRequired || null,
        suggestedImprovements: r.suggestedImprovements || null,
        cleanliness: r.cleanliness,
        condition: r.condition,
        score: r.score,
        tenantName: r.tenantName,
        publishedAt: r.publishedAt ? new Date(r.publishedAt) : null,
      })
      .$returningId();

    const areaIdByName = new Map<string, number>();
    for (const [ai, a] of r.areas.entries()) {
      const [{ id: areaId }] = await db
        .insert(areas)
        .values({ reportId, name: a.name, sortOrder: ai })
        .$returningId();
      areaIdByName.set(a.name, areaId);
      for (const [ii, item] of a.items.entries()) {
        await db.insert(items).values({
          areaId,
          name: item.name,
          clean: item.clean,
          undamaged: item.undamaged,
          working: item.working,
          comment: item.comment || null,
          sortOrder: ii,
        });
      }
    }

    for (const [mi, m] of r.media.entries()) {
      await db.insert(media).values({
        reportId,
        areaId: m.area ? (areaIdByName.get(m.area) ?? null) : null,
        kind: m.kind,
        url: m.url,
        caption: m.caption,
        sortOrder: mi,
      });
    }

    for (const act of r.actions) {
      await db.insert(actionRequests).values({
        reportId,
        text: act.text,
        status: act.status,
        response: act.response,
        respondedAt: act.respondedAt ? new Date(act.respondedAt) : null,
      });
    }

    console.log(
      `Report seeded: ${r.key} (${r.areas.length} areas, ${r.media.length} media, ${r.actions.length} actions)`,
    );
  }

  console.log("Done.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
