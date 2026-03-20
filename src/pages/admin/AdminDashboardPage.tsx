import { useQuery, useMutation } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { AdminLayout } from "../../layouts/AdminLayout";
import { cn } from "../../lib/utils";
import {
  FileVideo, Users, Film, Loader2, CheckCircle2, AlertCircle,
  Clock, ArrowRight, RotateCcw, ExternalLink, PlusCircle, Briefcase,
  Activity,
} from "lucide-react";

const STATUS_COLOR: Record<string, string> = {
  QUEUED:        "bg-[#262626] text-gray-400",
  RENDERING:     "bg-indigo-500/20 text-[#C3C0FF]",
  PREVIEW_READY: "bg-amber-500/20 text-amber-400",
  DONE:          "bg-green-500/20 text-green-400",
  ERROR:         "bg-red-500/20 text-red-400",
};
const STATUS_LABEL: Record<string, string> = {
  QUEUED:        "Queued",
  RENDERING:     "Rendering",
  PREVIEW_READY: "Preview Ready",
  DONE:          "Done",
  ERROR:         "Error",
};

function timeAgo(ts: number) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function AdminDashboardPage() {
  const stats      = useQuery(api.jobs.getAdminStats);
  const recentJobs = useQuery(api.jobs.listAll);
  const allUsers   = useQuery(api.users.listAllUsers);
  const retry      = useMutation(api.jobs.retryRender);

  const recent = recentJobs?.slice(0, 6) ?? [];

  // Active users = those with at least one QUEUED/RENDERING job
  const activeUsers = allUsers?.filter((u) => u.activeJobCount > 0) ?? [];
  // New users = registered in last 7 days
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const newUsers   = allUsers?.filter((u) => u._creationTime > oneWeekAgo) ?? [];

  const statCards = [
    { label: "Published Templates", value: stats?.publishedTemplates ?? "—", sub: `${stats?.totalTemplates ?? 0} total`,  icon: FileVideo,    color: "text-[#C3C0FF]",  bg: "bg-indigo-500/10" },
    { label: "Customers",           value: stats?.totalCustomers    ?? "—", sub: "registered",                            icon: Users,        color: "text-sky-400",    bg: "bg-sky-500/10"    },
    { label: "Total Jobs",          value: stats?.totalJobs         ?? "—", sub: "all time",                              icon: Film,         color: "text-gray-300",   bg: "bg-white/[0.06]"  },
    { label: "Rendering",           value: stats?.activeJobs        ?? "—", sub: "in queue / active",                    icon: Loader2,      color: "text-indigo-400", bg: "bg-indigo-500/10" },
    { label: "Awaiting Approval",   value: stats?.previewReady      ?? "—", sub: "preview ready",                        icon: Clock,        color: "text-amber-400",  bg: "bg-amber-500/10"  },
    { label: "Completed",           value: stats?.completedJobs     ?? "—", sub: "delivered",                            icon: CheckCircle2, color: "text-green-400",  bg: "bg-green-500/10"  },
  ];

  return (
    <AdminLayout>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#C3C0FF] mb-1">Overview</p>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        </div>
        <Link
          to="/admin/templates/new"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-600 text-white text-sm font-medium hover:brightness-110 active:scale-[0.98] transition-all"
        >
          <PlusCircle size={15} /> New Template
        </Link>
      </div>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        {statCards.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="bg-[#1e1e1e] rounded-2xl p-4">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-3", bg)}>
              <Icon size={15} className={color} />
            </div>
            <p className="text-2xl font-bold text-white leading-none mb-1">{value}</p>
            <p className="text-xs text-gray-500 leading-snug">{label}</p>
            <p className="text-xs text-gray-700 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Active users strip ── */}
      {activeUsers.length > 0 && (
        <div className="mb-6 bg-indigo-500/[0.06] rounded-2xl px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={13} className="text-[#C3C0FF]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#C3C0FF]">
              {activeUsers.length} user{activeUsers.length > 1 ? "s" : ""} currently rendering
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeUsers.map((u) => (
              <Link
                key={u._id}
                to={`/admin/users/${u._id}`}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1e1e1e] hover:bg-[#262626] transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                <span className="text-xs text-white">{u.name ?? u.email}</span>
                <span className="text-xs text-[#C3C0FF] font-semibold">{u.activeJobCount} job{u.activeJobCount > 1 ? "s" : ""}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Error alert ── */}
      {(stats?.errorJobs ?? 0) > 0 && (
        <div className="mb-6 flex items-center gap-3 bg-red-500/10 rounded-xl px-4 py-3">
          <AlertCircle size={16} className="text-red-400 shrink-0" />
          <p className="text-sm text-red-300">
            <span className="font-semibold">{stats!.errorJobs} job{stats!.errorJobs > 1 ? "s" : ""}</span> failed to render.
          </p>
        </div>
      )}

      {/* ── Two-col layout ── */}
      <div className="grid lg:grid-cols-[1fr_260px] gap-6">

        {/* ── Recent Jobs ── */}
        <div className="bg-[#1e1e1e] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="font-semibold text-white">Recent Jobs</h2>
            <Link to="/admin/users" className="text-xs text-[#C3C0FF] hover:underline flex items-center gap-1">
              All users <ArrowRight size={12} />
            </Link>
          </div>

          {recentJobs === undefined ? (
            <div className="px-5 pb-5 space-y-2">
              {[1,2,3,4].map((i) => <div key={i} className="h-14 bg-[#262626] rounded-xl animate-pulse" />)}
            </div>
          ) : recent.length === 0 ? (
            <div className="px-5 pb-10 text-center text-gray-600 text-sm">No jobs yet.</div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {recent.map((job) => (
                <div key={job._id} className="flex items-center gap-3 px-5 py-3 hover:bg-[#262626]/40 transition-colors">
                  {/* Thumbnail */}
                  <div className="w-14 h-9 rounded-lg overflow-hidden bg-[#262626] shrink-0">
                    {job.templateThumbnailUrl ? (
                      <img src={job.templateThumbnailUrl} alt={job.templateTitle} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film size={12} className="text-gray-600" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{job.templateTitle}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Link
                        to={`/admin/users/${job.ownerId}`}
                        className="text-xs text-[#C3C0FF] hover:underline truncate max-w-[140px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {job.ownerName ?? job.ownerEmail}
                      </Link>
                      <span className="text-gray-700 text-xs">·</span>
                      <span className="text-xs text-gray-600 shrink-0">{timeAgo(job._creationTime)}</span>
                    </div>
                  </div>

                  {/* Status */}
                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full shrink-0", STATUS_COLOR[job.renderStatus] ?? "bg-[#262626] text-gray-400")}>
                    {STATUS_LABEL[job.renderStatus] ?? job.renderStatus}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Link
                      to={`/admin/users/${job.ownerId}`}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-gray-300 hover:bg-[#333] transition-colors"
                      title="View user"
                    >
                      <ExternalLink size={12} />
                    </Link>
                    {(job.renderStatus === "ERROR" || job.renderStatus === "QUEUED") && (
                      <button
                        onClick={() => retry({ jobId: job._id as Id<"jobs"> })}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-[#C3C0FF] hover:bg-indigo-500/10 transition-colors"
                        title="Retry render"
                      >
                        <RotateCcw size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right column ── */}
        <div className="flex flex-col gap-4">

          {/* Quick actions */}
          <div className="bg-[#1e1e1e] rounded-2xl p-5">
            <h2 className="font-semibold text-white mb-4">Quick Actions</h2>
            <div className="flex flex-col gap-2">
              <Link to="/admin/templates/new" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 transition-colors group">
                <div className="w-7 h-7 rounded-lg bg-indigo-600/20 flex items-center justify-center shrink-0">
                  <PlusCircle size={13} className="text-[#C3C0FF]" />
                </div>
                <span className="text-sm font-medium text-white">New Template</span>
                <ArrowRight size={13} className="text-gray-600 ml-auto group-hover:text-[#C3C0FF] transition-colors" />
              </Link>
              <Link to="/admin/templates" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#262626] transition-colors group">
                <div className="w-7 h-7 rounded-lg bg-[#2a2a2a] flex items-center justify-center shrink-0">
                  <FileVideo size={13} className="text-gray-400" />
                </div>
                <span className="text-sm font-medium text-white">Manage Templates</span>
                <ArrowRight size={13} className="text-gray-600 ml-auto group-hover:text-gray-300 transition-colors" />
              </Link>
              <Link to="/admin/users" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#262626] transition-colors group">
                <div className="w-7 h-7 rounded-lg bg-[#2a2a2a] flex items-center justify-center shrink-0">
                  <Briefcase size={13} className="text-gray-400" />
                </div>
                <span className="text-sm font-medium text-white">All Users</span>
                <ArrowRight size={13} className="text-gray-600 ml-auto group-hover:text-gray-300 transition-colors" />
              </Link>
            </div>
          </div>

          {/* New users this week */}
          {newUsers.length > 0 && (
            <div className="bg-[#1e1e1e] rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-white mb-1">New This Week</h2>
              <p className="text-xs text-gray-600 mb-4">{newUsers.length} new user{newUsers.length > 1 ? "s" : ""}</p>
              <div className="flex flex-col gap-1">
                {newUsers.slice(0, 5).map((u) => (
                  <Link
                    key={u._id}
                    to={`/admin/users/${u._id}`}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#262626] transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-[#C3C0FF] uppercase">
                        {(u.name ?? u.email)[0]}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 truncate flex-1">{u.name ?? u.email}</span>
                    <span className="text-xs text-gray-700">{timeAgo(u._creationTime)}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Job breakdown */}
          {stats && (
            <div className="bg-[#1e1e1e] rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-white mb-4">Job Breakdown</h2>
              {[
                { label: "Completed",     value: stats.completedJobs, color: "bg-green-500"  },
                { label: "Preview Ready", value: stats.previewReady,  color: "bg-amber-500"  },
                { label: "Active",        value: stats.activeJobs,    color: "bg-indigo-500" },
                { label: "Errors",        value: stats.errorJobs,     color: "bg-red-500"    },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center gap-2 mb-2.5 last:mb-0">
                  <div className={cn("w-2 h-2 rounded-full shrink-0", color)} />
                  <span className="text-xs text-gray-500 flex-1">{label}</span>
                  <span className="text-xs font-semibold text-white">{value}</span>
                  {stats.totalJobs > 0 && (
                    <div className="w-16 h-1 bg-[#262626] rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", color)}
                        style={{ width: `${Math.round((value / stats.totalJobs) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
