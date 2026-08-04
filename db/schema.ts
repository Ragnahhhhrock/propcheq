import {
  mysqlTable,
  mysqlEnum,
  varchar,
  text,
  timestamp,
  bigint,
  int,
  boolean,
  index,
} from "drizzle-orm/mysql-core";

const pk = () => bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey();

export const users = mysqlTable("users", {
  id: pk(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ---------------------------------------------------------------------------
// Properties — one per investment property; an inspector manages it, an owner
// is linked via an invite code. Only those two users may see its reports.
// ---------------------------------------------------------------------------

export const properties = mysqlTable(
  "properties",
  {
    id: pk(),
    address: varchar("address", { length: 255 }).notNull(),
    suburb: varchar("suburb", { length: 120 }).notNull(),
    state: varchar("state", { length: 10 }).notNull(),
    postcode: varchar("postcode", { length: 10 }).notNull(),
    inspectorId: bigint("inspectorId", { mode: "number", unsigned: true })
      .notNull()
      .references(() => users.id),
    ownerId: bigint("ownerId", { mode: "number", unsigned: true }).references(
      () => users.id,
    ),
    ownerCode: varchar("ownerCode", { length: 16 }).notNull().unique(),
    tenantName: varchar("tenantName", { length: 255 }),
    leaseExpiry: varchar("leaseExpiry", { length: 40 }),
    weeklyRent: varchar("weeklyRent", { length: 40 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
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

export const reports = mysqlTable(
  "reports",
  {
    id: pk(),
    propertyId: bigint("propertyId", { mode: "number", unsigned: true })
      .notNull()
      .references(() => properties.id),
    type: mysqlEnum("type", ["routine", "entry", "exit"]).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    inspectionDate: varchar("inspectionDate", { length: 40 }).notNull(),
    inspectorName: varchar("inspectorName", { length: 255 }).notNull(),
    status: mysqlEnum("status", ["draft", "published"]).default("draft").notNull(),
    summary: text("summary"),
    maintenanceRequired: text("maintenanceRequired"),
    suggestedImprovements: text("suggestedImprovements"),
    // overall ratings 1..10, score cached as 0..100
    cleanliness: int("cleanliness"),
    condition: int("condition"),
    score: int("score"),
    tenantName: varchar("tenantName", { length: 255 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    publishedAt: timestamp("publishedAt"),
  },
  (t) => ({ propIdx: index("report_prop_idx").on(t.propertyId) }),
);
export type Report = typeof reports.$inferSelect;

export const areas = mysqlTable(
  "areas",
  {
    id: pk(),
    reportId: bigint("reportId", { mode: "number", unsigned: true })
      .notNull()
      .references(() => reports.id),
    name: varchar("name", { length: 120 }).notNull(),
    sortOrder: int("sortOrder").notNull().default(0),
  },
  (t) => ({ reportIdx: index("area_report_idx").on(t.reportId) }),
);
export type Area = typeof areas.$inferSelect;

export const items = mysqlTable(
  "items",
  {
    id: pk(),
    areaId: bigint("areaId", { mode: "number", unsigned: true })
      .notNull()
      .references(() => areas.id),
    name: varchar("name", { length: 160 }).notNull(),
    clean: boolean("clean"),
    undamaged: boolean("undamaged"),
    working: boolean("working"),
    rating: int("rating"), // optional 1..10
    comment: text("comment"),
    sortOrder: int("sortOrder").notNull().default(0),
  },
  (t) => ({ areaIdx: index("item_area_idx").on(t.areaId) }),
);
export type Item = typeof items.$inferSelect;

export const media = mysqlTable(
  "media",
  {
    id: pk(),
    reportId: bigint("reportId", { mode: "number", unsigned: true })
      .notNull()
      .references(() => reports.id),
    areaId: bigint("areaId", { mode: "number", unsigned: true }).references(
      () => areas.id,
    ),
    kind: mysqlEnum("kind", ["image", "video"]).notNull(),
    url: varchar("url", { length: 512 }).notNull(),
    caption: text("caption"),
    sortOrder: int("sortOrder").notNull().default(0),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => ({ reportIdx: index("media_report_idx").on(t.reportId) }),
);
export type Media = typeof media.$inferSelect;

export const actionRequests = mysqlTable(
  "action_requests",
  {
    id: pk(),
    reportId: bigint("reportId", { mode: "number", unsigned: true })
      .notNull()
      .references(() => reports.id),
    text: text("text").notNull(),
    status: mysqlEnum("status", ["pending", "approved", "more_info", "declined"])
      .default("pending")
      .notNull(),
    response: text("response"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    respondedAt: timestamp("respondedAt"),
  },
  (t) => ({ reportIdx: index("action_report_idx").on(t.reportId) }),
);
export type ActionRequest = typeof actionRequests.$inferSelect;
