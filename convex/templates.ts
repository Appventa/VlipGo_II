import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// ── Public queries ──────────────────────────────────────────────

async function resolveThumb(ctx: { storage: { getUrl: (id: string) => Promise<string | null> } }, storageId?: string) {
  if (!storageId) return undefined;
  // Already a full URL (legacy data)
  if (storageId.startsWith("http")) return storageId;
  return (await ctx.storage.getUrl(storageId)) ?? undefined;
}

export const listPublished = query({
  args: {
    category: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, { category, search }) => {
    let templates = await ctx.db
      .query("templates")
      .withIndex("by_published", (q) => q.eq("isPublished", true).eq("isArchived", false))
      .collect();

    if (category) {
      templates = templates.filter((t) => t.category === category);
    }
    if (search) {
      const q = search.toLowerCase();
      templates = templates.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }
    return Promise.all(
      templates.map(async (t) => ({
        ...t,
        thumbnailUrl: await resolveThumb(ctx, t.thumbnailUrl),
      }))
    );
  },
});

export const getById = query({
  args: { templateId: v.id("templates") },
  handler: async (ctx, { templateId }) => {
    const template = await ctx.db.get(templateId);
    if (!template || template.isArchived) return null;
    const fields = await ctx.db
      .query("templateFields")
      .withIndex("by_template", (q) => q.eq("templateId", templateId))
      .collect();
    fields.sort((a, b) => a.order - b.order);
    return { ...template, thumbnailUrl: await resolveThumb(ctx, template.thumbnailUrl), fields };
  },
});

export const listCategories = query({
  args: {},
  handler: async (ctx) => {
    const templates = await ctx.db
      .query("templates")
      .withIndex("by_published", (q) => q.eq("isPublished", true).eq("isArchived", false))
      .collect();
    return [...new Set(templates.map((t) => t.category))].sort();
  },
});

// ── Admin queries ───────────────────────────────────────────────

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");
    const user = await ctx.db.get(userId);
    if (user?.role !== "ADMIN") throw new Error("Forbidden");
    return ctx.db.query("templates").order("desc").collect();
  },
});

export const getByIdAdmin = query({
  args: { templateId: v.id("templates") },
  handler: async (ctx, { templateId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");
    const user = await ctx.db.get(userId);
    if (user?.role !== "ADMIN") throw new Error("Forbidden");
    const template = await ctx.db.get(templateId);
    if (!template) return null;
    const fields = await ctx.db
      .query("templateFields")
      .withIndex("by_template", (q) => q.eq("templateId", templateId))
      .collect();
    fields.sort((a, b) => a.order - b.order);
    return { ...template, fields };
  },
});

// ── Admin mutations ─────────────────────────────────────────────

export const upsert = mutation({
  args: {
    templateId: v.optional(v.id("templates")),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    tags: v.array(v.string()),
    price: v.number(),
    currency: v.string(),
    thumbnailUrl: v.optional(v.string()),
    nexrenderComposition: v.string(),
    nexrenderCompositionName: v.optional(v.string()),
    nexrenderFinalComposition: v.optional(v.string()),
    nexrenderFinalCompositionName: v.optional(v.string()),
    previewVideoUrl: v.optional(v.string()),
    isPublished: v.boolean(),
    fields: v.array(
      v.object({
        label: v.string(),
        type: v.union(v.literal("TEXT"), v.literal("IMAGE"), v.literal("COLOR")),
        nexrenderLayer: v.string(),
        required: v.boolean(),
        order: v.number(),
      })
    ),
  },
  handler: async (ctx, { templateId, fields, ...data }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");
    const user = await ctx.db.get(userId);
    if (user?.role !== "ADMIN") throw new Error("Forbidden");

    let id: typeof templateId;
    if (templateId) {
      await ctx.db.patch(templateId, { ...data, isArchived: false });
      id = templateId;
    } else {
      id = await ctx.db.insert("templates", { ...data, isArchived: false });
    }

    // Replace all fields atomically
    const existing = await ctx.db
      .query("templateFields")
      .withIndex("by_template", (q) => q.eq("templateId", id!))
      .collect();
    await Promise.all(existing.map((f) => ctx.db.delete(f._id)));
    await Promise.all(
      fields.map((f) => ctx.db.insert("templateFields", { templateId: id!, ...f }))
    );

    return id;
  },
});

export const archive = mutation({
  args: { templateId: v.id("templates") },
  handler: async (ctx, { templateId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");
    const user = await ctx.db.get(userId);
    if (user?.role !== "ADMIN") throw new Error("Forbidden");
    await ctx.db.patch(templateId, { isArchived: true, isPublished: false });
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");
    const user = await ctx.db.get(userId);
    if (user?.role !== "ADMIN") throw new Error("Forbidden");
    return ctx.storage.generateUploadUrl();
  },
});
