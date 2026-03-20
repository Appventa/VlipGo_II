import { useQuery, useMutation } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { AdminLayout } from "../../layouts/AdminLayout";
import { Loading } from "../../components/ui/Loading";
import { formatPrice, cn } from "../../lib/utils";
import { Plus, Pencil, Archive, ImageIcon, Eye, EyeOff } from "lucide-react";

export function AdminTemplatesPage() {
  const templates = useQuery(api.templates.listAll);
  const archive   = useMutation(api.templates.archive);

  async function handleArchive(templateId: Id<"templates">, title: string) {
    if (!confirm(`Archive "${title}"? It will be hidden from customers.`)) return;
    await archive({ templateId });
  }

  const published = templates?.filter((t) => t.isPublished && !t.isArchived) ?? [];
  const drafts    = templates?.filter((t) => !t.isPublished && !t.isArchived) ?? [];
  const archived  = templates?.filter((t) => t.isArchived) ?? [];

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#C3C0FF] mb-1">Catalog</p>
          <h1 className="text-2xl font-bold text-white">Templates</h1>
        </div>
        <Link
          to="/admin/templates/new"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-600 text-white text-sm font-medium hover:brightness-110 active:scale-[0.98] transition-all"
        >
          <Plus size={14} /> New Template
        </Link>
      </div>

      {templates === undefined ? (
        <Loading />
      ) : templates.length === 0 ? (
        <div className="text-center py-24 text-gray-600 text-sm">No templates yet.</div>
      ) : (
        <div className="flex flex-col gap-6">
          {published.length > 0 && (
            <TemplateGroup label="Published" count={published.length} templates={published} onArchive={handleArchive} />
          )}
          {drafts.length > 0 && (
            <TemplateGroup label="Drafts" count={drafts.length} templates={drafts} onArchive={handleArchive} />
          )}
          {archived.length > 0 && (
            <TemplateGroup label="Archived" count={archived.length} templates={archived} onArchive={handleArchive} dimmed />
          )}
        </div>
      )}
    </AdminLayout>
  );
}

interface TemplateMeta {
  _id: Id<"templates">;
  title: string;
  category: string;
  price: number;
  currency: string;
  isPublished: boolean;
  isArchived: boolean;
  thumbnailUrl?: string | null;
  tags: string[];
}

function TemplateGroup({
  label, count, templates, onArchive, dimmed,
}: {
  label: string;
  count: number;
  templates: TemplateMeta[];
  onArchive: (id: Id<"templates">, title: string) => void;
  dimmed?: boolean;
}) {
  const labelColor =
    label === "Published" ? "text-green-400" :
    label === "Drafts"    ? "text-amber-400" : "text-gray-600";

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className={cn("text-xs font-semibold uppercase tracking-widest", labelColor)}>{label}</span>
        <span className="text-xs text-gray-700">({count})</span>
      </div>
      <div className={cn("bg-[#1e1e1e] rounded-2xl overflow-hidden", dimmed && "opacity-60")}>
        <table className="w-full text-sm">
          <thead className="bg-[#191919]">
            <tr>
              <th className="w-16 px-4 py-3" />
              <th className="text-left px-4 py-3 font-medium text-gray-500">Title</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Category</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Price</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {templates.map((t, i) => (
              <tr
                key={t._id}
                className={cn(
                  "transition-colors hover:bg-[#262626]/40",
                  i % 2 === 0 ? "bg-[#1e1e1e]" : "bg-[#1a1a1a]"
                )}
              >
                {/* Thumbnail */}
                <td className="px-4 py-3">
                  <div className="w-14 h-9 rounded-lg overflow-hidden bg-[#262626] flex items-center justify-center">
                    {t.thumbnailUrl ? (
                      <img src={t.thumbnailUrl} alt={t.title} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={12} className="text-gray-700" />
                    )}
                  </div>
                </td>

                {/* Title + tags */}
                <td className="px-4 py-3">
                  <p className="font-medium text-white">{t.title}</p>
                  {t.tags.length > 0 && (
                    <p className="text-xs text-gray-700 mt-0.5 truncate max-w-[180px]">{t.tags.join(", ")}</p>
                  )}
                </td>

                <td className="px-4 py-3 text-gray-500">{t.category}</td>
                <td className="px-4 py-3 text-gray-400 font-medium">{formatPrice(t.price, t.currency)}</td>

                {/* Status */}
                <td className="px-4 py-3">
                  {t.isArchived ? (
                    <span className="text-xs bg-[#262626] text-gray-600 px-2 py-0.5 rounded-full">Archived</span>
                  ) : t.isPublished ? (
                    <span className="inline-flex items-center gap-1 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                      <Eye size={10} /> Published
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                      <EyeOff size={10} /> Draft
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      to={`/admin/templates/${t._id}/edit`}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-[#C3C0FF] hover:bg-indigo-500/10 transition-colors"
                      title="Edit"
                    >
                      <Pencil size={13} />
                    </Link>
                    {!t.isArchived && (
                      <button
                        onClick={() => onArchive(t._id, t.title)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Archive"
                      >
                        <Archive size={13} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
