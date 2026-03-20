import { useQuery } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import { ShopLayout } from "../../layouts/ShopLayout";
import { Button } from "../../components/ui/Button";
import { FavoriteButton } from "../../components/ui/FavoriteButton";
import { formatPrice, cn } from "../../lib/utils";
import {
  ArrowRight, LayoutGrid, Heart, Film,
  Clock, CheckCircle2, AlertCircle, Loader2,
} from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  DONE:          "bg-green-500/20 text-green-400",
  PREVIEW_READY: "bg-amber-500/20 text-amber-400",
  RENDERING:     "bg-indigo-500/20 text-[#C3C0FF]",
  QUEUED:        "bg-indigo-500/20 text-[#C3C0FF]",
  ERROR:         "bg-red-500/20 text-red-400",
};
const STATUS_LABELS: Record<string, string> = {
  DONE:          "Done",
  PREVIEW_READY: "Preview Ready",
  RENDERING:     "Rendering",
  QUEUED:        "Queued",
  ERROR:         "Error",
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const hr = Math.floor(m / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

export function DashboardPage() {
  const user      = useQuery(api.users.currentUser);
  const jobs      = useQuery(api.jobs.listByUser);
  const favorites = useQuery(api.favorites.listFavoriteTemplates);

  const displayName = user?.name ?? user?.email?.split("@")[0] ?? "there";

  // Derived stats
  const totalJobs   = jobs?.length ?? 0;
  const activeJobs  = jobs?.filter((j) => j.renderStatus === "QUEUED" || j.renderStatus === "RENDERING").length ?? 0;
  const previewing  = jobs?.filter((j) => j.renderStatus === "PREVIEW_READY").length ?? 0;
  const completed   = jobs?.filter((j) => j.renderStatus === "DONE").length ?? 0;

  const recentJobs = jobs?.slice(0, 4) ?? [];

  const stats = [
    { label: "Total Projects", value: totalJobs,  icon: Film,         color: "text-[#C3C0FF]", bg: "bg-indigo-500/10" },
    { label: "Rendering",      value: activeJobs, icon: Loader2,      color: "text-indigo-400", bg: "bg-indigo-500/10" },
    { label: "Preview Ready",  value: previewing, icon: Clock,        color: "text-amber-400",  bg: "bg-amber-500/10"  },
    { label: "Completed",      value: completed,  icon: CheckCircle2, color: "text-green-400",  bg: "bg-green-500/10"  },
  ];

  return (
    <ShopLayout>
      {/* ── Welcome ── */}
      <div className="mb-8 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-[500px] h-[160px] bg-indigo-600/8 rounded-full blur-[80px]" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#C3C0FF] mb-2">Dashboard</p>
        <h1 className="text-3xl font-bold text-white">{greeting()}, {displayName} 👋</h1>
        <p className="text-gray-500 mt-1">Here's an overview of your creative projects.</p>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-[#1e1e1e] rounded-2xl p-5 flex items-center gap-4">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", bg)}>
              <Icon size={18} className={color} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main grid: Recent jobs + Quick actions ── */}
      <div className="grid lg:grid-cols-[1fr_280px] gap-6 mb-8">

        {/* Recent projects */}
        <div className="bg-[#1e1e1e] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-white">Recent Projects</h2>
            <Link to="/orders" className="text-xs text-[#C3C0FF] hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>

          {jobs === undefined ? (
            <div className="space-y-3">
              {[1,2,3].map((i) => (
                <div key={i} className="h-14 bg-[#262626] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : recentJobs.length === 0 ? (
            <div className="py-10 text-center">
              <Film size={28} className="text-gray-700 mx-auto mb-3" />
              <p className="text-gray-600 text-sm">No projects yet.</p>
              <Link to="/templates" className="mt-3 inline-block">
                <Button size="sm" className="gap-1.5 mt-2">Browse Templates <ArrowRight size={13} /></Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {recentJobs.map((job) => (
                <Link
                  key={job._id}
                  to={`/orders/${job._id}`}
                  className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-[#262626] transition-colors group"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-10 rounded-lg overflow-hidden bg-[#262626] shrink-0">
                    {job.templateThumbnailUrl ? (
                      <img
                        src={job.templateThumbnailUrl}
                        alt={job.templateTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film size={13} className="text-gray-600" />
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate group-hover:text-[#C3C0FF] transition-colors leading-snug">
                      {job.templateTitle}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {job.templateCategory && (
                        <span className="text-xs text-gray-600 truncate">{job.templateCategory}</span>
                      )}
                      <span className="text-xs text-gray-700">·</span>
                      <span className="text-xs text-gray-600">{timeAgo(job._creationTime)}</span>
                    </div>
                  </div>
                  {/* Status */}
                  <span className={cn(
                    "text-xs font-medium px-2.5 py-1 rounded-full shrink-0",
                    STATUS_STYLES[job.renderStatus] ?? "bg-gray-500/20 text-gray-400"
                  )}>
                    {STATUS_LABELS[job.renderStatus] ?? job.renderStatus}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="flex flex-col gap-4">
          <div className="bg-[#1e1e1e] rounded-2xl p-6">
            <h2 className="font-semibold text-white mb-4">Quick Actions</h2>
            <div className="flex flex-col gap-3">
              <Link to="/templates" className="block">
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 transition-colors text-left group">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center shrink-0">
                    <LayoutGrid size={14} className="text-[#C3C0FF]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Browse Templates</p>
                    <p className="text-xs text-gray-500">Find your next video</p>
                  </div>
                  <ArrowRight size={14} className="text-gray-600 ml-auto group-hover:text-[#C3C0FF] transition-colors" />
                </button>
              </Link>
              <Link to="/orders" className="block">
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[#262626] hover:bg-[#2a2a2a] transition-colors text-left group">
                  <div className="w-8 h-8 rounded-lg bg-[#333] flex items-center justify-center shrink-0">
                    <Film size={14} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">My Orders</p>
                    <p className="text-xs text-gray-500">All your projects</p>
                  </div>
                  <ArrowRight size={14} className="text-gray-600 ml-auto group-hover:text-gray-300 transition-colors" />
                </button>
              </Link>
            </div>
          </div>

          {/* Active job alert */}
          {activeJobs > 0 && (
            <div className="bg-indigo-600/10 border border-[#C3C0FF]/15 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Loader2 size={14} className="text-[#C3C0FF] animate-spin" />
                <p className="text-sm font-semibold text-white">Rendering in progress</p>
              </div>
              <p className="text-xs text-gray-500">
                {activeJobs} job{activeJobs > 1 ? "s" : ""} currently rendering. We'll have it ready soon.
              </p>
            </div>
          )}

          {previewing > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle size={14} className="text-amber-400" />
                <p className="text-sm font-semibold text-white">Preview awaiting approval</p>
              </div>
              <p className="text-xs text-gray-500">
                {previewing} preview{previewing > 1 ? "s" : ""} ready for you to review.
              </p>
              <Link to="/orders" className="mt-2 inline-block text-xs text-amber-400 hover:underline">
                Review now →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Favorites ── */}
      <div>
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C3C0FF] mb-2">Saved</p>
            <h2 className="text-xl font-bold text-white">Your Favorites</h2>
          </div>
          <Link to="/templates" className="text-sm text-[#C3C0FF] hover:underline flex items-center gap-1">
            Browse more <ArrowRight size={13} />
          </Link>
        </div>

        {favorites === undefined ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map((i) => (
              <div key={i} className="aspect-video bg-[#1e1e1e] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="bg-[#1e1e1e] rounded-2xl p-10 text-center">
            <Heart size={28} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No favorites yet.</p>
            <p className="text-gray-600 text-xs mt-1">
              Click the <Heart size={11} className="inline" /> on any template to save it here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {favorites.map((t) => (
              <div key={t._id} className="relative group">
                <Link
                  to={`/templates/${t._id}`}
                  className="block bg-[#1e1e1e] rounded-xl overflow-hidden hover:bg-[#222] transition-colors"
                >
                  <div className="aspect-video bg-[#262626] overflow-hidden">
                    {t.thumbnailUrl ? (
                      <img
                        src={t.thumbnailUrl}
                        alt={t.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-700 text-xs">No preview</div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-white group-hover:text-[#C3C0FF] transition-colors truncate">{t.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{formatPrice(t.price, t.currency)}</p>
                  </div>
                </Link>
                <div className="absolute top-2.5 right-2.5">
                  <FavoriteButton templateId={t._id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ShopLayout>
  );
}
