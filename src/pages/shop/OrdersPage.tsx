import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { ShopLayout } from "../../layouts/ShopLayout";
import { Loading } from "../../components/ui/Loading";
import { cn } from "../../lib/utils";
import { Play, Loader2, X } from "lucide-react";

const statusColor: Record<string, string> = {
  QUEUED: "bg-gray-100 text-gray-600",
  RENDERING: "bg-blue-100 text-blue-700",
  PREVIEW_READY: "bg-amber-100 text-amber-700",
  DONE: "bg-green-100 text-green-700",
  ERROR: "bg-red-100 text-red-700",
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
  const navigate = useNavigate();
  const [watchUrl, setWatchUrl] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  async function handleApprove(jobId: Id<"jobs">) {
    setApprovingId(jobId);
    try {
      await approvePreview({ jobId });
    } finally {
      setApprovingId(null);
    }
  }

  return (
    <ShopLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>

      {jobs === undefined ? (
        <Loading />
      ) : jobs.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          No orders yet.{" "}
          <Link to="/templates" className="text-blue-600 hover:underline">Browse templates →</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map((job) => {
            const isPreviewReady = job.renderStatus === "PREVIEW_READY";
            const isApproving = approvingId === job._id;

            return (
              <div
                key={job._id}
                className={cn(
                  "bg-white rounded-xl border p-4 transition-shadow",
                  isPreviewReady ? "border-amber-200 shadow-sm" : "border-gray-200 hover:shadow-sm"
                )}
              >
                <div className="flex items-center justify-between">
                  {/* Left: title + date */}
                  <button
                    onClick={() => navigate(`/orders/${job._id}`)}
                    className="text-left flex-1 min-w-0 mr-3"
                  >
                    <p className="font-semibold text-gray-900 truncate">{job.templateTitle}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(job._creationTime).toLocaleDateString()}
                    </p>
                  </button>

                  {/* Right: badge + actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {job.renderStatus === "RENDERING" && (
                      <span className="text-xs text-blue-500">{job.renderProgress}%</span>
                    )}
                    <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", statusColor[job.renderStatus])}>
                      {statusLabel[job.renderStatus] ?? job.renderStatus}
                    </span>
                  </div>
                </div>

                {/* Preview actions row */}
                {isPreviewReady && (
                  <div className="mt-3 pt-3 border-t border-amber-100 flex gap-2">
                    {job.previewUrl && (
                      <button
                        onClick={() => setWatchUrl(job.previewUrl!)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors"
                      >
                        <Play size={14} /> Watch Preview
                      </button>
                    )}
                    <button
                      onClick={() => handleApprove(job._id)}
                      disabled={isApproving}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-900 hover:bg-gray-700 disabled:opacity-60 text-white transition-colors"
                    >
                      {isApproving ? <Loader2 size={14} className="animate-spin" /> : null}
                      {isApproving ? "Submitting…" : "Render HD →"}
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
