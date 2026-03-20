import { useState } from "react";
import { useQuery } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import { ShopLayout } from "../../layouts/ShopLayout";
import { Loading } from "../../components/ui/Loading";
import { formatPrice, cn } from "../../lib/utils";
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
      {/* Mini-hero */}
      <div className="text-center py-12 mb-4 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-indigo-600/8 rounded-full blur-[80px]" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#C3C0FF] mb-3">Templates</p>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
          Elevate Your Content
        </h1>
        <p className="text-gray-500 max-w-md mx-auto mb-8">
          Explore our cinematic collection of high-end video templates curated for professionals.
        </p>

        {/* Search */}
        <div className="relative max-w-lg mx-auto">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search for templates, aesthetics, or themes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#1e1e1e] text-white placeholder:text-gray-600 text-sm focus:outline-none focus:ring-1 focus:ring-[#C3C0FF]/40"
          />
        </div>
      </div>

      {/* Category pills */}
      {categories !== undefined && (
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          <button
            onClick={() => setCategory("")}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
              category === ""
                ? "bg-indigo-600/30 text-[#C3C0FF] border border-[#C3C0FF]/30"
                : "bg-[#1e1e1e] text-gray-400 hover:text-gray-200 hover:bg-[#262626]"
            )}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c === category ? "" : c)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                category === c
                  ? "bg-indigo-600/30 text-[#C3C0FF] border border-[#C3C0FF]/30"
                  : "bg-[#1e1e1e] text-gray-400 hover:text-gray-200 hover:bg-[#262626]"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {templates === undefined ? (
        <Loading />
      ) : templates.length === 0 ? (
        <div className="text-center py-20 text-gray-600">
          {search || category ? "No templates match your filters." : "No templates available yet."}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {templates.map((t) => (
            <Link
              key={t._id}
              to={`/templates/${t._id}`}
              className="group bg-[#1e1e1e] rounded-xl overflow-hidden hover:bg-[#222222] transition-colors"
            >
              <div className="aspect-video bg-[#262626] overflow-hidden">
                {t.thumbnailUrl ? (
                  <img
                    src={t.thumbnailUrl}
                    alt={t.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-700 text-xs">
                    No preview
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h3 className="text-sm font-semibold text-white group-hover:text-[#C3C0FF] transition-colors leading-snug">
                    {t.title}
                  </h3>
                  <span className="text-sm font-bold text-[#C3C0FF] whitespace-nowrap">
                    {formatPrice(t.price, t.currency)}
                  </span>
                </div>
                <span className="inline-block text-xs bg-[#262626] text-gray-500 px-2 py-0.5 rounded-full">
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
