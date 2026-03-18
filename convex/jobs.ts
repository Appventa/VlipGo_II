import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// ── Customer mutations ──────────────────────────────────────────

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");
    return ctx.storage.generateUploadUrl();
  },
});

export const create = mutation({
  args: {
    templateId: v.id("templates"),
    assets: v.array(
      v.object({
        fieldId: v.id("templateFields"),
        value: v.string(),
      })
    ),
  },
  handler: async (ctx, { templateId, assets }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const template = await ctx.db.get(templateId);
    if (!template || !template.isPublished || template.isArchived) {
      throw new Error("Template not available");
    }

    // DEV: skip Stripe — mark PAID immediately
    const jobId = await ctx.db.insert("jobs", {
      userId,
      templateId,
      paymentStatus: "PAID",
      renderStatus: "QUEUED",
      renderProgress: 0,
    });

    await Promise.all(
      assets.map((a) =>
        ctx.db.insert("jobAssets", { jobId, fieldId: a.fieldId, value: a.value })
      )
    );

    return jobId;
  },
});

// ── Render progress (called by Nexrender worker) ────────────────

export const updateRenderProgress = mutation({
  args: {
    jobId: v.id("jobs"),
    progress: v.number(),
    status: v.union(
      v.literal("QUEUED"),
      v.literal("RENDERING"),
      v.literal("DONE"),
      v.literal("ERROR")
    ),
    outputUrl: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, { jobId, progress, status, outputUrl, errorMessage }) => {
    await ctx.db.patch(jobId, {
      renderProgress: progress,
      renderStatus: status,
      ...(outputUrl ? { outputUrl } : {}),
      ...(errorMessage ? { errorMessage } : {}),
    });
  },
});

// ── Admin: retry render ─────────────────────────────────────────

export const retryRender = mutation({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, { jobId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");
    const user = await ctx.db.get(userId);
    if (user?.role !== "ADMIN") throw new Error("Forbidden");
    await ctx.db.patch(jobId, {
      renderStatus: "QUEUED",
      renderProgress: 0,
      errorMessage: undefined,
      outputUrl: undefined,
    });
  },
});

// ── Queries ─────────────────────────────────────────────────────

export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    return Promise.all(
      jobs.map(async (j) => {
        const template = await ctx.db.get(j.templateId);
        return { ...j, templateTitle: template?.title ?? "Unknown" };
      })
    );
  },
});

export const getById = query({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, { jobId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    const job = await ctx.db.get(jobId);
    if (!job) return null;
    if (job.userId !== userId && user?.role !== "ADMIN") return null;

    const template = await ctx.db.get(job.templateId);
    const assets = await ctx.db
      .query("jobAssets")
      .withIndex("by_job", (q) => q.eq("jobId", jobId))
      .collect();

    return { ...job, template, assets };
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");
    const user = await ctx.db.get(userId);
    if (user?.role !== "ADMIN") throw new Error("Forbidden");
    const jobs = await ctx.db.query("jobs").order("desc").collect();
    return Promise.all(
      jobs.map(async (j) => {
        const template = await ctx.db.get(j.templateId);
        const owner = await ctx.db.get(j.userId);
        return { ...j, templateTitle: template?.title ?? "?", ownerEmail: owner?.email ?? "?" };
      })
    );
  },
});
