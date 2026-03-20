import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { ShopLayout } from "../../layouts/ShopLayout";
import { Loading } from "../../components/ui/Loading";
import { useCreditsModal } from "../../contexts/CreditsModalContext";
import { cn } from "../../lib/utils";
import { Play, Loader2, X, Film } from "lucide-react";

const statusColor: Record<string, string> = {
  QUEUED: "bg-[#262626] text-gray-400",
  RENDERING: "bg-indigo-500/20 text-[#C3C0FF]",
  PREVIEW_READY: "bg-amber-500/20 text-amber-400",
  DONE: "bg-green-500/20 text-green-400",
  ERROR: "bg-red-500/20 text-red-400",
};

const statusLabel: Record<string, string> = {
  QUEUED: "Queued",
  RENDERING: "Rendering…",
  PREVIEW_READY: "Preview Ready",
  DONE: "Done",
  ERROR: "Error",
};

function PreviewModal({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="relative bg-black rounded-xl overflow-hidden w-full max-w-2xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 text-white/80 hover:text-white bg-black/40 rounded-full p-1"
        >
          <X size={18} />
        </button>
        <video src={url} controls autoPlay className="w-full" style={{ maxHeight: 480 }} />
      </div>
    </div>
  );
}

export function OrdersPage() {
  const jobs = useQuery(api.jobs.listByUser);
  const approvePreview = useMutation(api.jobs.approvePreview);
  const { openBuyCredits } = useCreditsModal();
  const navigate = useNavigate();
  const [watchUrl, setWatchUrl] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  async function handleApprove(jobId: Id<"jobs">) {
    setApprovingId(jobId);
    try {
      await approvePreview({ jobId });
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("INSUFFICIENT_CREDITS")) {
        openBuyCredits();
      }
    } finally {
      setApprovingId(null);
    }
  }

  return (
    <ShopLayout>
      <h1 className="text-2xl font-bold text-white mb-6">My Orders</h1>

      {jobs === undefined ? (
        <Loading />
      ) : jobs.length === 0 ? (
        <div className="text-center py-20 text-gray-600">
          No orders yet.{" "}
          <Link to="/templates" className="text-[#C3C0FF] hover:underline">Browse templates →</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map((job) => {
            const isPreviewReady = job.renderStatus === "PREVIEW_READY";
            const isApproving = approvingId === job._id;
            const hdCredits = Math.max(0, Math.round((job.templatePrice ?? 0) / 100) - 1);

            return (
              <div
                key={job._id}
                className={cn(
                  "bg-[#1e1e1e] rounded-xl p-4 transition-all",
                  isPreviewReady ? "ring-1 ring-amber-500/30" : "hover:bg-[#222222]"
                )}
              >
                <div className="flex items-center justify-between">
                  {/* Left: thumbnail + title + date */}
                  <button
                    onClick={() => navigate(`/orders/${job._id}`)}
                    className="text-left flex-1 min-w-0 mr-3 flex items-center gap-3"
                  >
                    <div className="w-16 h-10 rounded-lg overflow-hidden bg-[#262626] shrink-0">
                      {job.templateThumbnailUrl ? (
                        <img
                          src={job.templateThumbnailUrl}
                          alt={job.templateTitle}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film size={13} className="text-gray-600" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">{job.templateTitle}</p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {new Date(job._creationTime).toLocaleDateString()}
                      </p>
                    </div>
                  </button>

                  {/* Right: badge + actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {job.renderStatus === "RENDERING" && (
                      <span className="text-xs text-[#C3C0FF]">{job.renderProgress}%</span>
                    )}
                    <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", statusColor[job.renderStatus])}>
                      {statusLabel[job.renderStatus] ?? job.renderStatus}
                    </span>
                  </div>
                </div>

                {/* Preview actions row */}
                {isPreviewReady && (
                  <div className="mt-3 pt-3 border-t border-white/[0.06] flex gap-2">
                    {job.previewUrl && (
                      <button
                        onClick={() => setWatchUrl(job.previewUrl!)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-colors"
                      >
                        <Play size={14} /> Watch Preview
                      </button>
                    )}
                    <button
                      onClick={() => handleApprove(job._id)}
                      disabled={isApproving}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-gradient-to-b from-indigo-500 to-indigo-600 text-white hover:brightness-110 disabled:opacity-60 transition-all"
                    >
                      {isApproving ? <Loader2 size={14} className="animate-spin" /> : null}
                      {isApproving ? "Submitting…" : <><span>Render HD</span><span className="text-indigo-200/70 font-normal text-xs ml-1">· {hdCredits} cr</span><span className="ml-0.5">→</span></>}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {watchUrl && <PreviewModal url={watchUrl} onClose={() => setWatchUrl(null)} />}
    </ShopLayout>
  );
}
