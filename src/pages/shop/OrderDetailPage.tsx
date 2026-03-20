import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { ShopLayout } from "../../layouts/ShopLayout";
import { Loading } from "../../components/ui/Loading";
import { useCreditsModal } from "../../contexts/CreditsModalContext";
import { cn } from "../../lib/utils";
import { Download, AlertCircle, Clock, Loader2, CheckCircle2, PlayCircle } from "lucide-react";

function StatusIcon({ status }: { status: string }) {
  if (status === "DONE") return <CheckCircle2 className="text-green-500" size={20} />;
  if (status === "ERROR") return <AlertCircle className="text-red-500" size={20} />;
  if (status === "PREVIEW_READY") return <PlayCircle className="text-amber-500" size={20} />;
  if (status === "RENDERING") return <Loader2 className="text-indigo-400 animate-spin" size={20} />;
  return <Clock className="text-gray-400" size={20} />;
}

export function OrderDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const job = useQuery(api.jobs.getById, { jobId: jobId as Id<"jobs"> });
  const approvePreview = useMutation(api.jobs.approvePreview);
  const { openBuyCredits } = useCreditsModal();
  const [approving, setApproving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  async function handleDownload(url: string, filename = "vlipgo-render.mp4") {
    setDownloading(true);
    try {
      const proxyUrl = `${import.meta.env.VITE_CONVEX_SITE_URL}/api/download?url=${encodeURIComponent(url)}`;
      const a = document.createElement("a");
      a.href = proxyUrl;
      a.download = filename;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      // Small delay so the download starts before spinner disappears
      setTimeout(() => setDownloading(false), 1500);
    }
  }

  if (job === undefined) return <ShopLayout><Loading /></ShopLayout>;
  if (!job) return <ShopLayout><div className="py-20 text-center text-gray-500">Order not found.</div></ShopLayout>;

  const isDone = job.renderStatus === "DONE";
  const isError = job.renderStatus === "ERROR";
  const isRendering = job.renderStatus === "RENDERING";
  const isPreviewReady = job.renderStatus === "PREVIEW_READY";

  async function handleApprove() {
    setApproving(true);
    try {
      await approvePreview({ jobId: job!._id });
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("INSUFFICIENT_CREDITS")) {
        openBuyCredits();
      }
    } finally {
      setApproving(false);
    }
  }

  return (
    <ShopLayout>
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <StatusIcon status={job.renderStatus} />
          <div>
            <h1 className="text-2xl font-bold text-white">{job.template?.title ?? "Your Order"}</h1>
            <p className="text-sm text-gray-500">Order ID: {job._id.slice(-8).toUpperCase()}</p>
          </div>
        </div>

        {/* Status card */}
        <div className={cn(
          "rounded-xl p-6 mb-6",
          isDone ? "bg-green-500/10" :
          isError ? "bg-red-500/10" :
          isPreviewReady ? "bg-amber-500/10" :
          "bg-[#1e1e1e]"
        )}>
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-gray-300">Render Status</span>
            <span className={cn(
              "text-sm font-medium px-3 py-1 rounded-full",
              isDone ? "bg-green-500/20 text-green-400" :
              isError ? "bg-red-500/20 text-red-400" :
              isPreviewReady ? "bg-amber-500/20 text-amber-400" :
              isRendering ? "bg-indigo-500/20 text-[#C3C0FF]" :
              "bg-white/[0.08] text-gray-400"
            )}>
              {isPreviewReady ? "Preview Ready" : job.renderStatus}
            </span>
          </div>

          {/* Progress bar — shown while queued or rendering */}
          {!isDone && !isError && !isPreviewReady && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{isRendering ? "Rendering…" : "Queued — waiting for renderer"}</span>
                <span>{job.renderProgress}%</span>
              </div>
              <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${job.renderProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Preview player + approve button */}
          {isPreviewReady && job.previewUrl && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-amber-300">
                Your preview is ready! Watch it below, then approve to render the full HD version.
              </p>
              <video
                src={job.previewUrl}
                controls
                className="w-full rounded-lg bg-black"
                style={{ maxHeight: 280 }}
              />
              <button
                onClick={handleApprove}
                disabled={approving}
                className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-b from-indigo-500 to-indigo-600 hover:brightness-110 disabled:opacity-60 text-white font-semibold rounded-lg transition-all active:scale-[0.98]"
              >
                {approving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                {approving ? "Submitting…" : "Looks good — Render Full HD"}
              </button>
            </div>
          )}

          {/* Download button */}
          {isDone && job.outputUrl && (
            <button
              onClick={() => handleDownload(job.outputUrl!, `${job.template?.title ?? "render"}.mp4`)}
              disabled={downloading}
              className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors"
            >
              {downloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
              {downloading ? "Preparing download…" : "Download MP4"}
            </button>
          )}

          {isError && (
            <div className="text-sm text-red-400">
              <p className="font-medium mb-1">Render failed</p>
              <p className="text-red-400/80">{job.errorMessage ?? "Unknown error. Please contact support."}</p>
            </div>
          )}
        </div>

        {/* What you submitted */}
        {job.assets.length > 0 && (
          <div className="bg-[#1e1e1e] rounded-xl p-5">
            <h2 className="font-semibold text-gray-300 mb-3">Your Customizations</h2>
            <ul className="flex flex-col gap-2 text-sm text-gray-400">
              {job.assets.map((a) => (
                <li key={a._id} className="flex gap-2">
                  <span className="text-gray-600">•</span>
                  <span className="break-all">{a.value}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link to="/orders" className="text-sm text-[#C3C0FF] hover:underline">← All orders</Link>
        </div>
      </div>
    </ShopLayout>
  );
}
