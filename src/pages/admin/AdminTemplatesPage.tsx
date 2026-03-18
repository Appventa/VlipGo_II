import { useQuery, useMutation } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { AdminLayout } from "../../layouts/AdminLayout";
import { Loading } from "../../components/ui/Loading";
import { Button } from "../../components/ui/Button";
import { formatPrice } from "../../lib/utils";
import { Plus, Pencil, Archive } from "lucide-react";

export function AdminTemplatesPage() {
  const templates = useQuery(api.templates.listAll);
  const archive = useMutation(api.templates.archive);

  async function handleArchive(templateId: Id<"templates">, title: string) {
    if (!confirm(`Archive "${title}"? It will be hidden from customers.`)) return;
    await archive({ templateId });
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Templates</h1>
        <Link to="/admin/templates/new">
          <Button size="sm">
            <Plus size={14} className="mr-1" /> New Template
          </Button>
        </Link>
      </div>

      {templates === undefined ? (
        <Loading />
      ) : templates.length === 0 ? (
        <div className="text-center py-20 text-gray-600">No templates yet. Create your first one.</div>
      ) : (
        <div className="bg-[#1a1a1a] rounded-xl border border-white/[0.08] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#141414] border-b border-white/[0.08]">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-400">Title</th>
                <th className="text-left px-4 py-3 font-medium text-gray-400">Category</th>
                <th className="text-left px-4 py-3 font-medium text-gray-400">Price</th>
                <th className="text-left px-4 py-3 font-medium text-gray-400">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {templates.map((t) => (
                <tr key={t._id} className="hover:bg-white/[0.03]">
                  <td className="px-4 py-3 font-medium text-white">{t.title}</td>
                  <td className="px-4 py-3 text-gray-500">{t.category}</td>
                  <td className="px-4 py-3 text-gray-500">{formatPrice(t.price, t.currency)}</td>
                  <td className="px-4 py-3">
                    {t.isArchived ? (
                      <span className="text-xs bg-white/[0.08] text-gray-500 px-2 py-0.5 rounded-full">Archived</span>
                    ) : t.isPublished ? (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Published</span>
                    ) : (
                      <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">Draft</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/admin/templates/${t._id}/edit`}>
                        <Button variant="ghost" size="sm"><Pencil size={14} /></Button>
                      </Link>
                      {!t.isArchived && (
                        <Button variant="ghost" size="sm" onClick={() => handleArchive(t._id, t.title)}>
                          <Archive size={14} />
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
