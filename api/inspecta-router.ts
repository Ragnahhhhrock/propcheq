import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { desc, eq, inArray } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  properties,
  reports,
  areas,
  items,
  media,
  actionRequests,
  type Property,
} from "@db/schema";
import { areasForType, computeScore, REPORT_TYPES } from "@contracts/inspecta";

function makeCode(len = 8): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

async function getPropertyOrThrow(propertyId: number) {
  const prop = await getDb().query.properties.findFirst({
    where: eq(properties.id, propertyId),
  });
  if (!prop) throw new TRPCError({ code: "NOT_FOUND", message: "Property not found" });
  return prop;
}

function assertAccess(prop: Property, userId: number, role?: string) {
  if (prop.inspectorId === userId || prop.ownerId === userId || role === "admin") return;
  throw new TRPCError({ code: "FORBIDDEN", message: "You don't have access to this property" });
}

function assertInspector(prop: Property, userId: number, role?: string) {
  if (prop.inspectorId === userId || role === "admin") return;
  throw new TRPCError({ code: "FORBIDDEN", message: "Only the inspector can do this" });
}

async function reportWithProperty(reportId: number) {
  const report = await getDb().query.reports.findFirst({ where: eq(reports.id, reportId) });
  if (!report) throw new TRPCError({ code: "NOT_FOUND", message: "Report not found" });
  const prop = await getPropertyOrThrow(report.propertyId);
  return { report, prop };
}

