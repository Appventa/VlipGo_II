import { useQuery } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import { AdminLayout } from "../../layouts/AdminLayout";
import { Loading } from "../../components/ui/Loading";
import { cn } from "../../lib/utils";
import { ImageIcon, Pencil, Eye, EyeOff, Archive as ArchiveIcon } from "lucide-react";

const STATUS_BADGE: Record<string, string> = {
  published: "bg-green-500/20 text-green-400",
  draft:     "bg-amber-500/20 text-amber-400",
  archived:  "bg-[#262626] text-gray-600",
};

export function AdminMediaPage() {
  const assets = useQuery(api.templates.listMediaAssets);

  const count = assets?.length ?? 0;

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#C3C0FF] mb-1">Assets</p>
          <h1 className="text-2xl font-bold text-white">Media Assets</h1>
        </div>
        {assets && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1e1e1e]">
            <ImageIcon size={13} className="text-[#C3C0FF]" />
            <span className="text-sm text-gray-400">{count} thumbnail{count !== 1 ? "s" : ""}</span>
          </div>
        )}
      </div>

      {/* Note */}
      <p className="text-xs text-gray-600 mb-6">
        Thumbnails uploaded for admin-managed templates only. User uploads are not shown here.
      </p>

      {assets === undefined ? (
        <Loading />
      ) : assets.length === 0 ? (
        <div className="flex flex-col items-center py-24 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#1e1e1e] flex items-center justify-center mb-4">
            <ImageIcon size={22} className="text-gray-600" />
          </div>
          <p className="text-gray-500 text-sm mb-2">No media assets yet.</p>
          <p className="text-gray-700 text-xs">Upload thumbnails when creating or editing templates.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {assets.map((asset) => {
            const status = asset.isArchived ? "archived" : asset.isPublished ? "published" : "draft";
            return (
              <div key={asset._id} className="group bg-[#1e1e1e] rounded-2xl overflow-hidden">
                {/* Image */}
                <div className="aspect-video bg-[#262626] overflow-hidden relative">
                  {asset.thumbnailUrl ? (
                    <img
                      src={asset.thumbnailUrl}
                      alt={asset.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon size={24} className="text-gray-700" />
                    </div>
                  )}

                  {/* Status badge overlay */}
                  <div className="absolute top-2 left-2">
                    <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-md backdrop-blur-sm", STATUS_BADGE[status])}>
                      {status === "published" && <><Eye size={8} className="inline mr-0.5" />Live</>}
                      {status === "draft"     && <><EyeOff size={8} className="inline mr-0.5" />Draft</>}
                      {status === "archived"  && <><ArchiveIcon size={8} className="inline mr-0.5" />Archived</>}
                    </span>
                  </div>

                  {/* Edit overlay on hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Link
                      to={`/admin/templates/${asset._id}/edit`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1e1e1e]/80 text-xs font-medium text-white hover:bg-[#1e1e1e] transition-colors"
                    >
                      <Pencil size={11} /> Edit Template
                    </Link>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="text-sm font-medium text-white truncate">{asset.title}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
