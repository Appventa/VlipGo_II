import { useQuery } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import { ShopLayout } from "../../layouts/ShopLayout";
import { Loading } from "../../components/ui/Loading";
import { cn } from "../../lib/utils";

const statusColor: Record<string, string> = {
  QUEUED: "bg-gray-100 text-gray-600",
  RENDERING: "bg-blue-100 text-blue-700",
  DONE: "bg-green-100 text-green-700",
  ERROR: "bg-red-100 text-red-700",
};

export function OrdersPage() {
  const jobs = useQuery(api.jobs.listByUser);

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
          {jobs.map((job) => (
            <Link
              key={job._id}
              to={`/orders/${job._id}`}
              className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between hover:shadow-sm transition-shadow"
            >
              <div>
                <p className="font-semibold text-gray-900">{job.templateTitle}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(job._creationTime).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {job.renderStatus === "RENDERING" && (
                  <span className="text-xs text-blue-500">{job.renderProgress}%</span>
                )}
                <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", statusColor[job.renderStatus])}>
                  {job.renderStatus}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </ShopLayout>
  );
}
