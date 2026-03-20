import { useState } from "react";
import { useQuery } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import { AdminLayout } from "../../layouts/AdminLayout";
import { Loading } from "../../components/ui/Loading";
import { cn } from "../../lib/utils";
import { ImageIcon, Film, Layers, Pencil } from "lucide-react";

type Filter = "all" | "image" | "video";

const STATUS_DOT: Record<string, string> = {
  published: "bg-green-500",
  draft:     "bg-amber-500",
  archived:  "bg-gray-600",
};

export function AdminMediaPage() {
  const assets = useQuery(api.templates.listMediaAssets);
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = assets?.filter((a) => filter === "all" || a.type === filter) ?? [];
  const imageCount = assets?.filter((a) => a.type === "image").length ?? 0;
  const videoCount = assets?.filter((a) => a.type === "video").length ?? 0;

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#C3C0FF] mb-1">Admin Uploads</p>
          <h1 className="text-2xl font-bold text-white">Media Library</h1>
        </div>
        <p className="text-xs text-gray-600">Template thumbnails &amp; preview videos only — user render assets not shown</p>
      </div>

      {/* Type filter */}
      <div className="flex items-center gap-2 mb-6">
        {([
          ["all",   <Layers size={13} />,    `All (${(assets?.length ?? 0)})`],
          ["image", <ImageIcon size={13} />, `Images (${imageCount})`],
          ["video", <Film size={13} />,      `Videos (${videoCount})`],
        ] as [Filter, React.ReactNode, string][]).map(([val, icon, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              filter === val
                ? "bg-indigo-600/20 text-[#C3C0FF] ring-1 ring-[#C3C0FF]/30"
                : "bg-[#1e1e1e] text-gray-500 hover:text-gray-300"
            )}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {assets === undefined ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-24 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#1e1e1e] flex items-center justify-center mb-4">
            {filter === "video" ? <Film size={22} className="text-gray-600" /> : <ImageIcon size={22} className="text-gray-600" />}
          </div>
          <p className="text-gray-500 text-sm">
            {filter === "all" ? "No media assets yet." : `No ${filter}s uploaded yet.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((asset) => {
            const status = asset.isArchived ? "archived" : asset.isPublished ? "published" : "draft";
            return (
              <div key={asset.key} className="group bg-[#1e1e1e] rounded-2xl overflow-hidden">
                {/* Preview */}
                <div className="aspect-video bg-[#262626] overflow-hidden relative">
                  {asset.type === "image" ? (
                    <img
                      src={asset.url}
                      alt={asset.templateTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <video
                      src={asset.url}
                      className="w-full h-full object-cover"
                      muted
                      preload="metadata"
                      onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play()}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLVideoElement).pause(); (e.currentTarget as HTMLVideoElement).currentTime = 0; }}
                    />
                  )}

                  {/* Type badge */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded-md">
                    {asset.type === "image"
                      ? <ImageIcon size={10} className="text-white/70" />
                      : <Film size={10} className="text-white/70" />}
                    <span className="text-[10px] text-white/70 font-medium capitalize">{asset.type}</span>
                  </div>

                  {/* Status dot */}
                  <div className="absolute top-2 left-2 flex items-center gap-1">
                    <span className={cn("w-1.5 h-1.5 rounded-full", STATUS_DOT[status])} />
                  </div>

                  {/* Edit overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Link
                      to={`/admin/templates/${asset.templateId}/edit`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1e1e1e]/80 text-xs font-medium text-white hover:bg-[#1e1e1e] transition-colors"
                    >
                      <Pencil size={11} /> Edit Template
                    </Link>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="text-xs font-medium text-white truncate">{asset.templateTitle}</p>
                  <p className="text-[10px] text-gray-600 mt-0.5 capitalize">{asset.type} · {status}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