export const inspectaRouter = createRouter({
  // ------------------------------------------------------------- dashboard
  myDashboard: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const uid = ctx.user.id;
    const isAdmin = ctx.user.role === "admin";
    const asInspector = isAdmin
      ? await db.query.properties.findMany({ orderBy: desc(properties.createdAt) })
      : await db.query.properties.findMany({
          where: eq(properties.inspectorId, uid),
          orderBy: desc(properties.createdAt),
        });
    const asOwner = await db.query.properties.findMany({
      where: eq(properties.ownerId, uid),
      orderBy: desc(properties.createdAt),
    });
    const allIds = [...asInspector, ...asOwner].map((p) => p.id);
    const reps = allIds.length
      ? await db.query.reports.findMany({
          where: inArray(reports.propertyId, allIds),
          orderBy: desc(reports.createdAt),
        })
      : [];
    const repIds = reps.map((r) => r.id);
    const acts = repIds.length
      ? await db.query.actionRequests.findMany({
          where: inArray(actionRequests.reportId, repIds),
          orderBy: desc(actionRequests.createdAt),
        })
      : [];
    const pack = (list: typeof asInspector, role: "inspector" | "owner") =>
      list.map((p) => ({
        ...p,
        viewerRole: role,
        ownerCode: role === "inspector" ? p.ownerCode : undefined,
        reports: reps
          .filter((r) => r.propertyId === p.id)
          .map((r) => ({
            ...r,
            pendingActions: acts.filter((a) => a.reportId === r.id && a.status === "pending").length,
            answeredActions: acts.filter((a) => a.reportId === r.id && a.status !== "pending").length,
          })),
      }));
    return {
      inspectorProperties: pack(asInspector, "inspector"),
      ownerProperties: pack(asOwner, "owner"),
    };
  }),

  // ----------------------------------------------------------- properties
  createProperty: authedQuery
    .input(
      z.object({
        address: z.string().min(3),
        suburb: z.string().min(2),
        state: z.string().min(2).max(10),
        postcode: z.string().min(3).max(10),
        tenantName: z.string().optional(),
        leaseExpiry: z.string().optional(),
        weeklyRent: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [{ id }] = await db
        .insert(properties)
        .values({ ...input, inspectorId: ctx.user.id, ownerCode: makeCode() })
        .$returningId();
      return { id, ownerCode: (await getPropertyOrThrow(id)).ownerCode };
    }),

  claimOwnerAccess: authedQuery
    .input(z.object({ code: z.string().min(4) }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const prop = await db.query.properties.findFirst({
        where: eq(properties.ownerCode, input.code.trim().toUpperCase()),
      });
      if (!prop) throw new TRPCError({ code: "NOT_FOUND", message: "No property found for that code" });
      if (prop.inspectorId === ctx.user.id)
        throw new TRPCError({ code: "BAD_REQUEST", message: "You are the inspector of this property" });
      if (prop.ownerId && prop.ownerId !== ctx.user.id)
        throw new TRPCError({ code: "FORBIDDEN", message: "This property is already linked to an owner" });
      if (!prop.ownerId) {
        await db.update(properties).set({ ownerId: ctx.user.id }).where(eq(properties.id, prop.id));
      }
      return { id: prop.id, address: prop.address };
    }),

  getProperty: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const prop = await getPropertyOrThrow(input.id);
      assertAccess(prop, ctx.user.id, ctx.user.role);
      const reps = await getDb().query.reports.findMany({
        where: eq(reports.propertyId, prop.id),
        orderBy: desc(reports.createdAt),
      });
      const viewerRole =
        prop.inspectorId === ctx.user.id || ctx.user.role === "admin" ? "inspector" : "owner";
      return {
        ...prop,
        viewerRole,
        canRespond: prop.ownerId === ctx.user.id || ctx.user.role === "admin",
        ownerCode: viewerRole === "inspector" ? prop.ownerCode : undefined,
        reports: reps,
      };
    }),

  // -------------------------------------------------------------- reports
  createReport: authedQuery
    .input(
      z.object({
        propertyId: z.number(),
        type: z.enum(["routine", "entry", "exit"]),
        inspectionDate: z.string().min(4),
        inspectorName: z.string().optional(),
        tenantName: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const prop = await getPropertyOrThrow(input.propertyId);
      assertInspector(prop, ctx.user.id, ctx.user.role);
      const db = getDb();
      const label = REPORT_TYPES.find((t) => t.value === input.type)?.label ?? "Inspection";
      const [{ id }] = await db
        .insert(reports)
        .values({
          propertyId: prop.id,
          type: input.type,
          title: `${label} — ${input.inspectionDate}`,
          inspectionDate: input.inspectionDate,
          inspectorName: input.inspectorName || ctx.user.name || "Inspector",
          tenantName: input.tenantName || prop.tenantName,
        })
        .$returningId();
      // template areas + items, defaulted "all good" for speed
      const template = areasForType(input.type);
      for (let a = 0; a < template.length; a++) {
        const [{ id: areaId }] = await db
          .insert(areas)
          .values({ reportId: id, name: template[a].name, sortOrder: a })
          .$returningId();
        await db.insert(items).values(
          template[a].items.map((name, i) => ({
            areaId,
            name,
            clean: true,
            undamaged: true,
            working: true,
            sortOrder: i,
          })),
        );
      }
      return { id };
    }),

  getReport: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const { report, prop } = await reportWithProperty(input.id);
      assertAccess(prop, ctx.user.id, ctx.user.role);
      if (report.status === "draft" && prop.inspectorId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "This report is not published yet" });
      }
      const db = getDb();
      const areaRows = await db.query.areas.findMany({
        where: eq(areas.reportId, report.id),
        orderBy: areas.sortOrder,
      });
      const areaIds = areaRows.map((a) => a.id);
      const itemRows = areaIds.length
        ? await db.query.items.findMany({
            where: inArray(items.areaId, areaIds),
            orderBy: items.sortOrder,
          })
        : [];
      const mediaRows = await db.query.media.findMany({
        where: eq(media.reportId, report.id),
        orderBy: media.sortOrder,
      });
      const actionRows = await db.query.actionRequests.findMany({
        where: eq(actionRequests.reportId, report.id),
        orderBy: desc(actionRequests.createdAt),
      });
      const viewerRole =
        prop.inspectorId === ctx.user.id || ctx.user.role === "admin" ? "inspector" : "owner";
      return {
        report,
        property: { ...prop, ownerCode: viewerRole === "inspector" ? prop.ownerCode : undefined },
        viewerRole,
        canRespond: prop.ownerId === ctx.user.id || ctx.user.role === "admin",
        areas: areaRows.map((a) => ({ ...a, items: itemRows.filter((i) => i.areaId === a.id) })),
        media: mediaRows,
        actions: actionRows,
      };
    }),

  updateReportDetails: authedQuery
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        inspectionDate: z.string().optional(),
        inspectorName: z.string().optional(),
        tenantName: z.string().nullable().optional(),
        summary: z.string().nullable().optional(),
        maintenanceRequired: z.string().nullable().optional(),
        suggestedImprovements: z.string().nullable().optional(),
        cleanliness: z.number().min(1).max(10).nullable().optional(),
        condition: z.number().min(1).max(10).nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { report, prop } = await reportWithProperty(input.id);
      assertInspector(prop, ctx.user.id, ctx.user.role);
      const { id, ...data } = input;
      const cleanliness = data.cleanliness !== undefined ? data.cleanliness : report.cleanliness;
      const condition = data.condition !== undefined ? data.condition : report.condition;
      await getDb()
        .update(reports)
        .set({ ...data, score: computeScore(cleanliness, condition) })
        .where(eq(reports.id, id));
      return { ok: true };
    }),

  updateChecklist: authedQuery
    .input(
      z.object({
        reportId: z.number(),
        areas: z.array(
          z.object({
            id: z.number().optional(),
            name: z.string().min(1),
            sortOrder: z.number(),
            items: z.array(
              z.object({
                id: z.number().optional(),
                name: z.string().min(1),
                clean: z.boolean().nullable(),
                undamaged: z.boolean().nullable(),
                working: z.boolean().nullable(),
                rating: z.number().min(1).max(10).nullable(),
                comment: z.string().nullable(),
                sortOrder: z.number(),
              }),
            ),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prop } = await reportWithProperty(input.reportId);
      assertInspector(prop, ctx.user.id, ctx.user.role);
      const db = getDb();
      const existingAreas = await db.query.areas.findMany({
        where: eq(areas.reportId, input.reportId),
      });
      const keepAreaIds = input.areas.filter((a) => a.id).map((a) => a.id!);
      const dropAreas = existingAreas.filter((a) => !keepAreaIds.includes(a.id)).map((a) => a.id);
      if (dropAreas.length) {
        // detach any media pointing at these areas before removing them
        await db.update(media).set({ areaId: null }).where(inArray(media.areaId, dropAreas));
        await db.delete(items).where(inArray(items.areaId, dropAreas));
        await db.delete(areas).where(inArray(areas.id, dropAreas));
      }
      for (const a of input.areas) {
        let areaId = a.id;
        if (areaId) {
          await db.update(areas).set({ name: a.name, sortOrder: a.sortOrder }).where(eq(areas.id, areaId));
        } else {
          [{ id: areaId }] = await db
            .insert(areas)
            .values({ reportId: input.reportId, name: a.name, sortOrder: a.sortOrder })
            .$returningId();
        }
        const existingItems = await db.query.items.findMany({ where: eq(items.areaId, areaId!) });
        const keepItemIds = a.items.filter((i) => i.id).map((i) => i.id!);
        const dropItems = existingItems.filter((i) => !keepItemIds.includes(i.id)).map((i) => i.id);
        if (dropItems.length) await db.delete(items).where(inArray(items.id, dropItems));
        for (const i of a.items) {
          const row = {
            name: i.name,
            clean: i.clean,
            undamaged: i.undamaged,
            working: i.working,
            rating: i.rating,
            comment: i.comment,
            sortOrder: i.sortOrder,
          };
          if (i.id) await db.update(items).set(row).where(eq(items.id, i.id));
          else await db.insert(items).values({ ...row, areaId: areaId! });
        }
      }
      return { ok: true };
    }),

  setReportStatus: authedQuery
    .input(z.object({ id: z.number(), status: z.enum(["draft", "published"]) }))
    .mutation(async ({ ctx, input }) => {
      const { report, prop } = await reportWithProperty(input.id);
      assertInspector(prop, ctx.user.id, ctx.user.role);
      await getDb()
        .update(reports)
        .set({
          status: input.status,
          publishedAt: input.status === "published" ? new Date() : null,
          score:
            input.status === "published"
              ? computeScore(report.cleanliness, report.condition)
              : report.score,
        })
        .where(eq(reports.id, report.id));
      return { ok: true };
    }),

  deleteReport: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { prop } = await reportWithProperty(input.id);
      assertInspector(prop, ctx.user.id, ctx.user.role);
      const db = getDb();
      const areaRows = await db.query.areas.findMany({ where: eq(areas.reportId, input.id) });
      const areaIds = areaRows.map((a) => a.id);
      if (areaIds.length) await db.delete(items).where(inArray(items.areaId, areaIds));
      await db.delete(areas).where(eq(areas.reportId, input.id));
      await db.delete(media).where(eq(media.reportId, input.id));
      await db.delete(actionRequests).where(eq(actionRequests.reportId, input.id));
      await db.delete(reports).where(eq(reports.id, input.id));
      return { ok: true };
    }),

  // ---------------------------------------------------------------- media
  attachMedia: authedQuery
    .input(
      z.object({
        reportId: z.number(),
        areaId: z.number().nullable().optional(),
        kind: z.enum(["image", "video"]),
        url: z.string().min(1),
        caption: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prop } = await reportWithProperty(input.reportId);
      assertInspector(prop, ctx.user.id, ctx.user.role);
      const [{ id }] = await getDb()
        .insert(media)
        .values({
          reportId: input.reportId,
          areaId: input.areaId ?? null,
          kind: input.kind,
          url: input.url,
          caption: input.caption ?? null,
          sortOrder: Date.now() % 1000000,
        })
        .$returningId();
      return { id };
    }),

  updateMedia: authedQuery
    .input(
      z.object({
        id: z.number(),
        caption: z.string().nullable().optional(),
        sortOrder: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const m = await getDb().query.media.findFirst({ where: eq(media.id, input.id) });
      if (!m) throw new TRPCError({ code: "NOT_FOUND" });
      const { prop } = await reportWithProperty(m.reportId);
      assertInspector(prop, ctx.user.id, ctx.user.role);
      await getDb()
        .update(media)
        .set({ caption: input.caption, sortOrder: input.sortOrder })
        .where(eq(media.id, input.id));
      return { ok: true };
    }),

  deleteMedia: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const m = await getDb().query.media.findFirst({ where: eq(media.id, input.id) });
      if (!m) throw new TRPCError({ code: "NOT_FOUND" });
      const { prop } = await reportWithProperty(m.reportId);
      assertInspector(prop, ctx.user.id, ctx.user.role);
      await getDb().delete(media).where(eq(media.id, input.id));
      return { ok: true };
    }),

  // ------------------------------------------------------ action requests
  addActionRequest: authedQuery
    .input(z.object({ reportId: z.number(), text: z.string().min(3) }))
    .mutation(async ({ ctx, input }) => {
      const { prop } = await reportWithProperty(input.reportId);
      assertInspector(prop, ctx.user.id, ctx.user.role);
      const [{ id }] = await getDb()
        .insert(actionRequests)
        .values({ reportId: input.reportId, text: input.text })
        .$returningId();
      return { id };
    }),

  respondActionRequest: authedQuery
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["approved", "more_info", "declined"]),
        response: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const act = await getDb().query.actionRequests.findFirst({
        where: eq(actionRequests.id, input.id),
      });
      if (!act) throw new TRPCError({ code: "NOT_FOUND" });
      const { prop } = await reportWithProperty(act.reportId);
      if (prop.ownerId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the owner can respond" });
      }
      await getDb()
        .update(actionRequests)
        .set({ status: input.status, response: input.response ?? null, respondedAt: new Date() })
        .where(eq(actionRequests.id, input.id));
      return { ok: true };
    }),

  deleteActionRequest: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const act = await getDb().query.actionRequests.findFirst({
        where: eq(actionRequests.id, input.id),
      });
      if (!act) throw new TRPCError({ code: "NOT_FOUND" });
      const { prop } = await reportWithProperty(act.reportId);
      assertInspector(prop, ctx.user.id, ctx.user.role);
      await getDb().delete(actionRequests).where(eq(actionRequests.id, input.id));
      return { ok: true };
    }),
});
