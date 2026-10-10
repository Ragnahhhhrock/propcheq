import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

const pk = () => integer("id").primaryKey({ autoIncrement: true });
const fk = (name: string) => integer(name);
const now = () => new Date();
const ts = (name: string) => integer(name, { mode: "timestamp" });

export const users = sqliteTable("users", {
  id: pk(),
  unionId: text("unionId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  passwordHash: text("passwordHash"),
  avatar: text("avatar"),
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  createdAt: ts("createdAt").$defaultFn(now).notNull(),
  updatedAt: ts("updatedAt").$defaultFn(now)
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: ts("lastSignInAt").$defaultFn(now).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ---------------------------------------------------------------------------
// Properties — one per investment property; an inspector manages it, an owner
// is linked via an invite code. Only those two users may see its reports.
// ---------------------------------------------------------------------------

export const properties = sqliteTable(
  "properties",
  {
    id: pk(),
    address: text("address").notNull(),
    suburb: text("suburb").notNull(),
    state: text("state").notNull(),
    postcode: text("postcode").notNull(),
    inspectorId: fk("inspectorId")
      .notNull()
      .references(() => users.id),
    ownerId: fk("ownerId").references(
      () => users.id,
    ),
    ownerCode: text("ownerCode").notNull().unique(),
    tenantName: text("tenantName"),
    leaseExpiry: text("leaseExpiry"),
    weeklyRent: text("weeklyRent"),
    createdAt: ts("createdAt").$defaultFn(now).notNull(),
  },
  (t) => ({
    inspectorIdx: index("prop_inspector_idx").on(t.inspectorId),
    ownerIdx: index("prop_owner_idx").on(t.ownerId),
  }),
);
export type Property = typeof properties.$inferSelect;

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export const reports = sqliteTable(
  "reports",
  {
    id: pk(),
    propertyId: fk("propertyId")
      .notNull()
      .references(() => properties.id),
    type: text("type", { enum: ["routine", "entry", "exit"] }).notNull(),
    title: text("title").notNull(),
    inspectionDate: text("inspectionDate").notNull(),
    inspectorName: text("inspectorName").notNull(),
    status: text("status", { enum: ["draft", "published"] }).default("draft").notNull(),
    summary: text("summary"),
    maintenanceRequired: text("maintenanceRequired"),
    suggestedImprovements: text("suggestedImprovements"),
    // overall ratings 1..10, score cached as 0..100
    cleanliness: integer("cleanliness"),
    condition: integer("condition"),
    score: integer("score"),
    tenantName: text("tenantName"),
    createdAt: ts("createdAt").$defaultFn(now).notNull(),
    publishedAt: ts("publishedAt"),
  },
  (t) => ({ propIdx: index("report_prop_idx").on(t.propertyId) }),
);
export type Report = typeof reports.$inferSelect;

export const areas = sqliteTable(
  "areas",
  {
    id: pk(),
    reportId: fk("reportId")
      .notNull()
      .references(() => reports.id),
    name: text("name").notNull(),
    sortOrder: integer("sortOrder").notNull().default(0),
  },
  (t) => ({ reportIdx: index("area_report_idx").on(t.reportId) }),
);
export type Area = typeof areas.$inferSelect;

export const items = sqliteTable(
  "items",
  {
    id: pk(),
    areaId: fk("areaId")
      .notNull()
      .references(() => areas.id),
    name: text("name").notNull(),
    clean: integer("clean", { mode: "boolean" }),
    undamaged: integer("undamaged", { mode: "boolean" }),
    working: integer("working", { mode: "boolean" }),
    rating: integer("rating"), // optional 1..10
    comment: text("comment"),
    sortOrder: integer("sortOrder").notNull().default(0),
  },
  (t) => ({ areaIdx: index("item_area_idx").on(t.areaId) }),
);
export type Item = typeof items.$inferSelect;

export const media = sqliteTable(
  "media",
  {
    id: pk(),
    reportId: fk("reportId")
      .notNull()
      .references(() => reports.id),
    areaId: fk("areaId").references(
      () => areas.id,
    ),
    kind: text("kind", { enum: ["image", "video"] }).notNull(),
    url: text("url").notNull(),
    caption: text("caption"),
    sortOrder: integer("sortOrder").notNull().default(0),
    createdAt: ts("createdAt").$defaultFn(now).notNull(),
  },
  (t) => ({ reportIdx: index("media_report_idx").on(t.reportId) }),
);
export type Media = typeof media.$inferSelect;

export const actionRequests = sqliteTable(
  "action_requests",
  {
    id: pk(),
    reportId: fk("reportId")
      .notNull()
      .references(() => reports.id),
    text: text("text").notNull(),
    status: text("status", { enum: ["pending", "approved", "more_info", "declined"] })
      .default("pending")
      .notNull(),
    response: text("response"),
    createdAt: ts("createdAt").$defaultFn(now).notNull(),
    respondedAt: ts("respondedAt"),
  },
  (t) => ({ reportIdx: index("action_report_idx").on(t.reportId) }),
);
export type ActionRequest = typeof actionRequests.$inferSelect;
