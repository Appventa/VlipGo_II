import { useState } from "react";
import { useQuery } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import { ShopLayout } from "../../layouts/ShopLayout";
import { Loading } from "../../components/ui/Loading";
import { formatPrice } from "../../lib/utils";
import { Search } from "lucide-react";

export function TemplatesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  const templates = useQuery(api.templates.listPublished, {
    search: search || undefined,
    category: category || undefined,
  });
  const categories = useQuery(api.templates.listCategories);

  return (
    <ShopLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Video Templates</h1>
        <p className="text-gray-400">Pick a template, customize it, and get your video in minutes.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search templates…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-white/[0.12] bg-[#1a1a1a] text-white placeholder:text-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 rounded-lg border border-white/[0.12] bg-[#1a1a1a] text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All categories</option>
          {categories?.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {templates === undefined ? (
        <Loading />
      ) : templates.length === 0 ? (
        <div className="text-center py-20 text-gray-600">
          {search || category ? "No templates match your filters." : "No templates available yet."}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((t) => (
            <Link
              key={t._id}
              to={`/templates/${t._id}`}
              className="group bg-[#1a1a1a] rounded-xl border border-white/[0.08] overflow-hidden hover:border-white/[0.16] transition-colors"
            >
              <div className="aspect-video bg-[#242424] overflow-hidden">
                {t.thumbnailUrl ? (
                  <img
                    src={t.thumbnailUrl}
                    alt={t.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm">
                    No preview
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">{t.title}</h3>
                  <span className="text-sm font-bold text-blue-400 whitespace-nowrap">
                    {formatPrice(t.price, t.currency)}
                  </span>
                </div>
                <span className="inline-block text-xs bg-white/[0.08] text-gray-400 px-2 py-0.5 rounded-full">
                  {t.category}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </ShopLayout>
  );
}
