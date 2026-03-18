import { useQuery, useMutation } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { AdminLayout } from "../../layouts/AdminLayout";
import { Loading } from "../../components/ui/Loading";
import { Button } from "../../components/ui/Button";
import { cn } from "../../lib/utils";
import { RotateCcw, ExternalLink } from "lucide-react";

const statusColor: Record<string, string> = {
  QUEUED: "bg-white/[0.08] text-gray-400",
  RENDERING: "bg-blue-500/20 text-blue-400",
  PREVIEW_READY: "bg-amber-500/20 text-amber-400",
  DONE: "bg-green-500/20 text-green-400",
  ERROR: "bg-red-500/20 text-red-400",
};

export function AdminJobsPage() {
  const jobs = useQuery(api.jobs.listAll);
  const retry = useMutation(api.jobs.retryRender);

  async function handleRetry(jobId: Id<"jobs">) {
    await retry({ jobId });
  }

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-white mb-6">Jobs</h1>

      {jobs === undefined ? (
        <Loading />
      ) : jobs.length === 0 ? (
        <div className="text-center py-20 text-gray-600">No jobs yet.</div>
      ) : (
        <div className="bg-[#1a1a1a] rounded-xl border border-white/[0.08] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#141414] border-b border-white/[0.08]">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-400">Template</th>
                <th className="text-left px-4 py-3 font-medium text-gray-400">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-400">Payment</th>
                <th className="text-left px-4 py-3 font-medium text-gray-400">Render</th>
                <th className="text-left px-4 py-3 font-medium text-gray-400">Progress</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {jobs.map((job) => (
                <tr key={job._id} className="hover:bg-white/[0.03]">
                  <td className="px-4 py-3 font-medium text-white">{job.templateTitle}</td>
                  <td className="px-4 py-3 text-gray-500">{job.ownerEmail}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full",
                      job.paymentStatus === "PAID" ? "bg-green-500/20 text-green-400" :
                      job.paymentStatus === "FAILED" ? "bg-red-500/20 text-red-400" :
                      "bg-yellow-500/20 text-yellow-400"
                    )}>
                      {job.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", statusColor[job.renderStatus] ?? "bg-white/[0.08] text-gray-400")}>
                      {job.renderStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 bg-white/[0.08] rounded-full">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${job.renderProgress}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600">{job.renderProgress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link to={`/orders/${job._id}`} target="_blank">
                        <Button variant="ghost" size="sm"><ExternalLink size={13} /></Button>
                      </Link>
                      {(job.renderStatus === "ERROR" || job.renderStatus === "QUEUED") && (
                        <Button variant="ghost" size="sm" onClick={() => handleRetry(job._id)}>
                          <RotateCcw size={13} />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
