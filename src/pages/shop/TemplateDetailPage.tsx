import { useQuery } from "convex/react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { ShopLayout } from "../../layouts/ShopLayout";
import { Loading } from "../../components/ui/Loading";
import { Button } from "../../components/ui/Button";
import { formatPrice } from "../../lib/utils";
import { useConvexAuth } from "convex/react";

export function TemplateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useConvexAuth();
  const template = useQuery(api.templates.getById, {
    templateId: id as Id<"templates">,
  });

  if (template === undefined) return <ShopLayout><Loading /></ShopLayout>;
  if (!template) return <ShopLayout><div className="py-20 text-center text-gray-500">Template not found.</div></ShopLayout>;

  return (
    <ShopLayout>
      <div className="max-w-3xl mx-auto">
        {/* Thumbnail */}
        <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden mb-8">
          {template.thumbnailUrl ? (
            <img src={template.thumbnailUrl} alt={template.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">No preview</div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <span className="inline-block text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full mb-2">
              {template.category}
            </span>
            <h1 className="text-3xl font-bold text-gray-900">{template.title}</h1>
          </div>
          <div className="flex flex-col items-end gap-3">
            <span className="text-3xl font-bold text-blue-600">
              {formatPrice(template.price, template.currency)}
            </span>
            <Link to={isAuthenticated ? `/templates/${template._id}/customize` : `/login`}>
              <Button size="lg">
                {isAuthenticated ? "Customize →" : "Sign in to Customize"}
              </Button>
            </Link>
          </div>
        </div>

        <p className="text-gray-600 leading-relaxed mb-6">{template.description}</p>

        {template.fields.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-6">
            <h2 className="font-semibold text-gray-900 mb-3">What you can customize</h2>
            <ul className="flex flex-col gap-2">
              {template.fields.map((f) => (
                <li key={f._id} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                  <span>{f.label}</span>
                  <span className="text-xs text-gray-400 ml-auto">{f.type}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </ShopLayout>
  );
}
