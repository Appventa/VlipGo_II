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
    let body: {
      jobId?: string;
      state?: string;
      status?: string;
      outputUrl?: string;
      output?: string;
      error?: string;
      errorMessage?: string;
      progress?: number;
      data?: { jobId?: string };
    };
    try {
      body = await request.json() as typeof body;
    } catch {
      return new Response("Bad JSON", { status: 400 });
    }

    const jobId = (body.jobId ?? body.data?.jobId) as Id<"jobs"> | undefined;
    if (!jobId) return new Response("Missing jobId", { status: 400 });

    const status = (body.state ?? body.status ?? "") as string;
    const outputUrl = (body.outputUrl ?? body.output ?? "") as string;
    const errorMessage = (body.error ?? body.errorMessage ?? "") as string;

    if (status === "finished" || status === "done" || status === "completed") {
      // Mutation uses job's renderPhase to decide PREVIEW_READY vs DONE
      await ctx.runMutation(internal.jobs.updateRenderProgress, {
        jobId,
        progress: 100,
        status: "FINISHED",
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

// ── Download proxy ───────────────────────────────────────────────
// Fetches a render URL server-side and returns it with Content-Disposition: attachment
// so the browser saves it to disk instead of opening it.

http.route({
  path: "/api/download",
  method: "GET",
  handler: httpAction(async (_ctx, request) => {
    const urlParam = new URL(request.url).searchParams.get("url");
    if (!urlParam) return new Response("Missing url", { status: 400 });

    let res: Response;
    try {
      res = await fetch(urlParam);
    } catch {
      return new Response("Fetch failed", { status: 502 });
    }
    if (!res.ok) return new Response("Upstream error", { status: 502 });

    const blob = await res.blob();
    const filename = decodeURIComponent(urlParam.split("/").pop()?.split("?")[0] ?? "render.mp4");

    return new Response(blob, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Access-Control-Allow-Origin": "*",
      },
    });
  }),
});

export default http;
