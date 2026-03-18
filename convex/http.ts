import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

const http = httpRouter();
auth.addHttpRoutes(http);

// ── Nexrender callback ──────────────────────────────────────────
// Called by nexrender cloud when a render completes or fails.

http.route({
  path: "/api/nexrender-callback",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return new Response("Bad JSON", { status: 400 });
    }

    // nexrender sends back the original `data` we passed + job info
    const jobId = (body.jobId ?? body.data?.jobId) as Id<"jobs"> | undefined;
    if (!jobId) return new Response("Missing jobId", { status: 400 });

    const status = (body.state ?? body.status ?? "") as string;
    const outputUrl = (body.outputUrl ?? body.output ?? "") as string;
    const errorMessage = (body.error ?? body.errorMessage ?? "") as string;

    if (status === "finished" || status === "done" || status === "completed") {
      await ctx.runMutation(internal.nexrender.setJobError, {
        jobId,
        errorMessage: "",
      });
      // Use jobs:updateRenderProgress to set DONE
      await ctx.runMutation(internal.jobs.updateRenderProgress, {
        jobId,
        progress: 100,
        status: "DONE",
        outputUrl: outputUrl || undefined,
      });
    } else if (status === "error" || status === "failed") {
      await ctx.runMutation(internal.jobs.updateRenderProgress, {
        jobId,
        progress: 0,
        status: "ERROR",
        errorMessage: errorMessage || "Render failed",
      });
    } else {
      // Progress update
      const progress = typeof body.progress === "number" ? body.progress : 0;
      await ctx.runMutation(internal.jobs.updateRenderProgress, {
        jobId,
        progress,
        status: "RENDERING",
      });
    }

    return new Response("OK", { status: 200 });
  }),
});

export default http;
