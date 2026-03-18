import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

const NEXRENDER_API = "https://api.nexrender.com/api/v2/jobs";

// ── Dispatch a render job to nexrender cloud ────────────────────

export const dispatch = internalAction({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, { jobId }) => {
    const job = await ctx.runQuery(internal.nexrender.getJobForDispatch, { jobId });
    if (!job) throw new Error(`Job ${jobId} not found`);

    const apiKey = process.env.NEXRENDER_API_SECRET;
    if (!apiKey) throw new Error("NEXRENDER_API_SECRET not set");

    const siteUrl = process.env.CONVEX_SITE_URL;
    const callbackUrl = `${siteUrl}/api/nexrender-callback`;

    const assets = job.assets
      .map((asset: { fieldId: string; value: string }) => {
        const field = job.fields.find(
          (f: { _id: string; type: string; nexrenderLayer: string }) => f._id === asset.fieldId
        );
        if (!field) return null;
        if (field.type === "TEXT") {
          return { type: "text", layerName: field.nexrenderLayer, value: asset.value };
        }
        if (field.type === "COLOR") {
          return { type: "data", layerName: field.nexrenderLayer, value: asset.value };
        }
        if (field.type === "IMAGE") {
          return { type: "image", layerName: field.nexrenderLayer, src: asset.value };
        }
        return null;
      })
      .filter((a): a is NonNullable<typeof a> => a !== null);

    const body = {
      template: {
        id: job.template.nexrenderComposition,
        composition: job.template.nexrenderCompositionName ?? "main",
      },
      assets,
      webhook: {
        url: callbackUrl,
        method: "POST",
        data: { jobId },
      },
    };

    const res = await fetch(NEXRENDER_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      await ctx.runMutation(internal.nexrender.setJobError, {
        jobId,
        errorMessage: `Nexrender dispatch failed (${res.status}): ${text}`,
      });
      return;
    }

    const data = (await res.json()) as { id?: string; _id?: string; jobId?: string };
    await ctx.runMutation(internal.nexrender.setJobDispatched, {
      jobId,
      nexrenderJobId: data.id ?? data._id ?? String(data.jobId ?? ""),
    });
  },
});

// ── Internal helpers ────────────────────────────────────────────

export const getJobForDispatch = internalQuery({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, { jobId }) => {
    const job = await ctx.db.get(jobId);
    if (!job) return null;
    const template = await ctx.db.get(job.templateId);
    if (!template) return null;
    const assets = await ctx.db
      .query("jobAssets")
      .withIndex("by_job", (q) => q.eq("jobId", jobId))
      .collect();
    const fields = await ctx.db
      .query("templateFields")
      .withIndex("by_template", (q) => q.eq("templateId", job.templateId))
      .collect();
    return { ...job, template, assets, fields };
  },
});

export const setJobDispatched = internalMutation({
  args: { jobId: v.id("jobs"), nexrenderJobId: v.string() },
  handler: async (ctx, { jobId, nexrenderJobId }) => {
    await ctx.db.patch(jobId, {
      renderStatus: "RENDERING",
      renderProgress: 0,
      nexrenderJobId,
    });
  },
});

export const setJobError = internalMutation({
  args: { jobId: v.id("jobs"), errorMessage: v.string() },
  handler: async (ctx, { jobId, errorMessage }) => {
    await ctx.db.patch(jobId, { renderStatus: "ERROR", errorMessage });
  },
});
