import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

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

    // Dispatch preview render first
    await ctx.scheduler.runAfter(0, internal.nexrender.dispatch, { jobId, preview: true });

    return jobId;
  },
});

// ── Customer: approve preview and trigger HD render ─────────────

export const approvePreview = mutation({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, { jobId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");
    const user = await ctx.db.get(userId);
    const job = await ctx.db.get(jobId);
    if (!job) throw new Error("Job not found");
    if (job.userId !== userId && user?.role !== "ADMIN") throw new Error("Forbidden");
    if (job.renderStatus !== "PREVIEW_READY") throw new Error("Job is not in preview state");

    await ctx.db.patch(jobId, {
      renderStatus: "QUEUED",
      renderProgress: 0,
      errorMessage: undefined,
    });
    await ctx.scheduler.runAfter(0, internal.nexrender.dispatch, { jobId, preview: false });
  },
});

// ── Render progress — called by nexrender callback ──────────────

export const updateRenderProgress = internalMutation({
  args: {
    jobId: v.id("jobs"),
    progress: v.number(),
    // "FINISHED" means nexrender completed — this mutation decides PREVIEW_READY vs DONE
    status: v.union(
      v.literal("RENDERING"),
      v.literal("FINISHED"),
      v.literal("ERROR")
    ),
    outputUrl: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, { jobId, progress, status, outputUrl, errorMessage }) => {
    if (status === "FINISHED") {
      const job = await ctx.db.get(jobId);
      if (job?.renderPhase === "PREVIEW") {
        await ctx.db.patch(jobId, {
          renderProgress: 100,
          renderStatus: "PREVIEW_READY",
          ...(outputUrl ? { previewUrl: outputUrl } : {}),
        });
      } else {
        await ctx.db.patch(jobId, {
          renderProgress: 100,
          renderStatus: "DONE",
          ...(outputUrl ? { outputUrl } : {}),
        });
      }
    } else {
      await ctx.db.patch(jobId, {
        renderProgress: progress,
        renderStatus: status,
        ...(errorMessage ? { errorMessage } : {}),
      });
    }
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
      previewUrl: undefined,
    });
    await ctx.scheduler.runAfter(0, internal.nexrender.dispatch, { jobId, preview: true });
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
        let thumbnailUrl = template?.thumbnailUrl;
        if (thumbnailUrl && !thumbnailUrl.startsWith("http")) {
          thumbnailUrl = (await ctx.storage.getUrl(thumbnailUrl)) ?? undefined;
        }
        return {
          ...j,
          templateTitle: template?.title ?? "Unknown",
          templateThumbnailUrl: thumbnailUrl ?? null,
          templateCategory: template?.category ?? null,
        };
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
